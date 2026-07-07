"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        // CRITICAL: Read from cookies, NOT headers!
        const token = req.cookies.draw_token;
        if (!token) {
            return res
                .status(401)
                .json({ error: "Access Denied: No token provided" });
        }
        const secret = process.env.JWT_SECRET || "aryansinha1908";
        const verified = jsonwebtoken_1.default.verify(token, secret);
        req.user = verified; // Attach user payload to request
        next();
    }
    catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.default = authMiddleware;
