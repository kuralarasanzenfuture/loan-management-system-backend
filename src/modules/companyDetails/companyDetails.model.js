import { getDB } from "../../config/db.js";

const CompanyModel = {
  async create(data) {
    const db = getDB();

    const [result] = await db.query(`INSERT INTO company_details SET ?`, [
      data,
    ]);

    return result.insertId;
  },

  async findOne() {
    const db = getDB();

    const [rows] = await db.query(`SELECT * FROM company_details LIMIT 1`);

    return rows[0];
  },

  async findById(id) {
    const db = getDB();

    const [[row]] = await db.query(`SELECT * FROM company_details WHERE id=?`, [
      id,
    ]);

    return row;
  },

  async update(id, data) {
    const db = getDB();

    await db.query(`UPDATE company_details SET ? WHERE id=?`, [data, id]);
  },

  async delete(id) {
    const db = getDB();

    await db.query(`DELETE FROM company_details WHERE id=?`, [id]);
  },
};

export default CompanyModel;
