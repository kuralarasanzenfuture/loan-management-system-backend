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
    // 🔥 Normalize username & email to lowercase so that
    // "John" and "john" are always treated as the same value.
    const username = data.username.toLowerCase();
    const email = data.email.toLowerCase();

    const existing = await UserModel.findByUsername(username);
    if (existing) throw { status: 400, message: "Username exists" };

    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) throw { status: 400, message: "Email already exists" };

    const hash = await bcrypt.hash(data.password, 10);

    const id = await UserModel.create({
      ...data,
      username,
      email,
      password_hash: hash,
    });

    return { id, username, email };
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

    // 🔥 Normalize loginId to lowercase so that "John" / "JOHN@EXAMPLE.COM"
    // match the lowercase values stored in the database.
    const loginId = data.loginId.toLowerCase();

    const user = await UserModel.findByLogin(loginId);

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

  /*=====================================*/

  async getProfile(userId) {
    const user = await UserModel.getProfile(userId);

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    return user;
  },

  /* =========================
     GET ALL
  ========================= */
  async getAll() {
    return await UserModel.findAll();
  },

  /* =========================
     GET BY ID
  ========================= */
  async getById(id) {
    const user = await UserModel.findById(id);

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    return user;
  },

  /* =========================
     UPDATE
  ========================= */
  async update(id, data) {
    const user = await UserModel.findById(id);

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    // 🔥 Normalize username & email to lowercase before any checks/storage
    if (data.username) data.username = data.username.toLowerCase();
    if (data.email) data.email = data.email.toLowerCase();

    // 🔥 optional validations
    if (data.email) {
      const existing = await UserModel.findByEmail(data.email);
      if (existing && Number(existing.id) !== Number(id)) {
        throw { status: 400, message: "Email already exists" };
      }
    }

    if (data.username) {
      const existing = await UserModel.findByUsername(data.username);
      if (existing && Number(existing.id) !== Number(id)) {
        throw { status: 400, message: "Username already exists" };
      }
    }

    if (data.mobile) {
      const existing = await UserModel.findByMobile(data.mobile);
      if (existing && Number(existing.id) !== Number(id)) {
        throw { status: 400, message: "Mobile already exists" };
      }
    }

    await UserModel.update(id, data);

    return { message: "User updated successfully" };
  },

  /* =========================
     DELETE
  ========================= */
  async delete(id) {
    const user = await UserModel.findById(id);

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    await UserModel.delete(id);

    return { message: "User deleted successfully" };
  },

  async changeOwnPassword(userId, currentPassword, newPassword) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* =========================================
         1. CHECK USER
      ========================================= */

      const user = await UserModel.findById(userId);

      if (!user) {
        throw {
          status: 404,
          message: "User not found",
        };
      }

      /* =========================================
         2. VERIFY CURRENT PASSWORD
      ========================================= */

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isMatch) {
        throw {
          status: 401,
          message: "Current password is incorrect",
        };
      }

      /* =========================================
         3. HASH NEW PASSWORD
      ========================================= */

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      /* =========================================
         4. UPDATE PASSWORD
      ========================================= */

      await UserModel.updatePassword(conn, userId, hashedPassword);

      await conn.commit();

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async logout(userId, session_id) {
    const db = getDB();

    if (!session_id) {
      throw { status: 400, message: "Session ID required" };
    }

    const [result] = await db.query(
      `UPDATE user_refresh_tokens
     SET is_active = FALSE,
         revoked_at = NOW(),
         revoked_reason = 'logout'
     WHERE user_id = ? 
       AND session_id = ?
       AND is_active = TRUE`,
      [userId, session_id],
    );

    // 🔥 IMPORTANT CHECK
    if (result.affectedRows === 0) {
      throw { status: 400, message: "Invalid or already logged out session" };
    }

    return { message: "Logged out successfully" };
  },

  async logoutAll(userId) {
    const db = getDB();

    const [result] = await db.query(
      `UPDATE user_refresh_tokens
     SET is_active = FALSE,
         revoked_at = NOW(),
         revoked_reason = 'logout_all'
     WHERE user_id = ? AND is_active = TRUE`,
      [userId],
    );

    if (result.affectedRows === 0) {
      return { message: "No active sessions found" };
    }

    return { message: "Logged out from all devices" };
  },

  async checkUsername(username) {
    if (!username) {
      throw { status: 400, message: "Username required" };
    }

    // 🔥 Normalize to lowercase so "John" and "john" are treated the same
    const user = await UserModel.findByUsername(username.toLowerCase());

    return {
      exists: !!user,
      message: user ? "Username already taken" : "Username available",
    };
  },

  async checkEmail(email) {
    if (!email) {
      throw { status: 400, message: "Email required" };
    }

    // 🔥 Normalize to lowercase so "JOHN@EXAMPLE.COM" and "john@example.com" are treated the same
    const user = await UserModel.findByEmail(email.toLowerCase());

    return {
      exists: !!user,
      message: user ? "Email already exists" : "Email available",
    };
  },

  async checkMobile(mobile) {
    if (!mobile) {
      throw { status: 400, message: "Mobile required" };
    }

    const user = await UserModel.findByMobile(mobile);

    return {
      exists: !!user,
      message: user ? "Mobile already exists" : "Mobile available",
    };
  },
};
