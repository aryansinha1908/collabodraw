import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Board } from "./models";
import jwt from "jsonwebtoken";
import { authRouter } from "./routes/auth";
import { boardsRouter } from "./routes/boards";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/auth", authRouter);
app.use("/boards", boardsRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const roomUsers = new Map<string, Set<string>>();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token provided"));
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "aryansinha1908",
    ) as any;
    socket.data.username = decoded.username;
    socket.data.userId = decoded.userId || decoded.id || decoded._id;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Upgraded to extract permission states from the socket objects
const getRoomUsers = (roomId: string) => {
  const users: {
    id: string;
    username: string;
    isOwner: boolean;
    canEdit: boolean;
  }[] = [];
  const socketIds = roomUsers.get(roomId) || new Set();
  for (const id of socketIds) {
    const socket = io.sockets.sockets.get(id);
    if (socket && socket.data.username) {
      users.push({
        id,
        username: socket.data.username,
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
  const completeJoin = (
    targetSocket: any,
    roomId: string,
    board: any,
    isOwner: boolean,
    canEdit: boolean,
  ) => {
    targetSocket.join(roomId);
    targetSocket.data.isOwner = isOwner;
    targetSocket.data.canEdit = canEdit;

    if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Set());
    roomUsers.get(roomId)?.add(targetSocket.id);

    targetSocket.emit("board-state", board.elements);
    targetSocket.emit("join-approved"); // Resolves the loading toast
    targetSocket.to(roomId).emit("user-joined", targetSocket.id);
    io.to(roomId).emit("room-users", getRoomUsers(roomId));
  };

  socket.on("join-room", async (roomId: string) => {
    try {
      const board = await Board.findOne({ boardId: roomId });
      if (!board)
        return socket.emit(
          "join-error",
          "Board not found. Please check the link.",
        );

      const currentRoomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      if (currentRoomSize >= board.maxUsers)
        return socket.emit("join-error", "Board is at maximum capacity.");

      const isOwner =
        board.ownerId &&
        socket.data.userId &&
        board.ownerId.toString() === socket.data.userId.toString();

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
          return socket.emit(
            "join-error",
            "This is a private board and the owner is currently offline.",
          );
        }

        // Put the joining user in a waiting state and alert the owner
        socket.emit("waiting-approval");
        io.to(ownerSocketId).emit("join-request", {
          socketId: socket.id,
          username: socket.data.username,
          roomId,
        });
        return;
      }

      // Public board or Owner joining -> Let them straight in
      completeJoin(socket, roomId, board, isOwner, isOwner);

      if (isOwner) {
        socket.to(roomId).emit("owner-connected");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("join-error", "Server error while joining board.");
    }
  });

  // --- PERMISSION HANDLERS ---
  socket.on("approve-join", async ({ targetSocketId, roomId }) => {
    if (!socket.data.isOwner) return; // Only owner can approve
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!targetSocket) return;

    const board = await Board.findOne({ boardId: roomId });
    if (board) {
      completeJoin(targetSocket, roomId, board, false, false); // By default, they join as view-only (canEdit = false)
    }
  });

  socket.on("reject-join", ({ targetSocketId }) => {
    if (!socket.data.isOwner) return;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit(
        "join-error",
        "The board owner rejected your request to join.",
      );
    }
  });

  socket.on("update-permission", ({ targetSocketId, canEdit, roomId }) => {
    if (!socket.data.isOwner) return; // Security check
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.data.canEdit = canEdit;
      io.to(roomId).emit("room-users", getRoomUsers(roomId)); // Update UI for everyone
      targetSocket.emit("permission-changed", canEdit); // Alert the user
    }
  });

  // --- STANDARD EVENTS ---
  socket.on("draw-start", ({ roomId, element }) =>
    socket.to(roomId).emit("draw-start", { userId: socket.id, element }),
  );
  socket.on("draw-move", ({ roomId, element }) =>
    socket.to(roomId).emit("draw-move", { userId: socket.id, element }),
  );
  socket.on("draw-end", async ({ roomId, element }) => {
    socket.to(roomId).emit("draw-end", element);
    try {
      await Board.findOneAndUpdate(
        { boardId: roomId },
        { $push: { elements: element } },
        { upsert: true },
      );
    } catch (error) {}
  });

  socket.on("clear-board", async (roomId: string) => {
    socket.to(roomId).emit("clear-board");
    try {
      await Board.findOneAndUpdate(
        { boardId: roomId },
        { $set: { elements: [] } },
      );
    } catch (error) {}
  });

  socket.on("undo", async ({ roomId, userId }) => {
    socket.to(roomId).emit("undo", userId);
    try {
      const board = await Board.findOne({ boardId: roomId });
      if (!board) return;
      const lastUserElementIndex = board.elements
        .map((e: any) => e.createdBy)
        .lastIndexOf(userId);
      if (lastUserElementIndex !== -1) {
        board.elements.splice(lastUserElementIndex, 1);
        await board.save();
      }
    } catch (error) {}
  });

  socket.on("redo", (roomId: string) => socket.to(roomId).emit("redo"));
  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-move", {
      userId: socket.id,
      x,
      y,
      username: socket.data.username,
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
