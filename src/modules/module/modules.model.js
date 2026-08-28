import { getDB } from "../../config/db.js";

const ModuleModel = {
  async create(data) {
    const db = getDB();

    const [res] = await db.query(
      `
      INSERT INTO modules 
      (name, code, description, parent_id, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.name,
        data.code,
        data.description || null,
        data.parent_id || null,
        data.sort_order,
        data.is_active,
      ],
    );

    return res.insertId;
  },

  async findAll(filters = {}) {
    const db = getDB();

    let query = `SELECT * FROM modules WHERE 1=1`;
    const params = [];

    if (filters.is_active !== undefined) {
      query += ` AND is_active = ?`;
      params.push(filters.is_active);
    }

    query += ` ORDER BY sort_order ASC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const db = getDB();
    const [[row]] = await db.query(`SELECT * FROM modules WHERE id=?`, [id]);
    return row;
  },

  async update(id, data) {
    const db = getDB();

    const fields = [];
    const values = [];

    Object.entries(data).forEach(([key, val]) => {
      fields.push(`${key} = ?`);
      values.push(val);
    });

    values.push(id);

    await db.query(
      `UPDATE modules SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  async toggleStatus(id) {
    const db = getDB();

    await db.query(
      `UPDATE modules SET is_active = NOT is_active WHERE id = ?`,
      [id],
    );
  },

  async delete(id) {
    const db = getDB();
    await db.query(`DELETE FROM modules WHERE id = ?`, [id]);
  },
};

export default ModuleModel;
