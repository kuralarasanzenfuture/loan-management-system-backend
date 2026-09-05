import { getDB } from "../../../config/db.js";

export const PaymentModel = {
  async getNextPaymentNo(conn, loan_id) {
    const [[row]] = await conn.query(
      `SELECT COALESCE(MAX(payment_no), 0) + 1 AS next_no 
       FROM interest_only_loan_payments 
       WHERE loan_id = ? 
       FOR UPDATE`,
      [loan_id],
    );
    return row ? Number(row.next_no) : 1;
  },

  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO interest_only_loan_payments
       (loan_id, payment_no, payment_date, payment_amount, payment_mode,
        transaction_reference, cheque_number, remarks, received_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.loan_id,
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
    return res.insertId;
  },

  async insertAllocation(conn, data) {
    await conn.query(
      `INSERT INTO interest_only_loan_payment_allocations
       (payment_id, schedule_id, allocation_type, amount)
       VALUES (?, ?, ?, ?)`,
      [data.payment_id, data.schedule_id, data.allocation_type, data.amount],
    );
  },

  async getByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    const query = `
      SELECT 
        p.*,
        u.username AS received_by_name
      FROM interest_only_loan_payments p
      LEFT JOIN users u ON p.received_by = u.id
      WHERE p.loan_id = ?
      ORDER BY p.payment_no DESC, p.id DESC
    `;
    const [rows] = await client.query(query, [loan_id]);
    return rows;
  },

  async getById(id, conn = null) {
    const client = conn || getDB();
    const query = `
      SELECT 
        p.*,
        l.loan_no,
        l.customer_id,
        u.username AS received_by_name
      FROM interest_only_loan_payments p
      JOIN interest_only_loans l ON p.loan_id = l.id
      LEFT JOIN users u ON p.received_by = u.id
      WHERE p.id = ?
    `;
    const [rows] = await client.query(query, [id]);
    return rows[0] || null;
  },

  async getAllocationsByPaymentId(payment_id, conn = null) {
    const client = conn || getDB();
    const query = `
      SELECT 
        a.*,
        s.schedule_no,
        s.due_date
      FROM interest_only_loan_payment_allocations a
      LEFT JOIN interest_only_loan_schedules s ON a.schedule_id = s.id
      WHERE a.payment_id = ?
      ORDER BY a.id ASC
    `;
    const [rows] = await client.query(query, [payment_id]);
    return rows;
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM interest_only_loan_payments WHERE id = ?`, [
      id,
    ]);
  },
};
