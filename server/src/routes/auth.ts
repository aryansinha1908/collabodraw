import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models";

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

    const newUser = await User.create({ username, email, passwordHash });

    // FIX: Grab the secret dynamically right before signing
    const secret =
      process.env.JWT_SECRET || "super_secret_hackathon_key_change_later";
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      secret,
      { expiresIn: "24h" },
    );

    res.status(201).json({ token, username: newUser.username });
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
    const secret =
      process.env.JWT_SECRET || "super_secret_hackathon_key_change_later";
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      secret,
      { expiresIn: "24h" },
    );

    res.status(200).json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});
