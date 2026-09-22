import { getDB } from "../../../config/db.js";

const formatPaymentRow = (row) => {
  if (!row) return null;
  return {
    ...row,
    payment_amount: parseFloat(row.payment_amount),
    interest_amount: parseFloat(row.interest_amount || 0),
    principal_amount: parseFloat(row.principal_amount || 0),
    outstanding_interest_before: parseFloat(row.outstanding_interest_before || 0),
    outstanding_principal_before: parseFloat(row.outstanding_principal_before || 0),
    outstanding_interest_after: parseFloat(row.outstanding_interest_after || 0),
    outstanding_principal_after: parseFloat(row.outstanding_principal_after || 0),
  };
};

export const InterestLoanPaymentModel = {
  /**
   * Concurrently safe next payment number generator per loan
   */
  async getNextPaymentNo(conn, loan_id) {
    const [rows] = await conn.query(
      `SELECT COALESCE(MAX(payment_no), 0) + 1 AS next_no 
       FROM interest_loan_payments 
       WHERE loan_id = ? 
       FOR UPDATE`,
      [loan_id]
    );
    return rows[0].next_no;
  },

  /**
   * Insert payment master record into interest_loan_payments
   */
  async createPayment(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO interest_loan_payments (
        loan_id,
        payment_no,
        payment_date,
        payment_amount,
        interest_amount,
        principal_amount,
        outstanding_interest_before,
        outstanding_principal_before,
        outstanding_interest_after,
        outstanding_principal_after,
        payment_mode,
        transaction_reference,
        cheque_number,
        remarks,
        received_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.loan_id,
        data.payment_no,
        data.payment_date,
        data.payment_amount,
        data.interest_amount ?? 0.0,
        data.principal_amount ?? 0.0,
        data.outstanding_interest_before,
        data.outstanding_principal_before,
        data.outstanding_interest_after,
        data.outstanding_principal_after,
        data.payment_mode,
        data.transaction_reference ?? null,
        data.cheque_number ?? null,
        data.remarks ?? null,
        data.received_by ?? null,
      ]
    );

    return result.insertId;
  },

  /**
   * Insert payment allocation line into interest_loan_payment_allocations
   */
  async createAllocation(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO interest_loan_payment_allocations (
        payment_id,
        interest_period_id,
        allocation_type,
        amount
      ) VALUES (?, ?, ?, ?)`,
      [
        data.payment_id,
        data.interest_period_id ?? null,
        data.allocation_type,
        data.amount,
      ]
    );

    return result.insertId;
  },

  /**
   * Find single payment by ID with joined loan, customer, and user info
   */
  async getById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
        p.*,
        l.loan_no,
        l.principal_amount AS loan_original_principal,
        l.interest_rate AS loan_interest_rate,
        l.interest_frequency AS loan_interest_frequency,
        l.status AS loan_status,
        c.id AS customer_id,
        c.customer_no,
        c.first_name,
        c.last_name,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        u.username AS received_by_name
       FROM interest_loan_payments p
       INNER JOIN interest_loans l ON p.loan_id = l.id
       INNER JOIN customers c ON l.customer_id = c.id
       LEFT JOIN users u ON p.received_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    return formatPaymentRow(rows[0]);
  },

  /**
   * Retrieve all allocation breakdown line items for a payment
   */
  async getAllocationsByPaymentId(payment_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
        a.id AS allocation_id,
        a.payment_id,
        a.interest_period_id,
        a.allocation_type,
        CAST(a.amount AS DECIMAL(15, 2)) AS amount,
        a.created_at,
        per.period_no,
        per.period_start_date,
        per.period_end_date,
        per.scheduled_date,
        per.interest_rate AS period_interest_rate,
        per.status AS period_status
       FROM interest_loan_payment_allocations a
       LEFT JOIN interest_loan_periods per ON a.interest_period_id = per.id
       WHERE a.payment_id = ?
       ORDER BY a.id ASC`,
      [payment_id]
    );

    return rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
    }));
  },

  /**
   * List payments with advanced filters, search, and pagination
   */
  async getAll(filters = {}) {
    const db = getDB();

    let query = `
      SELECT 
        p.*,
        l.loan_no,
        l.status AS loan_status,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        u.username AS received_by_name,
        (SELECT COUNT(*) FROM interest_loan_payment_allocations WHERE payment_id = p.id) AS allocations_count
      FROM interest_loan_payments p
      INNER JOIN interest_loans l ON p.loan_id = l.id
      INNER JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users u ON p.received_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.loan_id) {
      query += ` AND p.loan_id = ?`;
      params.push(filters.loan_id);
    }

    if (filters.customer_id) {
      query += ` AND l.customer_id = ?`;
      params.push(filters.customer_id);
    }

    if (filters.payment_mode) {
      query += ` AND p.payment_mode = ?`;
      params.push(filters.payment_mode);
    }

    if (filters.from_date) {
      query += ` AND DATE(p.payment_date) >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND DATE(p.payment_date) <= ?`;
      params.push(filters.to_date);
    }

    if (filters.search) {
      query += ` AND (
        l.loan_no LIKE ? OR 
        c.customer_no LIKE ? OR 
        c.first_name LIKE ? OR 
        c.last_name LIKE ? OR 
        c.mobile LIKE ? OR 
        p.transaction_reference LIKE ? OR 
        p.cheque_number LIKE ?
      )`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term, term, term);
    }

    // Count total records
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS t`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Sorting & Pagination
    const allowedSortFields = {
      id: "p.id",
      payment_no: "p.payment_no",
      payment_date: "p.payment_date",
      payment_amount: "p.payment_amount",
      created_at: "p.created_at",
    };

    const sortBy = allowedSortFields[filters.sort_by] || "p.id";
    const sortOrder =
      filters.sort_order && filters.sort_order.toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    return {
      payments: rows.map(formatPaymentRow),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get all payments for a specific loan
   */
  async getByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
        p.*,
        l.loan_no,
        l.status AS loan_status,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        u.username AS received_by_name,
        (SELECT COUNT(*) FROM interest_loan_payment_allocations WHERE payment_id = p.id) AS allocations_count
       FROM interest_loan_payments p
       INNER JOIN interest_loans l ON p.loan_id = l.id
       INNER JOIN customers c ON l.customer_id = c.id
       LEFT JOIN users u ON p.received_by = u.id
       WHERE p.loan_id = ?
       ORDER BY p.payment_no DESC`,
      [loan_id]
    );

    return rows.map(formatPaymentRow);
  },

  /**
   * Get all payments for a customer
   */
  async getByCustomerId(customer_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
        p.*,
        l.loan_no,
        l.status AS loan_status,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        u.username AS received_by_name
       FROM interest_loan_payments p
       INNER JOIN interest_loans l ON p.loan_id = l.id
       INNER JOIN customers c ON l.customer_id = c.id
       LEFT JOIN users u ON p.received_by = u.id
       WHERE l.customer_id = ?
       ORDER BY p.payment_date DESC`,
      [customer_id]
    );

    return rows.map(formatPaymentRow);
  },

  /**
   * Summary analytics for payments
   */
  async getSummary(filters = {}, conn = null) {
    const client = conn || getDB();

    let query = `
      SELECT 
        COUNT(*) AS total_payments,
        COALESCE(SUM(p.payment_amount), 0.00) AS total_amount_collected,
        COALESCE(SUM(p.interest_amount), 0.00) AS total_interest_collected,
        COALESCE(SUM(p.principal_amount), 0.00) AS total_principal_collected,
        COALESCE(SUM(CASE WHEN p.payment_mode = 'cash' THEN p.payment_amount ELSE 0 END), 0.00) AS cash_collected,
        COALESCE(SUM(CASE WHEN p.payment_mode = 'bank' THEN p.payment_amount ELSE 0 END), 0.00) AS bank_collected,
        COALESCE(SUM(CASE WHEN p.payment_mode = 'upi' THEN p.payment_amount ELSE 0 END), 0.00) AS upi_collected,
        COALESCE(SUM(CASE WHEN p.payment_mode = 'cheque' THEN p.payment_amount ELSE 0 END), 0.00) AS cheque_collected,
        COALESCE(SUM(CASE WHEN p.payment_mode = 'other' THEN p.payment_amount ELSE 0 END), 0.00) AS other_collected
      FROM interest_loan_payments p
      INNER JOIN interest_loans l ON p.loan_id = l.id
      WHERE 1=1
    `;

    const params = [];
    if (filters.loan_id) {
      query += ` AND p.loan_id = ?`;
      params.push(filters.loan_id);
    }
    if (filters.customer_id) {
      query += ` AND l.customer_id = ?`;
      params.push(filters.customer_id);
    }
    if (filters.from_date) {
      query += ` AND DATE(p.payment_date) >= ?`;
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      query += ` AND DATE(p.payment_date) <= ?`;
      params.push(filters.to_date);
    }

    const [rows] = await client.query(query, params);
    const summary = rows[0] || {};

    return {
      total_payments: Number(summary.total_payments || 0),
      total_amount_collected: parseFloat(summary.total_amount_collected || 0),
      total_interest_collected: parseFloat(summary.total_interest_collected || 0),
      total_principal_collected: parseFloat(summary.total_principal_collected || 0),
      by_mode: {
        cash: parseFloat(summary.cash_collected || 0),
        bank: parseFloat(summary.bank_collected || 0),
        upi: parseFloat(summary.upi_collected || 0),
        cheque: parseFloat(summary.cheque_collected || 0),
        other: parseFloat(summary.other_collected || 0),
      },
    };
  },

  /**
   * Delete payment (allocations cascade deleted via foreign key)
   */
  async deletePayment(id, conn) {
    const [result] = await conn.query(
      `DELETE FROM interest_loan_payments WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },
};
