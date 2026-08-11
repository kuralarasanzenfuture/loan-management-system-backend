import { getDB } from "../../config/db.js";

const CompanyBankModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO company_banks (
        company_id,
        bank_name, bank_code,
        branch_name, branch_code,
        account_holder_name, account_number, account_type,
        ifsc_code, micr_code, swift_code,
        opening_balance, current_balance,
        upi_id, upi_qr_code,
        account_purpose,
        is_primary, is_collection_account, is_disbursement_account,
        status, opened_date, closed_date, remarks,
        created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.company_id,
        data.bank_name,
        data.bank_code || null,
        data.branch_name || null,
        data.branch_code || null,
        data.account_holder_name,
        data.account_number,
        data.account_type || "current",
        data.ifsc_code || null,
        data.micr_code || null,
        data.swift_code || null,
        data.opening_balance ?? 0,
        data.current_balance ?? 0,
        data.upi_id || null,
        data.upi_qr_code || null,
        data.account_purpose || "business",
        data.is_primary ? 1 : 0,
        data.is_collection_account ? 1 : 0,
        data.is_disbursement_account ? 1 : 0,
        data.status || "active",
        data.opened_date || null,
        data.closed_date || null,
        data.remarks || null,
        data.created_by || null,
      ],
    );

    return res.insertId;
  },

  async findByAccount(connOrDb, company_id, account_number, excludeId = null) {
    const db = connOrDb || getDB();
    let sql = `SELECT id FROM company_banks WHERE company_id = ? AND account_number = ?`;
    const params = [company_id, account_number];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    const [[row]] = await db.query(sql, params);
    return row;
  },

  async resetPrimary(conn, company_id) {
    await conn.query(
      `UPDATE company_banks SET is_primary = FALSE WHERE company_id = ?`,
      [company_id],
    );
  },

  async findAll(filters = {}) {
    const db = getDB();

    let query = `SELECT * FROM company_banks WHERE 1=1`;
    const params = [];

    if (filters.company_id) {
      query += ` AND company_id = ?`;
      params.push(filters.company_id);
    }

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY is_primary DESC, id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(connOrDb, id) {
    const db = typeof connOrDb?.query === "function" ? connOrDb : getDB();
    const targetId = typeof connOrDb === "number" || typeof connOrDb === "string" ? connOrDb : id;
    const [[row]] = await db.query(`SELECT * FROM company_banks WHERE id = ?`, [
      targetId,
    ]);
    return row;
  },

  async update(conn, id, data) {
    await conn.query(`UPDATE company_banks SET ? WHERE id = ?`, [data, id]);
  },

  async setPrimary(conn, id, company_id) {
    await conn.query(
      `UPDATE company_banks SET is_primary = FALSE WHERE company_id = ?`,
      [company_id],
    );
    await conn.query(
      `UPDATE company_banks SET is_primary = TRUE WHERE id = ?`,
      [id],
    );
  },

  async delete(id) {
    const db = getDB();
    await db.query(`DELETE FROM company_banks WHERE id = ?`, [id]);
  },
};

export default CompanyBankModel;
