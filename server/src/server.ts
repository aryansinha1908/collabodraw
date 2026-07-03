import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// A simple in-memory store for active users per room (Transient State)
const roomUsers = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Track users in room
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId)?.add(socket.id);

    // Let others know a new user joined
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // --- Transient Events (Previews & Cursors) ---
  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-move", { userId: socket.id, x, y });
  });

  socket.on("draw-start", ({ roomId, element }) => {
    socket.to(roomId).emit("draw-start", { userId: socket.id, element });
  });

  socket.on("draw-move", ({ roomId, element }) => {
    socket.to(roomId).emit("draw-move", { userId: socket.id, element });
  });

  // --- Persistent Events (Finalized board state, will be saved to DB in Phase 3) ---
  socket.on("draw-end", ({ roomId, element }) => {
    socket.to(roomId).emit("draw-end", element);
  });

  socket.on("undo", (roomId: string) => {
    socket.to(roomId).emit("undo");
  });

  socket.on("redo", (roomId: string) => {
    socket.to(roomId).emit("redo");
  });

  socket.on("clear-board", (roomId: string) => {
    socket.to(roomId).emit("clear-board");
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove user from rooms and notify others
    roomUsers.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});
