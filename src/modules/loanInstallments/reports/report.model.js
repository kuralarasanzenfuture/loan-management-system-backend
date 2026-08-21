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

    // 🔥 DATE FILTERS

    if (filters.date) {
      query += ` AND DATE(li.paid_date) = ?`;
      params.push(filters.date);
    }

    if (filters.from_date) {
      query += ` AND DATE(li.paid_date) >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND DATE(li.paid_date) <= ?`;
      params.push(filters.to_date);
    }

    // 🔥 EXTRA FILTERS

    if (filters.customer_id) {
      query += ` AND c.id = ?`;
      params.push(filters.customer_id);
    }

    if (filters.loan_id) {
      query += ` AND li.loan_id = ?`;
      params.push(filters.loan_id);
    }

    query += ` ORDER BY li.paid_date DESC`;

    const [rows] = await db.query(query, params);

    return rows;
  },
};

export default ReportModel;
