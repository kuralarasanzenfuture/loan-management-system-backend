import { getDB } from "../../config/db.js";

export const LoanPaymentModel = {
  /**
   * Generates next payment number for a given loan (locks rows for update)
   * @param {Object} conn 
   * @param {number} loanId 
   * @returns {Promise<number>}
   */
  async getNextPaymentNo(conn, loanId) {
    const [[row]] = await conn.query(
      `
      SELECT COALESCE(MAX(payment_no), 0) + 1 AS next_no
      FROM loan_payments
      WHERE loan_id = ?
      FOR UPDATE
      `,
      [loanId],
    );

    return Number(row?.next_no || 1);
  },

  /**
   * Inserts a new loan payment
   * @param {Object} conn 
   * @param {Object} data 
   * @returns {Promise<number>} insertId
   */
  async create(conn, data) {
    const [result] = await conn.query(
      `
      INSERT INTO loan_payments (
        loan_id,
        installment_id,
        payment_no,
        payment_date,
        payment_amount,
        payment_mode,
        transaction_reference,
        cheque_number,
        remarks,
        received_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.loan_id,
        data.installment_id,
        data.payment_no,
        data.payment_date,
        data.payment_amount,
        data.payment_mode,
        data.transaction_reference || null,
        data.cheque_number || null,
        data.remarks || null,
        data.received_by || null,
      ],
    );

    return result.insertId;
  },

  /**
   * Finds payment by primary ID with full relations
   * @param {Object} connOrDb 
   * @param {number} id 
   */
  async findById(connOrDb, id) {
    const db = connOrDb || getDB();

    const [[payment]] = await db.query(
      `
      SELECT
        lp.*,
        l.loan_no,
        l.loan_amount,
        l.total_repayment,
        l.status AS loan_status,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        li.installment_no,
        li.due_date AS installment_due_date,
        li.total_due AS installment_total_due,
        li.paid_amount AS installment_paid_amount,
        li.balance_amount AS installment_balance_amount,
        li.status AS installment_status,
        u.username AS received_by_user
      FROM loan_payments lp
      JOIN loans l ON l.id = lp.loan_id
      JOIN customers c ON c.id = l.customer_id
      JOIN loan_installments li ON li.id = lp.installment_id
      LEFT JOIN users u ON u.id = lp.received_by
      WHERE lp.id = ?
      `,
      [id],
    );

    return payment || null;
  },

  /**
   * Finds all payments with filtering and pagination
   * @param {Object} connOrDb 
   * @param {Object} filters 
   */
  async findAll(connOrDb, filters = {}) {
    const db = connOrDb || getDB();
    const {
      page = 1,
      limit = 10,
      loan_id,
      installment_id,
      customer_id,
      payment_mode,
      from_date,
      to_date,
      search,
    } = filters;

    const whereClauses = ["1=1"];
    const params = [];

    if (loan_id) {
      whereClauses.push("lp.loan_id = ?");
      params.push(loan_id);
    }

    if (installment_id) {
      whereClauses.push("lp.installment_id = ?");
      params.push(installment_id);
    }

    if (customer_id) {
      whereClauses.push("l.customer_id = ?");
      params.push(customer_id);
    }

    if (payment_mode) {
      whereClauses.push("lp.payment_mode = ?");
      params.push(payment_mode);
    }

    if (from_date) {
      whereClauses.push("DATE(lp.payment_date) >= ?");
      params.push(from_date);
    }

    if (to_date) {
      whereClauses.push("DATE(lp.payment_date) <= ?");
      params.push(to_date);
    }

    if (search && search.trim()) {
      const sp = `%${search.trim()}%`;
      whereClauses.push(`(
        l.loan_no LIKE ?
        OR c.customer_no LIKE ?
        OR c.first_name LIKE ?
        OR c.last_name LIKE ?
        OR c.mobile LIKE ?
        OR lp.transaction_reference LIKE ?
        OR lp.cheque_number LIKE ?
      )`);
      params.push(sp, sp, sp, sp, sp, sp, sp);
    }

    const whereSQL = whereClauses.join(" AND ");
    const offset = (Number(page) - 1) * Number(limit);

    const [[countRow]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM loan_payments lp
      JOIN loans l ON l.id = lp.loan_id
      JOIN customers c ON c.id = l.customer_id
      WHERE ${whereSQL}
      `,
      params,
    );

    const [rows] = await db.query(
      `
      SELECT
        lp.*,
        l.loan_no,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        li.installment_no,
        li.due_date AS installment_due_date,
        li.total_due AS installment_total_due,
        li.status AS installment_status,
        u.username AS received_by_user
      FROM loan_payments lp
      JOIN loans l ON l.id = lp.loan_id
      JOIN customers c ON c.id = l.customer_id
      JOIN loan_installments li ON li.id = lp.installment_id
      LEFT JOIN users u ON u.id = lp.received_by
      WHERE ${whereSQL}
      ORDER BY lp.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), offset],
    );

    return {
      page: Number(page),
      limit: Number(limit),
      total: countRow?.total || 0,
      total_pages: Math.ceil((countRow?.total || 0) / Number(limit)),
      data: rows,
    };
  },

  /**
   * Get all payments for a specific loan
   * @param {Object} connOrDb 
   * @param {number} loanId 
   */
  async findByLoanId(connOrDb, loanId) {
    const db = connOrDb || getDB();

    const [rows] = await db.query(
      `
      SELECT
        lp.*,
        li.installment_no,
        li.due_date AS installment_due_date,
        li.total_due AS installment_total_due,
        li.status AS installment_status,
        u.username AS received_by_user
      FROM loan_payments lp
      JOIN loan_installments li ON li.id = lp.installment_id
      LEFT JOIN users u ON u.id = lp.received_by
      WHERE lp.loan_id = ?
      ORDER BY lp.payment_no ASC
      `,
      [loanId],
    );

    return rows;
  },

  /**
   * Get all payments for a specific installment
   * @param {Object} connOrDb 
   * @param {number} installmentId 
   */
  async findByInstallmentId(connOrDb, installmentId) {
    const db = connOrDb || getDB();

    const [rows] = await db.query(
      `
      SELECT
        lp.*,
        u.username AS received_by_user
      FROM loan_payments lp
      LEFT JOIN users u ON u.id = lp.received_by
      WHERE lp.installment_id = ?
      ORDER BY lp.payment_no ASC
      `,
      [installmentId],
    );

    return rows;
  },

  /**
   * Generates rich receipt data for printable receipt vouchers
   * @param {Object} connOrDb 
   * @param {number} id 
   */
  async getReceipt(connOrDb, id) {
    const db = connOrDb || getDB();

    const [[payment]] = await db.query(
      `
      SELECT
        lp.*,
        l.loan_no,
        l.loan_amount,
        l.total_repayment,
        l.start_date AS loan_start_date,
        l.end_date AS loan_end_date,
        l.status AS loan_status,
        plan.plan_name,
        plan.plan_code,
        plan.collection_frequency,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        c.address,
        c.city,
        c.pincode,
        li.installment_no,
        li.due_date AS installment_due_date,
        li.total_due AS installment_total_due,
        li.paid_amount AS installment_paid_amount,
        li.balance_amount AS installment_balance_amount,
        li.status AS installment_status,
        u.username AS received_by_user
      FROM loan_payments lp
      JOIN loans l ON l.id = lp.loan_id
      JOIN loan_plans plan ON plan.id = l.loan_plan_id
      JOIN customers c ON c.id = l.customer_id
      JOIN loan_installments li ON li.id = lp.installment_id
      LEFT JOIN users u ON u.id = lp.received_by
      WHERE lp.id = ?
      `,
      [id],
    );

    if (!payment) return null;

    // Fetch company info for receipt header
    const [[company]] = await db.query(
      `SELECT company_name, phone, email, address_line_1, city, pincode, gst_number FROM company_details LIMIT 1`,
    );

    return {
      receipt_no: `RCP-${String(payment.loan_id).padStart(4, "0")}-${String(payment.payment_no).padStart(4, "0")}`,
      payment,
      company: company || null,
    };
  },

  /**
   * Analytics and summary metrics
   * @param {Object} connOrDb 
   * @param {Object} filters 
   */
  async getSummary(connOrDb, filters = {}) {
    const db = connOrDb || getDB();
    const whereClauses = ["1=1"];
    const params = [];

    if (filters.from_date) {
      whereClauses.push("DATE(payment_date) >= ?");
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      whereClauses.push("DATE(payment_date) <= ?");
      params.push(filters.to_date);
    }

    const whereSQL = whereClauses.join(" AND ");

    const [[overall]] = await db.query(
      `
      SELECT
        COUNT(*) AS total_payments,
        COALESCE(SUM(payment_amount), 0) AS total_collected,
        COALESCE(SUM(CASE WHEN DATE(payment_date) = CURDATE() THEN payment_amount ELSE 0 END), 0) AS today_collected,
        COUNT(CASE WHEN DATE(payment_date) = CURDATE() THEN 1 END) AS today_payments_count
      FROM loan_payments
      WHERE ${whereSQL}
      `,
      params,
    );

    const [modeBreakdown] = await db.query(
      `
      SELECT
        payment_mode,
        COUNT(*) AS count,
        COALESCE(SUM(payment_amount), 0) AS amount
      FROM loan_payments
      WHERE ${whereSQL}
      GROUP BY payment_mode
      ORDER BY amount DESC
      `,
      params,
    );

    return {
      overall,
      mode_breakdown: modeBreakdown,
    };
  },

  /**
   * Deletes a payment record
   * @param {Object} conn 
   * @param {number} id 
   */
  async delete(conn, id) {
    const [result] = await conn.query(
      `DELETE FROM loan_payments WHERE id = ?`,
      [id],
    );
    return result.affectedRows;
  },
};
