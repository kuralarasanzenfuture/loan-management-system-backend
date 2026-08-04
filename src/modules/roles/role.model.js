import { getDB } from "../../config/db.js";

export const RoleModel = {
  async findByName(name) {
    const db = getDB();
    const [rows] = await db.query("SELECT * FROM roles WHERE name = ?", [name]);
    return rows[0];
  },

  async findById(id) {
    const db = getDB();
    const [rows] = await db.query("SELECT * FROM roles WHERE id = ?", [id]);
    return rows[0];
  },

  async getAll() {
    const db = getDB();
    const [rows] = await db.query("SELECT * FROM roles ORDER BY id DESC");
    return rows;
  },

  async create(data) {
    const db = getDB();
    const [result] = await db.query(
      `INSERT INTO roles (name, description, status)
       VALUES (?, ?, ?)`,
      [data.name, data.description, data.status],
    );
    return result.insertId;
  },

  async update(id, data) {
    const db = getDB();

    const fields = [];
    const values = [];

    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }

    if (!fields.length) return;

    values.push(id);

    await db.query(
      `UPDATE roles SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  async delete(id) {
    const db = getDB();
    await db.query("DELETE FROM roles WHERE id = ?", [id]);
  },

  async isRoleAssigned(id) {
    const db = getDB();
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role_id = ?",
      [id],
    );
    return rows[0].count > 0;
  },
};
