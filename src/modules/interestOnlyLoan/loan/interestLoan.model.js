import { getDB } from "../../../config/db.js";

const year = new Date().getFullYear();

export const InterestLoanModel = {
  async getPlanById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_only_loan_plans WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  async getCustomerById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT id, first_name, last_name, mobile, status FROM customers WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  async generateLoanNo(conn) {
    const [rows] = await conn.query(
      `SELECT loan_no FROM interest_only_loans ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    );

    let next = 1;
    if (rows.length > 0 && rows[0].loan_no) {
      const parts = rows[0].loan_no.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        next = lastNum + 1;
      }
    }

    return `IOL-${year}-${String(next).padStart(6, "0")}`;
  },

  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO interest_only_loans
       (loan_no, customer_id, interest_plan_id, principal_amount,
        interest_rate, interest_type, interest_frequency, tenure, tenure_type,
        total_interest, total_payable, total_interest_paid, total_principal_paid,
        outstanding_interest, outstanding_principal, start_date, end_date,
        commission_amount, net_disbursed_amount, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.loan_no,
        data.customer_id,
        data.interest_plan_id,
        data.principal_amount,
        data.interest_rate,
        data.interest_type,
        data.interest_frequency,
        data.tenure,
        data.tenure_type,
        data.total_interest,
        data.total_payable,
        data.total_interest_paid || 0,
        data.total_principal_paid || 0,
        data.outstanding_interest,
        data.outstanding_principal,
        data.start_date,
        data.end_date,
        data.commission_amount || 0,
        data.net_disbursed_amount,
        data.status || "active",
        data.created_by,
      ],
    );
    return res.insertId;
  },

  async getAll(filters = {}) {
    const db = getDB();
    let query = `
      SELECT 
        l.*,
        CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        p.plan_name,
        p.plan_code
      FROM interest_only_loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN interest_only_loan_plans p ON l.interest_plan_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ` AND l.status = ?`;
      params.push(filters.status);
    }

    if (filters.customer_id) {
      query += ` AND l.customer_id = ?`;
      params.push(filters.customer_id);
    }

    if (filters.interest_plan_id) {
      query += ` AND l.interest_plan_id = ?`;
      params.push(filters.interest_plan_id);
    }

    if (filters.from_date) {
      query += ` AND l.start_date >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND l.start_date <= ?`;
      params.push(filters.to_date);
    }

    if (filters.search) {
      query += ` AND (l.loan_no LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.mobile LIKE ?)`;
      params.push(
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`,
      );
    }

    query += ` ORDER BY l.id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id, conn = null) {
    const client = conn || getDB();
    const query = `
      SELECT 
        l.*,
        CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        c.customer_no,
        p.plan_name,
        p.plan_code,
        u.username AS created_by_name
      FROM interest_only_loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN interest_only_loan_plans p ON l.interest_plan_id = p.id
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.id = ?
    `;
    const [rows] = await client.query(query, [id]);
    return rows[0] || null;
  },

  async findByCustomerId(customer_id, conn = null) {
    const client = conn || getDB();
    const query = `
      SELECT 
        l.*,
        p.plan_name,
        p.plan_code
      FROM interest_only_loans l
      LEFT JOIN interest_only_loan_plans p ON l.interest_plan_id = p.id
      WHERE l.customer_id = ?
      ORDER BY l.id DESC
    `;
    const [rows] = await client.query(query, [customer_id]);
    return rows;
  },

  async updateStatus(conn, id, status, updated_by) {
    await conn.query(
      `UPDATE interest_only_loans 
       SET status = ?, updated_by = ?
       WHERE id = ?`,
      [status, updated_by || null, id],
    );
  },

  async updateBalances(conn, id, data) {
    const fields = [];
    const values = [];

    const allowed = [
      "total_interest_paid",
      "total_principal_paid",
      "outstanding_interest",
      "outstanding_principal",
      "status",
      "updated_by",
    ];

    for (const [k, v] of Object.entries(data)) {
      if (allowed.includes(k) && v !== undefined) {
        fields.push(`${k} = ?`);
        values.push(v);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await conn.query(
      `UPDATE interest_only_loans SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  async countPayments(loan_id, conn = null) {
    const client = conn || getDB();
    const [[row]] = await client.query(
      `SELECT COUNT(*) AS count FROM interest_only_loan_payments WHERE loan_id = ?`,
      [loan_id],
    );
    return row ? Number(row.count) : 0;
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM interest_only_loans WHERE id = ?`, [id]);
  },
};
