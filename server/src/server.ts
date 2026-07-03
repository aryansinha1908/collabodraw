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
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const roomUsers = new Map<string, Set<string>>();

// --- SOCKET AUTHENTICATION MIDDLEWARE ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "super_secret_hackathon_key_change_later",
    ) as any;
    // Attach the user's username to the socket data so we can use it later!
    socket.data.username = decoded.username;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", async (roomId: string) => {
    try {
      // 1. Check if the board actually exists
      const board = await Board.findOne({ boardId: roomId });
      if (!board) {
        return socket.emit(
          "join-error",
          "Board not found. Please check the link.",
        );
      }

      // 2. Check room capacity
      const currentRoomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      if (currentRoomSize >= board.maxUsers) {
        return socket.emit("join-error", "Board is at maximum capacity.");
      }

      // 3. Allow them in!
      socket.join(roomId);

      if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Set());
      roomUsers.get(roomId)?.add(socket.id);

      socket.emit("board-state", board.elements);
      socket.to(roomId).emit("user-joined", socket.id);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("join-error", "Server error while joining board.");
    }
  });

  // --- Transient Events (Unchanged) ---
  socket.on("draw-start", ({ roomId, element }) => {
    socket.to(roomId).emit("draw-start", { userId: socket.id, element });
  });

  socket.on("draw-move", ({ roomId, element }) => {
    socket.to(roomId).emit("draw-move", { userId: socket.id, element });
  });

  // --- Persistent Events (Now saving to MongoDB) ---
  socket.on("draw-end", async ({ roomId, element }) => {
    socket.to(roomId).emit("draw-end", element);
    try {
      // Push the new element to the board's elements array
      await Board.findOneAndUpdate(
        { boardId: roomId },
        { $push: { elements: element } },
        { upsert: true },
      );
    } catch (error) {
      console.error("Failed to save element:", error);
    }
  });

  socket.on("clear-board", async (roomId: string) => {
    socket.to(roomId).emit("clear-board");
    try {
      // Wipe the elements array in the DB
      await Board.findOneAndUpdate(
        { boardId: roomId },
        { $set: { elements: [] } },
      );
    } catch (error) {
      console.error("Failed to clear board in DB:", error);
    }
  });

  socket.on("undo", async (roomId: string) => {
    socket.to(roomId).emit("undo");
    try {
      // Remove the very last element from the DB array (Global Undo)
      await Board.findOneAndUpdate(
        { boardId: roomId },
        { $pop: { elements: 1 } },
      );
    } catch (error) {
      console.error("Failed to undo in DB:", error);
    }
  });

  socket.on("redo", (roomId: string) => {
    socket.to(roomId).emit("redo");
    // Note for Hackathon: Redo persistence requires storing the redo stack in DB
    // or rewriting the whole array. For speed, we just broadcast it for now.
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    roomUsers.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);
      }
    });
  });

  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-move", {
      userId: socket.id,
      x,
      y,
      username: socket.data.username,
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
