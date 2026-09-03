import { getDB } from "../../../config/db.js";

const ReportModel = {
  async findCollections(filters = {}) {
    const db = getDB();

    let query = `
      SELECT
        li.id,
        li.loan_id,
        li.installment_no,
        li.paid_amount,
        li.paid_date,

        l.loan_no,

        c.id AS customer_id,
        c.first_name,
        c.last_name,
        c.mobile

      FROM loan_installments li
      JOIN loans l ON l.id = li.loan_id
      JOIN customers c ON c.id = l.customer_id

      WHERE li.paid_amount > 0
    `;

    const params = [];

    // DATE FILTERS
    if (filters.date && filters.date !== "all") {
      query += " AND DATE(li.paid_date) = ?";
      params.push(filters.date);
    }

    if (filters.from_date) {
      query += " AND DATE(li.paid_date) >= ?";
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += " AND DATE(li.paid_date) <= ?";
      params.push(filters.to_date);
    }

    // GLOBAL SEARCH (matches Customer Name, Mobile, or Loan Number)
    if (filters.search && typeof filters.search === "string" && filters.search.trim()) {
      const searchPattern = `%${filters.search.trim()}%`;
      query += ` AND (
        CONCAT_WS(' ', c.first_name, c.last_name) LIKE ?
        OR c.first_name LIKE ?
        OR c.last_name LIKE ?
        OR c.mobile LIKE ?
        OR l.loan_no LIKE ?
      )`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // DEDICATED SEARCH FILTERS
    if (filters.customer_name && typeof filters.customer_name === "string" && filters.customer_name.trim()) {
      const namePattern = `%${filters.customer_name.trim()}%`;
      query += ` AND (
        CONCAT_WS(' ', c.first_name, c.last_name) LIKE ?
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
      query += " AND li.loan_id = ?";
      params.push(filters.loan_id);
    }

    query += " ORDER BY li.paid_date DESC";

    const [rows] = await db.query(query, params);

    return rows;
  },
};

export default ReportModel;
