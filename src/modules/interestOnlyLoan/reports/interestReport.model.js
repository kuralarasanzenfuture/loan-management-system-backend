import { getDB } from "../../../config/db.js";

const InterestReportModel = {
  /**
   * Find interest collections based on filters
   * @param {Object} filters
   */
  async findCollections(filters = {}) {
    const db = getDB();

    let query = `
      SELECT
        p.id,
        p.loan_id,
        p.payment_no,
        p.payment_date,
        p.payment_amount,
        p.payment_mode,
        p.transaction_reference,
        p.cheque_number,
        p.remarks,
        p.received_by,
        u.username AS received_by_name,

        l.loan_no,
        l.principal_amount,
        l.interest_rate,
        l.interest_frequency,
        l.status AS loan_status,
        plan.plan_name,

        c.id AS customer_id,
        c.customer_no,
        c.first_name,
        c.last_name,
        c.mobile,

        COALESCE(SUM(CASE WHEN a.allocation_type = \'interest\' THEN a.amount ELSE 0 END), 0) AS interest_amount,
        COALESCE(SUM(CASE WHEN a.allocation_type = \'principal\' THEN a.amount ELSE 0 END), 0) AS principal_amount

      FROM interest_only_loan_payments p
      JOIN interest_only_loans l ON l.id = p.loan_id
      JOIN customers c ON c.id = l.customer_id
      LEFT JOIN interest_only_loan_plans plan ON plan.id = l.interest_plan_id
      LEFT JOIN users u ON u.id = p.received_by
      LEFT JOIN interest_only_loan_payment_allocations a ON a.payment_id = p.id

      WHERE p.payment_amount > 0
    `;

    const params = [];

    // DATE FILTERS
    if (filters.date && filters.date !== "all") {
      query += " AND DATE(p.payment_date) = ?";
      params.push(filters.date);
    }

    if (filters.from_date) {
      query += " AND DATE(p.payment_date) >= ?";
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += " AND DATE(p.payment_date) <= ?";
      params.push(filters.to_date);
    }

    // PAYMENT MODE
    if (filters.payment_mode && filters.payment_mode !== "all") {
      query += " AND p.payment_mode = ?";
      params.push(filters.payment_mode);
    }

    // UNIVERSAL SEARCH (Customer Name, Mobile, Loan Number, Reference, Cheque)
    if (filters.search && typeof filters.search === "string" && filters.search.trim()) {
      const searchPattern = `%${filters.search.trim()}%`;
      query += ` AND (
        CONCAT_WS(\' \', c.first_name, c.last_name) LIKE ?
        OR c.first_name LIKE ?
        OR c.last_name LIKE ?
        OR c.mobile LIKE ?
        OR l.loan_no LIKE ?
        OR p.transaction_reference LIKE ?
        OR p.cheque_number LIKE ?
      )`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      );
    }

    // DEDICATED FILTERS
    if (filters.customer_name && typeof filters.customer_name === "string" && filters.customer_name.trim()) {
      const namePattern = `%${filters.customer_name.trim()}%`;
      query += ` AND (
        CONCAT_WS(\' \', c.first_name, c.last_name) LIKE ?
        OR c.first_name LIKE ?
        OR c.last_name LIKE ?
      )`;
      params.push(namePattern, namePattern, namePattern);
    }

    const phoneFilter = filters.phone || filters.mobile;
    if (phoneFilter && typeof phoneFilter === "string" && phoneFilter.trim()) {
      query += " AND c.mobile LIKE ?";
      params.push(`%${phoneFilter.trim()}%`);
    }

    if (filters.loan_no && typeof filters.loan_no === "string" && filters.loan_no.trim()) {
      query += " AND l.loan_no LIKE ?";
      params.push(`%${filters.loan_no.trim()}%`);
    }

    if (filters.customer_id) {
      query += " AND c.id = ?";
      params.push(filters.customer_id);
    }

    if (filters.loan_id) {
      query += " AND p.loan_id = ?";
      params.push(filters.loan_id);
    }

    query += `
      GROUP BY p.id
      ORDER BY p.payment_date DESC, p.id DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  },
};

export default InterestReportModel;
