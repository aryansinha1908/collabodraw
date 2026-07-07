"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("./models");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./routes/auth");
const boards_1 = require("./routes/boards");
const cookie_1 = __importDefault(require("cookie"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/auth", auth_1.authRouter);
app.use("/boards", boards_1.boardsRouter);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
const roomUsers = new Map();
io.use((socket, next) => {
    try {
        const rawCookies = socket.handshake.headers.cookie;
        if (!rawCookies)
            return next(new Error("Authentication error"));
        const parsedCookies = cookie_1.default.parseCookie(rawCookies);
        const token = parsedCookies.draw_token;
        if (!token)
            return next(new Error("Authentication error"));
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        socket.data.user = decoded;
        next();
    }
    catch (err) {
        next(new Error("Authentication error"));
    }
});
// Upgraded to extract permission states from the socket objects
const getRoomUsers = (roomId) => {
    const users = [];
    const socketIds = roomUsers.get(roomId) || new Set();
    for (const id of socketIds) {
        const socket = io.sockets.sockets.get(id);
        if (socket && socket.data.user?.username) {
            users.push({
                id,
                username: socket.data.user.username, // <-- FIXED
                isOwner: socket.data.isOwner || false,
                canEdit: socket.data.canEdit || false,
            });
        }
    }
    return users;
};
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Helper function to safely join a user into the room state
    const completeJoin = (targetSocket, roomId, board, isOwner, canEdit) => {
        targetSocket.join(roomId);
        targetSocket.data.isOwner = isOwner;
        targetSocket.data.canEdit = canEdit;
        if (!roomUsers.has(roomId))
            roomUsers.set(roomId, new Set());
        roomUsers.get(roomId)?.add(targetSocket.id);
        targetSocket.emit("board-state", board.elements);
        targetSocket.emit("join-approved"); // Resolves the loading toast
        targetSocket.to(roomId).emit("user-joined", targetSocket.id);
        io.to(roomId).emit("room-users", getRoomUsers(roomId));
    };
    socket.on("join-room", async (roomId) => {
        try {
            const currentUser = socket.data.user;
            const board = await models_1.Board.findOne({ boardId: roomId });
            // console.log(currentUser, board);
            if (!board)
                return socket.emit("join-error", "Board not found. Please check the link.");
            const room = io.sockets.adapter.rooms.get(roomId);
            const currentUsersCount = room ? room.size : 0;
            if (currentUsersCount >= board.maxUsers && !room?.has(socket.id)) {
                socket.emit("join-error", `This board has reached its maximum limit of ${board.maxUsers} participants.`);
                return; // Block them from joining!
            }
            const isOwner = board.ownerId?.toString() === currentUser.userId?.toString();
            // --- PRIVATE BOARD INTERCEPTION ---
            if (board.isPrivate && !isOwner) {
                const room = roomUsers.get(roomId);
                let ownerSocketId = null;
                // Search the room for the owner's socket
                if (room) {
                    for (const id of room) {
                        const s = io.sockets.sockets.get(id);
                        if (s?.data.isOwner) {
                            ownerSocketId = id;
                            break;
                        }
                    }
                }
                if (!ownerSocketId) {
                    return socket.emit("join-error", "This is a private board and the owner is currently offline.");
                }
                // Put the joining user in a waiting state and alert the owner
                socket.emit("waiting-approval");
                io.to(ownerSocketId).emit("join-request", {
                    socketId: socket.id,
                    username: currentUser.username,
                    roomId,
                });
                return;
            }
            // Public board or Owner joining -> Let them straight in
            completeJoin(socket, roomId, board, isOwner, isOwner);
            if (isOwner) {
                socket.to(roomId).emit("owner-connected");
            }
        }
        catch (error) {
            console.error("Error joining room:", error);
            socket.emit("join-error", "Server error while joining board.");
        }
    });
    // --- PERMISSION HANDLERS ---
    socket.on("approve-join", async ({ targetSocketId, roomId }) => {
        if (!socket.data.isOwner)
            return; // Only owner can approve
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (!targetSocket)
            return;
        const board = await models_1.Board.findOne({ boardId: roomId });
        if (board) {
            completeJoin(targetSocket, roomId, board, false, false); // By default, they join as view-only (canEdit = false)
        }
    });
    socket.on("reject-join", ({ targetSocketId }) => {
        if (!socket.data.isOwner)
            return;
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
            targetSocket.emit("join-error", "The board owner rejected your request to join.");
        }
    });
    socket.on("update-permission", ({ targetSocketId, canEdit, roomId }) => {
        if (!socket.data.isOwner)
            return; // Security check
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
            targetSocket.data.canEdit = canEdit;
            io.to(roomId).emit("room-users", getRoomUsers(roomId)); // Update UI for everyone
            targetSocket.emit("permission-changed", canEdit); // Alert the user
        }
    });
    // --- STANDARD EVENTS ---
    socket.on("draw-start", ({ roomId, element }) => socket.to(roomId).emit("draw-start", { userId: socket.id, element }));
    socket.on("draw-move", ({ roomId, element }) => socket.to(roomId).emit("draw-move", { userId: socket.id, element }));
    socket.on("draw-end", async ({ roomId, element }) => {
        socket.to(roomId).emit("draw-end", element);
        try {
            await models_1.Board.findOneAndUpdate({ boardId: roomId }, { $push: { elements: element } }, { upsert: true });
        }
        catch (error) { }
    });
    socket.on("clear-board", async (roomId) => {
        socket.to(roomId).emit("clear-board");
        try {
            await models_1.Board.findOneAndUpdate({ boardId: roomId }, { $set: { elements: [] } });
        }
        catch (error) { }
    });
    socket.on("undo", async ({ roomId, userId }) => {
        socket.to(roomId).emit("undo", userId);
        try {
            const board = await models_1.Board.findOne({ boardId: roomId });
            if (!board)
                return;
            const lastUserElementIndex = board.elements
                .map((e) => e.createdBy)
                .lastIndexOf(userId);
            if (lastUserElementIndex !== -1) {
                board.elements.splice(lastUserElementIndex, 1);
                await board.save();
            }
        }
        catch (error) { }
    });
    socket.on("redo", (roomId) => socket.to(roomId).emit("redo"));
    socket.on("cursor-move", ({ roomId, x, y }) => {
        socket.to(roomId).emit("cursor-move", {
            userId: socket.data.user.userId,
            x,
            y,
            username: socket.data.user?.username,
        });
    });
    socket.on("disconnect", async () => {
        for (const [roomId, users] of Array.from(roomUsers.entries())) {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                io.to(roomId).emit("room-users", getRoomUsers(roomId));
                io.to(roomId).emit("user-left", socket.id);
                if (socket.data.isOwner) {
                    io.to(roomId).emit("owner-disconnected");
                }
            }
        }
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
