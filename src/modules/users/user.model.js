import { getDB } from "../../config/db.js";

export const UserModel = {
  async findByUsername(username) {
    const db = getDB();
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows[0];
  },

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

  async getById(id) {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT id,username,email,mobile,status,role_id FROM users WHERE id=?`,
      [id],
    );
    return rows[0];
  },
};
