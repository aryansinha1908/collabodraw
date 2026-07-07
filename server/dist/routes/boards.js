"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardsRouter = void 0;
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const auth_1 = __importDefault(require("../middlewares/auth"));
exports.boardsRouter = express_1.default.Router();
// GET: Fetch all boards for the logged-in user's dashboard
exports.boardsRouter.get("/my-boards", auth_1.default, async (req, res) => {
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
exports.boardsRouter.post("/", auth_1.default, async (req, res) => {
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
        // console.log(req.user);
        const newBoard = new models_1.Board({
            boardId,
            title,
            maxUsers,
            isPrivate,
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
exports.boardsRouter.delete("/:boardId", auth_1.default, async (req, res) => {
    try {
        const board = await models_1.Board.findOne({ boardId: req.params.boardId });
        if (!board)
            return res.status(404).json({ error: "Board not found" });
        if (board.ownerId?.toString() !== req.user.userId?.toString()) {
            return res.status(403).json({ error: "You do not own this board" });
        }
        await models_1.Board.deleteOne({ boardId: req.params.boardId });
        res.json({ message: "Board deleted" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete board" });
    }
});
