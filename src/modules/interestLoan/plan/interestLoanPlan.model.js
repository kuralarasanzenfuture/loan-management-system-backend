import { getDB } from "../../../config/db.js";

export const InterestLoanPlanModel = {
  /**
   * Insert new interest loan plan
   */
  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO interest_loan_plans (
        plan_name,
        plan_code,
        interest_type,
        interest_value,
        interest_frequency,
        calculation_method,
        principal_basis,
        payment_type,
        status,
        description,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.plan_name,
        data.plan_code,
        data.interest_type ?? "percentage",
        data.interest_value,
        data.interest_frequency ?? "monthly",
        data.calculation_method ?? "simple",
        data.principal_basis ?? "outstanding_principal",
        data.payment_type ?? "anytime",
        data.status ?? "active",
        data.description ?? null,
        data.created_by,
      ],
    );

    return result.insertId;
  },

  /**
   * Find plan by ID
   */
  async findById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
        p.*,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
       FROM interest_loan_plans p
       LEFT JOIN users u1 ON p.created_by = u1.id
       LEFT JOIN users u2 ON p.updated_by = u2.id
       WHERE p.id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  /**
   * Check if plan code exists
   */
  async findByCode(plan_code, excludeId = null, conn = null) {
    const client = conn || getDB();
    let query = `SELECT id FROM interest_loan_plans WHERE plan_code = ?`;
    const params = [plan_code];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await client.query(query, params);
    return rows.length > 0;
  },

  /**
   * Check if plan name exists
   */
  async findByName(plan_name, excludeId = null, conn = null) {
    const client = conn || getDB();
    let query = `SELECT id FROM interest_loan_plans WHERE plan_name = ?`;
    const params = [plan_name];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await client.query(query, params);
    return rows.length > 0;
  },

  /**
   * Get all plans with filters and pagination
   */
  async getAll(filters = {}) {
    const db = getDB();

    let query = `
      SELECT 
        p.*,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM interest_loan_plans p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ` AND p.status = ?`;
      params.push(filters.status);
    }

    if (filters.interest_type) {
      query += ` AND p.interest_type = ?`;
      params.push(filters.interest_type);
    }

    if (filters.interest_frequency) {
      query += ` AND p.interest_frequency = ?`;
      params.push(filters.interest_frequency);
    }

    if (filters.principal_basis) {
      query += ` AND p.principal_basis = ?`;
      params.push(filters.principal_basis);
    }

    if (filters.search) {
      query += ` AND (p.plan_name LIKE ? OR p.plan_code LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` ORDER BY p.id DESC`;

    if (filters.limit) {
      const limit = parseInt(filters.limit, 10) || 10;
      const page = parseInt(filters.page, 10) || 1;
      const offset = (page - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * Count total plans with given filters
   */
  async count(filters = {}) {
    const db = getDB();

    let query = `SELECT COUNT(*) AS total FROM interest_loan_plans WHERE 1=1`;
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

    if (filters.principal_basis) {
      query += ` AND principal_basis = ?`;
      params.push(filters.principal_basis);
    }

    if (filters.search) {
      query += ` AND (plan_name LIKE ? OR plan_code LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows] = await db.query(query, params);
    return rows[0]?.total || 0;
  },

  /**
   * Update plan by ID
   */
  async update(conn, id, data) {
    const allowedColumns = [
      "plan_name",
      "plan_code",
      "interest_type",
      "interest_value",
      "interest_frequency",
      "calculation_method",
      "principal_basis",
      "payment_type",
      "status",
      "description",
      "updated_by",
    ];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedColumns.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value ?? null);
      }
    }

    if (fields.length === 0) return;

    values.push(id);

    await conn.query(
      `UPDATE interest_loan_plans SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  /**
   * Update status directly
   */
  async updateStatus(conn, id, status, updated_by) {
    await conn.query(
      `UPDATE interest_loan_plans 
       SET status = ?, updated_by = ? 
       WHERE id = ?`,
      [status, updated_by || null, id],
    );
  },

  /**
   * Check if plan is used by any interest loan
   */
  async isPlanInUse(id, conn = null) {
    try {
      const client = conn || getDB();
      const [rows] = await client.query(
        `SELECT id FROM interest_loans WHERE interest_plan_id = ? LIMIT 1`,
        [id],
      );
      return rows.length > 0;
    } catch (err) {
      // Safe fallback if interest_loans table has not been created yet
      if (err.code === "ER_NO_SUCH_TABLE") {
        return false;
      }
      throw err;
    }
  },

  /**
   * Delete plan
   */
  async delete(conn, id) {
    await conn.query(`DELETE FROM interest_loan_plans WHERE id = ?`, [id]);
  },
};

export default InterestLoanPlanModel;
