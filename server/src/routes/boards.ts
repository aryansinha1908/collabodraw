import express from "express";
import jwt from "jsonwebtoken";
import { Board } from "../models";
import authMiddleware from "../middlewares/auth";

export const boardsRouter = express.Router();

// GET: Fetch all boards for the logged-in user's dashboard
boardsRouter.get("/my-boards", authMiddleware, async (req: any, res) => {
  try {
    const boards = await Board.find({ ownerId: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// POST: Create a new board with settings
boardsRouter.post("/", authMiddleware, async (req: any, res) => {
  try {
    const { title, maxUsers, isPrivate } = req.body;

    // --- FIX: The Collision Retry Loop ---
    let boardId = "";
    let isUnique = false;

    // Keep generating until we find an ID that doesn't exist in the database
    while (!isUnique) {
      boardId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingBoard = await Board.findOne({ boardId });
      if (!existingBoard) {
        isUnique = true; // Break the loop!
      }
    }

    // console.log(req.user);

    const newBoard = new Board({
      boardId,
      title,
      maxUsers,
      isPrivate,
      ownerId: req.user.userId,
    });
    await newBoard.save();

    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ error: "Failed to create board" });
  }
});

// DELETE: Delete a board (only if you own it)
boardsRouter.delete("/:boardId", authMiddleware, async (req: any, res) => {
  try {
    const board = await Board.findOne({ boardId: req.params.boardId });
    if (!board) return res.status(404).json({ error: "Board not found" });

    if (board.ownerId?.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ error: "You do not own this board" });
    }

    await Board.deleteOne({ boardId: req.params.boardId });
    res.json({ message: "Board deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete board" });
  }
});
