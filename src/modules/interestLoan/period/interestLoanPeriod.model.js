import { getDB } from "../../../config/db.js";

export const InterestLoanPeriodModel = {
  /**
   * Insert interest loan period
   */
  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO interest_loan_periods (
        loan_id,
        period_no,
        period_start_date,
        period_end_date,
        scheduled_date,
        opening_principal,
        interest_rate,
        interest_amount,
        paid_interest_amount,
        outstanding_interest_amount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.loan_id,
        data.period_no,
        data.period_start_date,
        data.period_end_date,
        data.scheduled_date,
        data.opening_principal,
        data.interest_rate,
        data.interest_amount,
        data.paid_interest_amount ?? 0.0,
        data.outstanding_interest_amount ?? data.interest_amount,
        data.status ?? "pending",
      ],
    );

    return result.insertId;
  },

  /**
   * Get all periods for a loan ordered by period_no
   */
  async getByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_loan_periods WHERE loan_id = ? ORDER BY period_no ASC`,
      [loan_id],
    );
    return rows;
  },

  /**
   * Find period by ID
   */
  async findById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_loan_periods WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  /**
   * Automatically update period statuses based on current date
   * Transitions 'pending' to 'due' if scheduled_date <= CURRENT_DATE()
   */
  async syncDueStatuses(loan_id = null, conn = null) {
    const client = conn || getDB();
    let query = `
      UPDATE interest_loan_periods 
      SET status = 'due' 
      WHERE status = 'pending' AND scheduled_date <= CURRENT_DATE()
    `;
    const params = [];

    if (loan_id) {
      query += ` AND loan_id = ?`;
      params.push(loan_id);
    }

    await client.query(query, params);
  },

  /**
   * Update initial Period 1 before any payments are made
   */
  async updatePeriod1(conn, loan_id, data) {
    await conn.query(
      `UPDATE interest_loan_periods
       SET period_start_date = ?,
           period_end_date = ?,
           scheduled_date = ?,
           opening_principal = ?,
           interest_rate = ?,
           interest_amount = ?,
           outstanding_interest_amount = ?,
           status = ?
       WHERE loan_id = ? AND period_no = 1`,
      [
        data.period_start_date,
        data.period_end_date,
        data.scheduled_date,
        data.opening_principal,
        data.interest_rate,
        data.interest_amount,
        data.outstanding_interest_amount,
        data.status,
        loan_id,
      ],
    );
  },

  /**
   * Delete all periods for a loan (only when uncommitted and no payments)
   */
  async deleteByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    await client.query(
      `DELETE FROM interest_loan_periods WHERE loan_id = ?`,
      [loan_id],
    );
  },
};
