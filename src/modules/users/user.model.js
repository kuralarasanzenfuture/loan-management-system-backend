import { getDB } from "../../config/db.js";

export const UserModel = {
  async create(user) {
    const db = getDB();
    const [res] = await db.query(
      `INSERT INTO users (username,password_hash,email,mobile,role_id)
       VALUES (?,?,?,?,?)`,
      [
        user.username,
        user.password_hash,
        user.email,
        user.mobile,
        user.role_id,
      ],
    );
    return res.insertId;
  },

  async findByLogin(login) {
    const db = getDB();

    const [rows] = await db.query(
      `SELECT * FROM users 
     WHERE username = ? OR email = ? OR mobile = ?
     LIMIT 1`,
      [login, login, login],
    );

    return rows[0];
  },

  /* =========================
     FIND ALL
  ========================= */
  async findAll() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.mobile,
        u.status,
        u.created_at,
        u.updated_at,
        u.role_id,
        r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
    `);

    return rows;
  },

  /* =========================
     FIND BY ID
  ========================= */
  async findById(id) {
    const db = getDB();

    const [[user]] = await db.query(
      `
      SELECT 
        u.*,
        r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      `,
      [id],
    );

    return user;
  },

  /* =========================
     FIND BY USERNAME
  ========================= */
  async findByUsername(username) {
    const db = getDB();

    const [[user]] = await db.query(
      `SELECT id FROM users WHERE username = ? LIMIT 1`,
      [username],
    );

    return user;
  },

  /* =========================
     FIND BY EMAIL
  ========================= */
  async findByEmail(email) {
    const db = getDB();

    const [[user]] = await db.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email],
    );

    return user;
  },

  /* =========================
     FIND BY MOBILE
  ========================= */
  async findByMobile(mobile) {
    const db = getDB();

    const [[user]] = await db.query(
      `SELECT id FROM users WHERE mobile = ? LIMIT 1`,
      [mobile],
    );

    return user;
  },

  /* =========================
     UPDATE
  ========================= */
  async update(id, data) {
    const db = getDB();

    const fields = [];
    const values = [];

    for (const key in data) {
      fields.push(`${key}=?`);
      values.push(data[key]);
    }

    if (fields.length === 0) return;

    values.push(id);

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id=?`, values);
  },

  /* =========================
     DELETE
  ========================= */
  async delete(id) {
    const db = getDB();

    await db.query(`DELETE FROM users WHERE id=?`, [id]);
  },

  async getById(id) {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT id,username,email,mobile,status,role_id FROM users WHERE id=?`,
      [id],
    );
    return rows[0];
  },

  async getProfile(userId) {
    const db = getDB();

    const [[user]] = await db.query(
      `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.mobile,
      u.status,
      u.last_login,
      u.created_at,
      r.name AS role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
    `,
      [userId],
    );

    return user;
  },

  async updatePassword(conn, id, hashedPassword) {
    const [result] = await conn.query(
      `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
      `,
      [hashedPassword, id],
    );

    return result.affectedRows > 0;
  },
};
