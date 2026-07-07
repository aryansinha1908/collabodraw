import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const authMiddleware = (req: any, res: any, next: NextFunction) => {
  try {
    // CRITICAL: Read from cookies, NOT headers!
    const token = req.cookies.draw_token;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access Denied: No token provided" });
    }

    const secret = (process.env.JWT_SECRET as string) || "aryansinha1908";
    const verified = jwt.verify(token, secret);

    req.user = verified; // Attach user payload to request
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;
