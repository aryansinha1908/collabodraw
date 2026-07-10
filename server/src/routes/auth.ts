import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { OAuth2Client } from "google-auth-library";
import authMiddleware from "../middlewares/auth";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      path: "/",
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

    const isMatch = await bcrypt.compare(password, user.passwordHash || "");
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
      path: "/",
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
authRouter.get("/me", authMiddleware, async (req: any, res) => {
  res.status(200).json({
    isAuthenticated: true,
    username: req.user.username, // Assuming your JWT payload has username
  });
});

// --- NEW: Google OAuth Route ---
authRouter.post("/google", async (req, res) => {
  try {
    // 1. Grab the new token type from the frontend
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ message: "No access token provided" });
    }

    // 2. Query Google directly to verify the token and get the user profile
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    if (!googleRes.ok) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const payload = await googleRes.json();
    const { email, name, sub: googleId } = payload;

    // 3. Account Linking / Creation Logic
    let user = await User.findOne({ email });

    if (!user) {
      // First time logging in with Google: Create the account
      let baseUsername = name?.replace(/\s+/g, "").toLowerCase() || "user";
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        username,
        email,
        authProvider: "google",
        googleId,
      });
    }

    // 4. Generate our standard JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    // 5. Set the HTTP-Only Cookie
    res.cookie("draw_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      message: "Authentication successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
});
