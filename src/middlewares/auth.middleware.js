import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const verifyToken = async (req, res, next) => {
  try {
    const db = getDB();

    let token;

    // ✅ 1. Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // ✅ 2. Cookie fallback (FIX NAME)
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    // ✅ 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ❗ IMPORTANT: you must include session_id in JWT at login
    // otherwise this will always fail

    // ✅ 4. Check user
    const [[user]] = await db.query(
      `SELECT u.id, u.status, u.role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`,
      [decoded.id],
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "User inactive" });
    }

    // ✅ 5. Session validation (REAL security)
    const session_id = decoded.session_id || req.cookies?.session_id;

    if (!session_id) {
      return res.status(401).json({
        message: "Session missing",
      });
    }

    const [[session]] = await db.query(
      `SELECT id FROM user_refresh_tokens
       WHERE user_id = ?
         AND session_id = ?
         AND is_active = 1
         AND expires_at > NOW()`,
      [decoded.id, session_id],
    );

    if (!session) {
      return res.status(401).json({
        message: "Session expired or logged out",
      });
    }

    // ✅ attach user
    req.user = {
      id: decoded.id,
      session_id,
      role_id: user.role_id,
      role: user.role_name,
    };

    next();
  } catch (err) {
    console.error("VERIFY ERROR:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
