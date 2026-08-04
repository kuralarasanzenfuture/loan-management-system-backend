import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../../config/db.js";
import { UserModel } from "./user.model.js";

import crypto from "crypto";

const ACCESS_EXP = "15m";
const REFRESH_EXP_DAYS = 7;

export const UserService = {
  async register(data) {
    const existing = await UserModel.findByUsername(data.username);
    if (existing) throw { status: 400, message: "Username exists" };

    const hash = await bcrypt.hash(data.password, 10);

    const id = await UserModel.create({
      ...data,
      password_hash: hash,
    });

    return { id, username: data.username };
  },

  // async login(data, req, res) {
  //   const db = getDB();

  //   const user = await UserModel.findByLogin(data.loginId);

  //   if (!user) {
  //     throw { status: 404, message: "User not found" };
  //   }

  //   if (user.status !== "active") {
  //     throw { status: 403, message: "User inactive/blocked" };
  //   }

  //   const match = await bcrypt.compare(data.password, user.password_hash);

  //   if (!match) {
  //     await db.query(
  //       `INSERT INTO login_history
  //      (user_id, username, login_time, ip_address, status, reason)
  //      VALUES (?, ?, NOW(), ?, 'failed', 'invalid_password')`,
  //       [user.id, user.username, req.ip],
  //     );

  //     throw { status: 401, message: "Invalid credentials" };
  //   }

  //   // 🔐 TOKENS
  //   const access_token = jwt.sign(
  //     { id: user.id },
  //     process.env.JWT_ACCESS_SECRET,
  //     { expiresIn: ACCESS_EXP },
  //   );

  //   const refresh_token = uuidv4();
  //   const session_id = uuidv4();
  //   const refresh_hash = await bcrypt.hash(refresh_token, 10);

  //   // 📡 Device info
  //   const ip = req.ip;
  //   const ua = req.headers["user-agent"] || null;

  //   // 💾 Store session
  //   await db.query(
  //     `INSERT INTO user_refresh_tokens (
  //     user_id,
  //     session_id,
  //     refresh_token_hash,
  //     ip_address,
  //     user_agent,
  //     device_name,
  //     browser,
  //     os,
  //     expires_at
  //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
  //     [
  //       user.id,
  //       session_id,
  //       refresh_hash,
  //       ip,
  //       ua,
  //       "Unknown Device",
  //       "Unknown Browser",
  //       "Unknown OS",
  //       REFRESH_EXP_DAYS,
  //     ],
  //   );

  //   // 📜 login history
  //   await db.query(
  //     `INSERT INTO login_history
  //    (user_id, username, login_time, ip_address, status)
  //    VALUES (?, ?, NOW(), ?, 'success')`,
  //     [user.id, user.username, ip],
  //   );

  //   // 🍪 COOKIE SETUP (IMPORTANT)
  //   res.cookie("access_token", access_token, {
  //     httpOnly: true,
  //     secure: false, // 🔴 true in production (HTTPS)
  //     sameSite: "lax",
  //     maxAge: 15 * 60 * 1000,
  //   });

  //   res.cookie("refresh_token", refresh_token, {
  //     httpOnly: true,
  //     secure: false,
  //     sameSite: "lax",
  //     maxAge: REFRESH_EXP_DAYS * 24 * 60 * 60 * 1000,
  //   });

  //   res.cookie("session_id", session_id, {
  //     httpOnly: true,
  //     secure: false,
  //     sameSite: "lax",
  //   });

  //   return {
  //     access_token,
  //     refresh_token,
  //     session_id,
  //     user: {
  //       id: user.id,
  //       username: user.username,
  //     },
  //   };
  // },

  /*=====================================*/

  async login(data, req) {
    const db = getDB();

    const user = await UserModel.findByLogin(data.loginId);

    if (!user) throw { status: 404, message: "User not found" };
    if (user.status !== "active")
      throw { status: 403, message: "User inactive/blocked" };

    const match = await bcrypt.compare(data.password, user.password_hash);

    if (!match) {
      await db.query(
        `INSERT INTO login_history 
       (user_id, username, login_time, ip_address, status, reason)
       VALUES (?, ?, NOW(), ?, 'failed', 'invalid_password')`,
        [user.id, user.username, req.ip],
      );

      throw { status: 401, message: "Invalid credentials" };
    }

    // 🔐 Tokens
    const session_id = uuidv4();

    const access_token = jwt.sign(
      {
        id: user.id,
        session_id,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_EXP },
    );

    const refresh_token = crypto.randomBytes(64).toString("hex");
    const refresh_hash = await bcrypt.hash(refresh_token, 10);

    const ip = req.ip;
    const ua = req.headers["user-agent"] || null;

    await db.query(
      `INSERT INTO user_refresh_tokens (
      user_id,
      session_id,
      refresh_token_hash,
      ip_address,
      user_agent,
      device_name,
      browser,
      os,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [
        user.id,
        session_id,
        refresh_hash,
        ip,
        ua,
        "Unknown Device",
        "Unknown Browser",
        "Unknown OS",
        REFRESH_EXP_DAYS,
      ],
    );

    await db.query(
      `INSERT INTO login_history 
     (user_id, username, login_time, ip_address, status)
     VALUES (?, ?, NOW(), ?, 'success')`,
      [user.id, user.username, ip],
    );

    return {
      access_token,
      refresh_token,
      session_id,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  },

  // async refreshToken({ refresh_token, session_id }) {
  //   const db = getDB();

  //   if (!refresh_token || !session_id) {
  //     throw { status: 400, message: "Missing token or session" };
  //   }

  //   const [rows] = await db.query(
  //     `SELECT * FROM user_refresh_tokens
  //    WHERE session_id = ? AND is_active = TRUE`,
  //     [session_id],
  //   );

  //   const session = rows[0];

  //   if (!session) {
  //     throw { status: 401, message: "Invalid session" };
  //   }

  //   console.log("TOKEN FROM REQUEST:", refresh_token);
  //   console.log("HASH FROM DB:", session.refresh_token_hash);

  //   const match = await bcrypt.compare(
  //     refresh_token,
  //     session.refresh_token_hash,
  //   );

  //   console.log("MATCH RESULT:", match);

  //   if (!match) {
  //     throw { status: 401, message: "Invalid token" };
  //   }

  //   if (new Date(session.expires_at) < new Date()) {
  //     throw { status: 401, message: "Token expired" };
  //   }

  //   // 🔁 rotate
  //   // rotate token in-place
  //   const new_refresh_token = uuidv4();
  //   const new_hash = await bcrypt.hash(new_refresh_token, 10);

  //   await db.query(
  //     `UPDATE user_refresh_tokens
  //  SET refresh_token_hash = ?,
  //      last_used_at = NOW(),
  //      expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)
  //  WHERE session_id = ? AND is_active = TRUE`,
  //     [new_hash, REFRESH_EXP_DAYS, session_id],
  //   );

  //   const access_token = jwt.sign(
  //     { id: session.user_id },
  //     process.env.JWT_ACCESS_SECRET,
  //     { expiresIn: ACCESS_EXP },
  //   );

  //   return {
  //     access_token,
  //     refresh_token: new_refresh_token,
  //     session_id,
  //   };
  // },

  /*=====================================*/

  async refreshToken({ refresh_token, session_id }) {
    const db = getDB();

    if (!refresh_token || !session_id) {
      throw { status: 400, message: "Missing token or session" };
    }

    const [rows] = await db.query(
      `SELECT * FROM user_refresh_tokens
     WHERE session_id = ? AND is_active = TRUE`,
      [session_id],
    );

    const session = rows[0];

    if (!session) {
      throw { status: 401, message: "Invalid session" };
    }

    const match = await bcrypt.compare(
      refresh_token,
      session.refresh_token_hash,
    );

    // 🔥 TOKEN REUSE DETECTION
    if (!match) {
      // possible token theft → kill session
      await db.query(
        `UPDATE user_refresh_tokens
       SET is_active = FALSE,
           revoked_at = NOW(),
           revoked_reason = 'token_reuse_detected'
       WHERE session_id = ?`,
        [session_id],
      );

      throw { status: 401, message: "Invalid token (session revoked)" };
    }

    if (new Date(session.expires_at) < new Date()) {
      throw { status: 401, message: "Token expired" };
    }

    // 🔁 rotate (STRONG TOKEN)
    const new_refresh_token = crypto.randomBytes(64).toString("hex");
    const new_hash = await bcrypt.hash(new_refresh_token, 10);

    await db.query(
      `UPDATE user_refresh_tokens
     SET refresh_token_hash = ?,
         last_used_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)
     WHERE session_id = ? AND is_active = TRUE`,
      [new_hash, REFRESH_EXP_DAYS, session_id],
    );

    // 🔐 FIXED JWT
    const access_token = jwt.sign(
      {
        id: session.user_id,
        session_id, // 🔥 REQUIRED
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_EXP },
    );

    return {
      access_token,
      refresh_token: new_refresh_token,
      session_id,
    };
  },

  async logout(userId, session_id) {
    const db = getDB();

    if (!session_id) {
      throw { status: 400, message: "Session ID required" };
    }

    await db.query(
      `UPDATE user_refresh_tokens
     SET is_active = FALSE,
         revoked_at = NOW(),
         revoked_reason = 'logout'
     WHERE user_id = ? AND session_id = ?`,
      [userId, session_id],
    );

    return { message: "Logged out" };
  },

  async logoutAll(userId) {
    const db = getDB();

    await db.query(
      `UPDATE user_refresh_tokens
     SET is_active = FALSE,
         revoked_at = NOW(),
         revoked_reason = 'logout_all'
     WHERE user_id = ?`,
      [userId],
    );

    return { message: "Logged out from all devices" };
  },
};

export const logout = async (userId, session_id) => {
  const db = getDB();

  if (!session_id) {
    throw { status: 400, message: "Session ID missing" };
  }

  const [result] = await db.query(
    `UPDATE user_refresh_tokens
     SET is_active = FALSE,
         revoked_at = NOW(),
         revoked_reason = 'logout'
     WHERE user_id = ? AND session_id = ? AND is_active = TRUE`,
    [userId, session_id],
  );

  if (result.affectedRows === 0) {
    throw { status: 404, message: "Session not found or already logged out" };
  }

  return { message: "Logged out successfully" };
};

export const logoutAll = async (userId) => {
  const db = getDB();

  const [result] = await db.query(
    `UPDATE user_refresh_tokens
     SET is_active = FALSE,
         revoked_at = NOW(),
         revoked_reason = 'logout_all'
     WHERE user_id = ? AND is_active = TRUE`,
    [userId],
  );

  return {
    message: "Logged out from all devices",
    sessions_affected: result.affectedRows,
  };
};
