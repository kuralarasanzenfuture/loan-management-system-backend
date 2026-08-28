import { getDB } from "../../config/db.js";

const ModuleActionModel = {
  async create(data) {
    const db = getDB();

    const [res] = await db.query(
      `
      INSERT INTO module_actions
      (module_id, action_code, action_name, description, is_active)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.module_id,
        data.action_code,
        data.action_name,
        data.description || null,
        data.is_active,
      ],
    );

    return res.insertId;
  },

  async findAll(filters = {}) {
    const db = getDB();

    let query = `
      SELECT ma.*, m.name AS module_name
      FROM module_actions ma
      JOIN modules m ON m.id = ma.module_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.module_id) {
      query += ` AND ma.module_id = ?`;
      params.push(filters.module_id);
    }

    if (filters.is_active !== undefined) {
      query += ` AND ma.is_active = ?`;
      params.push(filters.is_active);
    }

    query += ` ORDER BY ma.id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findByModule(module_id) {
    const db = getDB();

    const [rows] = await db.query(
      `
      SELECT *
      FROM module_actions
      WHERE module_id = ?
      ORDER BY id ASC
      `,
      [module_id],
    );

    return rows;
  },

  async findById(id) {
    const db = getDB();

    const [[row]] = await db.query(
      `SELECT * FROM module_actions WHERE id = ?`,
      [id],
    );

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
      `UPDATE module_actions SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  async toggleStatus(id) {
    const db = getDB();

    await db.query(
      `UPDATE module_actions SET is_active = NOT is_active WHERE id = ?`,
      [id],
    );
  },

  async delete(id) {
    const db = getDB();

    await db.query(`DELETE FROM module_actions WHERE id = ?`, [id]);
  },

  async getAllModules() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT id, name, code, parent_id
      FROM modules
      WHERE is_active = 1
      ORDER BY sort_order ASC
    `);

    return rows;
  },

  async getAllActions() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT id, module_id, action_code, action_name
      FROM module_actions
      WHERE is_active = 1
    `);

    return rows;
  },
};

export default ModuleActionModel;
