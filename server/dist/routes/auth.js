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
const google_auth_library_1 = require("google-auth-library");
const auth_1 = __importDefault(require("../middlewares/auth"));
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.NODE_ENV === "production"
    ? "https://collabodraw-frontend.vercel.app/api/auth/google/callback"
    : "http://localhost:3001/auth/google/callback");
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
            path: "/",
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
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash || "");
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
            path: "/",
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
    res.cookie("draw_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        expires: new Date(0),
    });
    res.json({ message: "Logged out successfully" });
});
// GET /auth/me
exports.authRouter.get("/me", auth_1.default, async (req, res) => {
    res.status(200).json({
        isAuthenticated: true,
        username: req.user.username, // Assuming your JWT payload has username
    });
});
// 1. Sends the user's tab to Google's login screen
exports.authRouter.get("/google/login", (req, res) => {
    const url = googleClient.generateAuthUrl({
        access_type: "offline",
        scope: ["email", "profile"],
        prompt: "consent",
        // Force the redirect URI here as a fallback
        redirect_uri: process.env.NODE_ENV === "production"
            ? "https://collabodraw-frontend.vercel.app/api/auth/google/callback"
            : "http://localhost:3001/auth/google/callback",
    });
    res.redirect(url);
});
// 2. Google redirects the user back here with a secure code
exports.authRouter.get("/google/callback", async (req, res) => {
    try {
        const { code } = req.query;
        // Trade the code for the actual tokens
        const { tokens } = await googleClient.getToken(code);
        // Fetch the user's profile
        const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
        const payload = await googleRes.json();
        const { email, name, sub: googleId } = payload;
        // --- YOUR EXISTING ACCOUNT LINKING LOGIC ---
        let user = await models_1.User.findOne({ email });
        if (!user) {
            let baseUsername = name?.replace(/\s+/g, "").toLowerCase() || "user";
            let username = baseUsername;
            let counter = 1;
            while (await models_1.User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }
            user = await models_1.User.create({
                username,
                email,
                authProvider: "google",
                googleId,
            });
        }
        // --- YOUR EXISTING JWT & COOKIE LOGIC ---
        const token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("draw_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        // 3. Final Redirect: Send the user to the React Dashboard!
        const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/dashboard`);
    }
    catch (error) {
        console.error("Google Callback Error:", error);
        const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/auth?error=google_failed`);
    }
});
// GET /auth/ticket
exports.authRouter.get("/ticket", auth_1.default, (req, res) => {
    // If they made it past authMiddleware, their HTTP-Only cookie is valid!
    // Create a temporary ticket that expires in 30 seconds
    const secret = process.env.JWT_SECRET || "aryansinha1908";
    const ticket = jsonwebtoken_1.default.sign({ userId: req.user.userId, username: req.user.username }, secret, { expiresIn: "30s" });
    res.status(200).json({ ticket });
});
