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
const auth_1 = __importDefault(require("../middlewares/auth"));
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
        const user = await models_1.User.create({ username, email, passwordHash });
        // Inside your login/register logic, after you generate the JWT:
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET || "aryansinha1908", { expiresIn: "7d" });
        // 1. Drop the HttpOnly Cookie
        res.cookie("draw_token", token, {
            httpOnly: true, // Prevents JavaScript from reading the cookie
            secure: process.env.NODE_ENV === "production", // HTTPS only in prod
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // 2. Do NOT send the token in the JSON anymore
        res.status(200).json({
            message: "Authentication successful",
            username: user.username,
        });
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
        const secret = process.env.JWT_SECRET || "aryansinha1908";
        // Inside your login/register logic, after you generate the JWT:
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, username: user.username }, secret, { expiresIn: "7d" });
        // 1. Drop the HttpOnly Cookie
        res.cookie("draw_token", token, {
            httpOnly: true, // Prevents JavaScript from reading the cookie
            secure: process.env.NODE_ENV === "production", // HTTPS only in prod
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // 2. Do NOT send the token in the JSON anymore
        res.status(200).json({
            message: "Authentication successful",
            username: user.username,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
});
exports.authRouter.post("/logout", (req, res) => {
    res.clearCookie("draw_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ message: "Logged out" });
});
// GET /auth/me
exports.authRouter.get("/me", auth_1.default, async (req, res) => {
    res.status(200).json({
        isAuthenticated: true,
        username: req.user.username, // Assuming your JWT payload has username
    });
});
