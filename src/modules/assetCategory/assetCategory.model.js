import { getDB } from "../../config/db.js";

const AssetCategoryModel = {
  async create(conn, data) {
    const db = conn || getDB();

    const [result] = await db.query(
      `INSERT INTO asset_categories 
       (category_name, description, status)
       VALUES (?, ?, ?)`,
      [data.category_name, data.description ?? null, data.status || "active"],
    );

    return result.insertId;
  },

  async findAll(filters = {}) {
    const db = getDB();

    let query = `SELECT * FROM asset_categories WHERE 1=1`;
    const params = [];

    if (filters.status) {
      query += ` AND status=?`;
      params.push(filters.status);
    }

    if (filters.search) {
      query += ` AND category_name LIKE ?`;
      params.push(`%${filters.search}%`);
    }

    query += ` ORDER BY id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(conn, id) {
    const db = conn || getDB();

    const [[row]] = await db.query(
      `SELECT * FROM asset_categories WHERE id=?`,
      [id],
    );

    return row || null;
  },

  async findByName(conn, name) {
    const db = conn || getDB();

    const [[row]] = await db.query(
      `SELECT * FROM asset_categories WHERE category_name=?`,
      [name],
    );

    return row || null;
  },

  async update(conn, id, data) {
    const db = conn || getDB();

    await db.query(
      `UPDATE asset_categories 
       SET category_name=?, description=?, status=? 
       WHERE id=?`,
      [data.category_name, data.description ?? null, data.status, id],
    );
  },

  async delete(id) {
    const db = getDB();

    await db.query(`DELETE FROM asset_categories WHERE id=?`, [id]);
  },
};

export default AssetCategoryModel;
