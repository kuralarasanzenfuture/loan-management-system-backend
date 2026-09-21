const formatLoanRow = (loan) => {
  if (!loan) return null;
  return {
    ...loan,
    principal_amount: parseFloat(loan.principal_amount),
    outstanding_principal: parseFloat(loan.outstanding_principal),
    total_principal_paid: parseFloat(loan.total_principal_paid || 0),
    interest_rate: parseFloat(loan.interest_rate),
    total_interest_accrued: parseFloat(loan.total_interest_accrued || 0),
    total_interest_paid: parseFloat(loan.total_interest_paid || 0),
    outstanding_interest: parseFloat(loan.outstanding_interest || 0),
  };
};

import { getDB } from "../../../config/db.js";

export const InterestLoanModel = {
  /**
   * Concurrently safe sequential loan number generator
   * Format: INTL-000001, INTL-000002
   */
    /**
   * Portfolio summary metrics
   */
  async getSummary(conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(`
      SELECT 
        COUNT(*) AS total_loans,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_loans,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_loans,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_loans,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_loans,
        COALESCE(SUM(principal_amount), 0.00) AS total_principal_disbursed,
        COALESCE(SUM(outstanding_principal), 0.00) AS total_outstanding_principal,
        COALESCE(SUM(total_principal_paid), 0.00) AS total_principal_paid,
        COALESCE(SUM(total_interest_accrued), 0.00) AS total_interest_accrued,
        COALESCE(SUM(total_interest_paid), 0.00) AS total_interest_paid,
        COALESCE(SUM(outstanding_interest), 0.00) AS total_outstanding_interest
      FROM interest_loans
    `);

    return rows[0] || {
      total_loans: 0,
      active_loans: 0,
      completed_loans: 0,
      closed_loans: 0,
      cancelled_loans: 0,
      total_principal_disbursed: "0.00",
      total_outstanding_principal: "0.00",
      total_principal_paid: "0.00",
      total_interest_accrued: "0.00",
      total_interest_paid: "0.00",
      total_outstanding_interest: "0.00",
    };
  },

  async generateLoanNo(conn) {
    const [rows] = await conn.query(
      `SELECT loan_no FROM interest_loans ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    );

    let next = 1;
    if (rows.length > 0 && rows[0].loan_no) {
      const parts = rows[0].loan_no.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        next = lastNum + 1;
      }
    }

    let candidate = `INTL-${String(next).padStart(6, "0")}`;

    // Verify uniqueness
    while (await this.findByLoanNo(candidate, conn)) {
      next++;
      candidate = `INTL-${String(next).padStart(6, "0")}`;
    }

    return candidate;
  },

  /**
   * Check if loan number exists
   */
  async findByLoanNo(loan_no, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT id FROM interest_loans WHERE loan_no = ?`,
      [loan_no],
    );
    return rows.length > 0;
  },

  /**
   * Insert new interest loan
   */
  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO interest_loans (
        loan_no,
        customer_id,
        interest_plan_id,
        principal_amount,
        outstanding_principal,
        total_interest_accrued,
        total_interest_paid,
        total_principal_paid,
        outstanding_interest,
        interest_type,
        interest_rate,
        interest_frequency,
        calculation_method,
        principal_basis,
        start_date,
        last_interest_date,
        next_interest_date,
        status,
        remarks,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        data.loan_no,
        data.customer_id,
        data.interest_plan_id,
        data.principal_amount,
        data.outstanding_principal ?? data.principal_amount,
        data.total_interest_accrued ?? 0.0,
        0.0,
        0.0,
        data.outstanding_interest ?? 0.0,
        data.interest_type,
        data.interest_rate,
        data.interest_frequency,
        data.calculation_method ?? "simple",
        data.principal_basis ?? "outstanding_principal",
        data.start_date,
        data.last_interest_date ?? null,
        data.next_interest_date ?? null,
        data.remarks ?? null,
        data.created_by,
      ],
    );

    return result.insertId;
  },

  /**
   * Find loan by ID with comprehensive joined details
   */
  async findById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
        l.*,
        c.customer_no,
        c.first_name,
        c.last_name,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        p.plan_name,
        p.plan_code,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
       FROM interest_loans l
       INNER JOIN customers c ON l.customer_id = c.id
       INNER JOIN interest_loan_plans p ON l.interest_plan_id = p.id
       LEFT JOIN users u1 ON l.created_by = u1.id
       LEFT JOIN users u2 ON l.updated_by = u2.id
       WHERE l.id = ?`,
      [id],
    );

    return formatLoanRow(rows[0]);
  },

  /**
   * Get all loans with filters, search, and pagination
   */
  async getAll(filters = {}) {
    const db = getDB();

    let query = `
      SELECT 
        l.*,
        c.customer_no,
        c.first_name,
        c.last_name,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        p.plan_name,
        p.plan_code
      FROM interest_loans l
      INNER JOIN customers c ON l.customer_id = c.id
      INNER JOIN interest_loan_plans p ON l.interest_plan_id = p.id
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

    if (filters.interest_frequency) {
      query += ` AND l.interest_frequency = ?`;
      params.push(filters.interest_frequency);
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
      query += ` AND (
        l.loan_no LIKE ? OR 
        c.customer_no LIKE ? OR 
        c.first_name LIKE ? OR 
        c.last_name LIKE ? OR 
        c.mobile LIKE ? OR
        p.plan_name LIKE ?
      )`;
      const searchPattern = `%${filters.search}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    query += ` ORDER BY l.id DESC`;

    if (filters.limit) {
      const limit = parseInt(filters.limit, 10);
      const page = parseInt(filters.page, 10) || 1;
      const offset = (page - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const [rows] = await db.query(query, params);
    return rows.map(formatLoanRow);
  },

  /**
   * Count loans with filters
   */
  async count(filters = {}) {
    const db = getDB();

    let query = `
      SELECT COUNT(*) AS total 
      FROM interest_loans l
      INNER JOIN customers c ON l.customer_id = c.id
      INNER JOIN interest_loan_plans p ON l.interest_plan_id = p.id
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

    if (filters.interest_frequency) {
      query += ` AND l.interest_frequency = ?`;
      params.push(filters.interest_frequency);
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
      query += ` AND (
        l.loan_no LIKE ? OR 
        c.customer_no LIKE ? OR 
        c.first_name LIKE ? OR 
        c.last_name LIKE ? OR 
        c.mobile LIKE ? OR
        p.plan_name LIKE ?
      )`;
      const searchPattern = `%${filters.search}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    const [rows] = await db.query(query, params);
    return rows[0]?.total || 0;
  },

  /**
   * Get all loans for a specific customer
   */
  async findByCustomer(customer_id) {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT 
        l.*,
        p.plan_name,
        p.plan_code
       FROM interest_loans l
       INNER JOIN interest_loan_plans p ON l.interest_plan_id = p.id
       WHERE l.customer_id = ?
       ORDER BY l.id DESC`,
      [customer_id],
    );
    return rows.map(formatLoanRow);
  },

  /**
   * Check whether any payment has been recorded for this loan
   */
  async hasPayments(conn, loanId) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM interest_loan_payments WHERE loan_id = ?) AS payments_count,
        (SELECT IFNULL(total_principal_paid, 0) + IFNULL(total_interest_paid, 0) FROM interest_loans WHERE id = ?) AS total_paid,
        (SELECT COUNT(*) FROM interest_loan_periods WHERE loan_id = ? AND (IFNULL(paid_interest_amount, 0) > 0 OR status IN ('partial', 'paid'))) AS period_payments
      `,
      [loanId, loanId, loanId],
    );

    if (rows.length === 0) return false;
    const { payments_count, total_paid, period_payments } = rows[0];
    return (
      Number(payments_count) > 0 ||
      Number(total_paid) > 0 ||
      Number(period_payments) > 0
    );
  },

  /**
   * Update interest loan fields
   */
  async update(conn, id, data) {
    const allowed = [
      "principal_amount",
      "outstanding_principal",
      "interest_plan_id",
      "interest_type",
      "interest_rate",
      "interest_frequency",
      "calculation_method",
      "principal_basis",
      "start_date",
      "next_interest_date",
      "remarks",
      "updated_by",
    ];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await conn.query(
      `UPDATE interest_loans SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  /**
   * Delete loan record
   */
  async delete(conn, id) {
    await conn.query(`DELETE FROM interest_loans WHERE id = ?`, [id]);
  },

  /**
   * Get portfolio summary metrics
   */
  async getSummary(conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(`
      SELECT 
        COUNT(*) AS total_loans,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_loans,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_loans,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_loans,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_loans,
        COALESCE(SUM(principal_amount), 0) AS total_principal_disbursed,
        COALESCE(SUM(outstanding_principal), 0) AS total_outstanding_principal,
        COALESCE(SUM(total_principal_paid), 0) AS total_principal_collected,
        COALESCE(SUM(total_interest_accrued), 0) AS total_interest_accrued,
        COALESCE(SUM(total_interest_paid), 0) AS total_interest_collected,
        COALESCE(SUM(outstanding_interest), 0) AS total_outstanding_interest
      FROM interest_loans
    `);
    return rows[0] || {};
  },
};
