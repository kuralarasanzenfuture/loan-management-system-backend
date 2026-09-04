import { getDB } from "../../config/db.js";

export const InterestOnlyLoanPlanModel = {
  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO interest_only_loan_plans
      (plan_name, plan_code, interest_type, interest_value,
       interest_frequency, tenure, tenure_type, principal_repayment,
       penalty_enabled, commission_type, commission_value,
       description, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.plan_name,
        data.plan_code,
        data.interest_type ?? "percentage",
        data.interest_value,
        data.interest_frequency ?? "monthly",
        data.tenure,
        data.tenure_type ?? "months",
        data.principal_repayment ?? "end_of_term",
        data.penalty_enabled ? 1 : 0,
        data.commission_type ?? "none",
        data.commission_value ?? 0,
        data.description ?? null,
        data.status ?? "active",
        data.created_by,
      ],
    );

    return result.insertId;
  },

  async findById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_only_loan_plans WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  async findByCode(plan_code, excludeId = null, conn = null) {
    const client = conn || getDB();

    let query = `SELECT id FROM interest_only_loan_plans WHERE plan_code = ?`;
    const params = [plan_code];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await client.query(query, params);
    return rows.length > 0;
  },

  async findByName(plan_name, excludeId = null, conn = null) {
    const client = conn || getDB();

    let query = `SELECT id FROM interest_only_loan_plans WHERE plan_name = ?`;
    const params = [plan_name];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await client.query(query, params);
    return rows.length > 0;
  },

  async findByCodeOrName(plan_code, plan_name, excludeId = null, conn = null) {
    const client = conn || getDB();

    let query = `
      SELECT id FROM interest_only_loan_plans
      WHERE (plan_code = ? OR plan_name = ?)
    `;

    const params = [plan_code, plan_name];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await client.query(query, params);
    return rows.length > 0;
  },

  async getAll(filters = {}) {
    const db = getDB();

    let query = `SELECT * FROM interest_only_loan_plans WHERE 1=1`;
    const params = [];

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.interest_type) {
      query += ` AND interest_type = ?`;
      params.push(filters.interest_type);
    }

    if (filters.interest_frequency) {
      query += ` AND interest_frequency = ?`;
      params.push(filters.interest_frequency);
    }

    if (filters.tenure_type) {
      query += ` AND tenure_type = ?`;
      params.push(filters.tenure_type);
    }

    if (filters.search) {
      query += ` AND (plan_name LIKE ? OR plan_code LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` ORDER BY id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async update(conn, id, data) {
    const allowedColumns = [
      "plan_name",
      "plan_code",
      "interest_type",
      "interest_value",
      "interest_frequency",
      "tenure",
      "tenure_type",
      "principal_repayment",
      "penalty_enabled",
      "commission_type",
      "commission_value",
      "description",
      "status",
      "updated_by",
    ];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedColumns.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        if (key === "penalty_enabled") {
          values.push(value ? 1 : 0);
        } else {
          values.push(value ?? null);
        }
      }
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    await conn.query(
      `UPDATE interest_only_loan_plans SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  async updateStatus(conn, id, status, updated_by) {
    await conn.query(
      `UPDATE interest_only_loan_plans 
       SET status = ?, updated_by = ?
       WHERE id = ?`,
      [status, updated_by || null, id],
    );
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM interest_only_loan_plans WHERE id = ?`, [id]);
  },
};
