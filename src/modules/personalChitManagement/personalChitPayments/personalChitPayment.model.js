import { getDB } from "../../../config/db.js";

const PersonalChitPaymentModel = {
  /* =====================================================
     CREATE PAYMENT
  ===================================================== */

  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO personal_chit_payments (
        chit_id,
        installment_no,
        due_date,
        payment_date,
        due_amount,
        paid_amount,
        pending_amount,
        payment_mode,
        transaction_reference,
        status,
        remarks,
        created_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        data.chit_id,
        data.installment_no,
        data.due_date,
        data.payment_date,
        data.due_amount,
        data.paid_amount,
        data.pending_amount,
        data.payment_mode,
        data.transaction_reference,
        data.status,
        data.remarks,
        data.created_by,
      ],
    );

    return result.insertId;
  },

  /* =====================================================
     GET ALL PAYMENTS
  ===================================================== */

  async findAll(chitId, filters = {}) {
    const db = getDB();

    let query = `
      SELECT *
      FROM personal_chit_payments
      WHERE chit_id = ?
    `;

    const params = [chitId];

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.installment_no) {
      query += ` AND installment_no = ?`;
      params.push(filters.installment_no);
    }

    if (filters.from_date) {
      query += ` AND due_date >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND due_date <= ?`;
      params.push(filters.to_date);
    }

    if (filters.payment_mode) {
      query += ` AND payment_mode = ?`;
      params.push(filters.payment_mode);
    }

    query += ` ORDER BY installment_no ASC`;

    const [rows] = await db.query(query, params);

    return rows;
  },

  /* =====================================================
     GET PAYMENT BY ID
  ===================================================== */

  async findById(chitId, paymentId) {
    const db = getDB();

    const [[row]] = await db.query(
      `SELECT *
       FROM personal_chit_payments
       WHERE id = ?
       AND chit_id = ?`,
      [paymentId, chitId],
    );

    return row;
  },

  /* =====================================================
     GET PAYMENT WITH LOCK
  ===================================================== */

  async findByIdWithConn(conn, chitId, paymentId) {
    const [[row]] = await conn.query(
      `SELECT *
       FROM personal_chit_payments
       WHERE id = ?
       AND chit_id = ?
       FOR UPDATE`,
      [paymentId, chitId],
    );

    return row;
  },

  /* =====================================================
     FIND INSTALLMENT
  ===================================================== */

  async findByInstallment(conn, chitId, installmentNo) {
    const [[row]] = await conn.query(
      `SELECT *
       FROM personal_chit_payments
       WHERE chit_id = ?
       AND installment_no = ?
       FOR UPDATE`,
      [chitId, installmentNo],
    );

    return row;
  },

  /* =====================================================
     UPDATE PAYMENT
  ===================================================== */

  async update(conn, paymentId, chitId, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      "installment_no",
      "due_date",
      "payment_date",
      "due_amount",
      "paid_amount",
      "pending_amount",
      "payment_mode",
      "transaction_reference",
      "status",
      "remarks",
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (!fields.length) {
      throw {
        status: 400,
        message: "No fields provided for update",
      };
    }

    values.push(paymentId, chitId);

    await conn.query(
      `UPDATE personal_chit_payments
       SET ${fields.join(", ")}
       WHERE id = ?
       AND chit_id = ?`,
      values,
    );
  },

  /* =====================================================
     UPDATE CALCULATED PAYMENT VALUES
  ===================================================== */

  async updateCalculated(conn, id, data) {
    await conn.query(
      `UPDATE personal_chit_payments
       SET
         paid_amount = ?,
         pending_amount = ?,
         payment_date = ?,
         payment_mode = ?,
         transaction_reference = ?,
         status = ?
       WHERE id = ?`,
      [
        data.paid_amount,
        data.pending_amount,
        data.payment_date,
        data.payment_mode,
        data.transaction_reference,
        data.status,
        id,
      ],
    );
  },

  /* =====================================================
     DELETE
  ===================================================== */

  async delete(conn, chitId, paymentId) {
    await conn.query(
      `DELETE FROM personal_chit_payments
       WHERE id = ?
       AND chit_id = ?`,
      [paymentId, chitId],
    );
  },

  /* =====================================================
     GET UPCOMING PAYMENTS
  ===================================================== */

  async findUpcoming(filters = {}) {
    const db = getDB();

    let query = `
      SELECT
        p.*,
        c.chit_no,
        c.chit_name,
        c.chit_provider,
        c.provider_mobile
      FROM personal_chit_payments p
      INNER JOIN personal_chits c
        ON c.id = p.chit_id
      WHERE p.status IN ('pending', 'partial')
        AND p.due_date >= CURDATE()
        AND c.status = 'active'
    `;

    const params = [];

    if (filters.days) {
      const days = Number(filters.days);

      if (Number.isInteger(days) && days > 0) {
        query += `
          AND p.due_date <= DATE_ADD(
            CURDATE(),
            INTERVAL ? DAY
          )
        `;

        params.push(days);
      }
    }

    query += ` ORDER BY p.due_date ASC`;

    const [rows] = await db.query(query, params);

    return rows;
  },

  /* =====================================================
     GET OVERDUE PAYMENTS
  ===================================================== */

  async findOverdue(filters = {}) {
    const db = getDB();

    let query = `
      SELECT
        p.*,
        c.chit_no,
        c.chit_name,
        c.chit_provider,
        c.provider_mobile
      FROM personal_chit_payments p
      INNER JOIN personal_chits c
        ON c.id = p.chit_id
      WHERE p.status IN ('pending', 'partial', 'overdue')
        AND p.due_date < CURDATE()
        AND p.pending_amount > 0
        AND c.status = 'active'
    `;

    const params = [];

    if (filters.chit_id) {
      query += ` AND p.chit_id = ?`;
      params.push(filters.chit_id);
    }

    query += ` ORDER BY p.due_date ASC`;

    const [rows] = await db.query(query, params);

    return rows;
  },

  /* =====================================================
     RECALCULATE CHIT TOTALS
  ===================================================== */

  async calculateChitTotals(conn, chitId) {
    const [[row]] = await conn.query(
      `SELECT
         COALESCE(SUM(paid_amount), 0) AS total_paid_amount,
         COALESCE(SUM(pending_amount), 0) AS total_pending_amount
       FROM personal_chit_payments
       WHERE chit_id = ?`,
      [chitId],
    );

    return {
      total_paid_amount: Number(row.total_paid_amount || 0),
      total_pending_amount: Number(row.total_pending_amount || 0),
    };
  },

  /* =====================================================
     UPDATE OVERDUE STATUSES
  ===================================================== */

  async markOverdue() {
    const db = getDB();

    await db.query(
      `UPDATE personal_chit_payments
       SET status = 'overdue'
       WHERE due_date < CURDATE()
       AND pending_amount > 0
       AND status IN ('pending', 'partial')`,
    );
  },

  async findLastPayment(conn, chitId) {
    const [[row]] = await conn.query(
      `
    SELECT *
    FROM personal_chit_payments
    WHERE chit_id = ?
    ORDER BY installment_no DESC, id DESC
    LIMIT 1
    FOR UPDATE
    `,
      [chitId],
    );

    return row;
  },

  async countByChit(conn, chitId) {
    const [[row]] = await conn.query(
      `
    SELECT COUNT(*) as count
    FROM personal_chit_payments
    WHERE chit_id = ?
    `,
      [chitId],
    );

    return Number(row.count);
  },
};

export default PersonalChitPaymentModel;
