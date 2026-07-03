import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Board } from "./models";

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const roomUsers = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", async (roomId: string) => {
    socket.join(roomId);

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId)?.add(socket.id);

    // --- HYDRATION: Fetch board from DB and send to the user who just joined ---
    try {
      let board = await Board.findOne({ boardId: roomId });
      if (!board) {
        // Create the board if it doesn't exist yet
        board = await Board.create({ boardId: roomId, elements: [] });
      }
      // Send the saved elements strictly to the user who joined
      socket.emit("board-state", board.elements);
    } catch (error) {
      console.error("Error fetching board state:", error);
    }

    socket.to(roomId).emit("user-joined", socket.id);
  });

  // --- Transient Events (Unchanged) ---
  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-move", { userId: socket.id, x, y });
  });

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
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
