"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
exports.authRouter = express_1.default.Router();
// REGISTER
exports.authRouter.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await models_1.User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "Username or email already exists" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const newUser = await models_1.User.create({ username, email, passwordHash });
        // FIX: Grab the secret dynamically right before signing
        const secret = process.env.JWT_SECRET || "super_secret_hackathon_key_change_later";
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id, username: newUser.username }, secret, { expiresIn: "24h" });
        res.status(201).json({ token, username: newUser.username });
    }
    catch (error) {
        res.status(500).json({ error: "Server error during registration" });
    }
});
// LOGIN
exports.authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await models_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        // FIX: Grab the secret dynamically right before signing
        const secret = process.env.JWT_SECRET || "super_secret_hackathon_key_change_later";
        const token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username }, secret, { expiresIn: "24h" });
        res.status(200).json({ token, username: user.username });
    }
    catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
});
