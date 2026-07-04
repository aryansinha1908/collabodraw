"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardsRouter = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
exports.boardsRouter = express_1.default.Router();
// Quick middleware to protect these routes
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const secret = process.env.JWT_SECRET || "super_secret_hackathon_key_change_later";
        req.user = jsonwebtoken_1.default.verify(token, secret); // Attach user data to request
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};
// GET: Fetch all boards for the logged-in user's dashboard
exports.boardsRouter.get("/my-boards", requireAuth, async (req, res) => {
    try {
        const boards = await models_1.Board.find({ ownerId: req.user.userId }).sort({
            createdAt: -1,
        });
        res.json(boards);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch boards" });
    }
});
// POST: Create a new board with settings
exports.boardsRouter.post("/", requireAuth, async (req, res) => {
    try {
        const { title, maxUsers, isPrivate } = req.body;
        // --- FIX: The Collision Retry Loop ---
        let boardId = "";
        let isUnique = false;
        // Keep generating until we find an ID that doesn't exist in the database
        while (!isUnique) {
            boardId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const existingBoard = await models_1.Board.findOne({ boardId });
            if (!existingBoard) {
                isUnique = true; // Break the loop!
            }
        }
        const newBoard = new models_1.Board({
            boardId,
            title: req.body.title,
            maxUsers: req.body.maxUsers,
            isPrivate: req.body.isPrivate,
            ownerId: req.user.userId,
        });
        await newBoard.save();
        res.status(201).json(newBoard);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create board" });
    }
});
// DELETE: Delete a board (only if you own it)
exports.boardsRouter.delete("/:boardId", requireAuth, async (req, res) => {
    try {
        const board = await models_1.Board.findOne({ boardId: req.params.boardId });
        if (!board)
            return res.status(404).json({ error: "Board not found" });
        if (board.ownerId !== req.user.userId) {
            return res.status(403).json({ error: "You do not own this board" });
        }
        await models_1.Board.deleteOne({ boardId: req.params.boardId });
        res.json({ message: "Board deleted" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete board" });
    }
});
