import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models";
import authMiddleware from "../middlewares/auth";

export const authRouter = express.Router();

// REGISTER
authRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, passwordHash });

    // Inside your login/register logic, after you generate the JWT:
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      (process.env.JWT_SECRET as string) || "aryansinha1908",
      { expiresIn: "7d" },
    );

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
  } catch (error) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

// LOGIN
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // FIX: Grab the secret dynamically right before signing
    const secret = (process.env.JWT_SECRET as string) || "aryansinha1908";
    // Inside your login/register logic, after you generate the JWT:
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      secret,
      { expiresIn: "7d" },
    );

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
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("draw_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out" });
});

// GET /auth/me
authRouter.get("/me", authMiddleware, async (req: any, res) => {
  res.status(200).json({
    isAuthenticated: true,
    username: req.user.username, // Assuming your JWT payload has username
  });
});
