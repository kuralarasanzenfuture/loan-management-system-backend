import { getDB } from "../../config/db.js";

const LoanInstallmentModel = {
  /* =====================================================
     CREATE ONE INSTALLMENT
  ===================================================== */

  async create(conn, data) {
    const [result] = await conn.query(
      `
      INSERT INTO loan_installments (
        loan_id,
        installment_no,
        due_date,
        principal_amount,
        penalty_amount,
        total_due,
        paid_amount,
        balance_amount,
        paid_date,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.loan_id,
        data.installment_no,
        data.due_date,
        data.principal_amount,
        data.penalty_amount || 0,
        data.total_due,
        data.paid_amount || 0,
        data.balance_amount,
        data.paid_date || null,
        data.status || "pending",
      ],
    );

    return result.insertId;
  },

  /* =====================================================
     CREATE MANY INSTALLMENTS
  ===================================================== */

  async createMany(conn, installments) {
    if (!installments.length) {
      return;
    }

    const values = installments.map((item) => [
      item.loan_id,
      item.installment_no,
      item.due_date,
      item.principal_amount,
      item.penalty_amount || 0,
      item.total_due,
      item.paid_amount || 0,
      item.balance_amount,
      item.paid_date || null,
      item.status || "pending",
    ]);

    await conn.query(
      `
      INSERT INTO loan_installments (
        loan_id,
        installment_no,
        due_date,
        principal_amount,
        penalty_amount,
        total_due,
        paid_amount,
        balance_amount,
        paid_date,
        status
      )
      VALUES ?
      `,
      [values],
    );
  },

  /* =====================================================
     GET BY ID
  ===================================================== */

  async findById(conn, id) {
    if (id === undefined) {
      id = conn;
      conn = null;
    }
    const db = conn || getDB();

    const [[row]] = await db.query(
      `
      SELECT
        li.*
      FROM loan_installments li
      WHERE li.id = ?
      `,
      [id],
    );

    return row;
  },

  /* =====================================================
     GET ALL BY LOAN
  ===================================================== */

  async findByLoanId(conn, loanId) {
    if (loanId === undefined) {
      loanId = conn;
      conn = null;
    }
    const db = conn || getDB();

    const [rows] = await db.query(
      `
      SELECT
        li.*
      FROM loan_installments li
      WHERE li.loan_id = ?
      ORDER BY li.installment_no ASC
      `,
      [loanId],
    );

    return rows;
  },

  /* =====================================================
     CHECK PAYMENTS
  ===================================================== */

  async hasPayments(conn, loanId) {
    const [[row]] = await conn.query(
      `
      SELECT COUNT(*) AS count
      FROM loan_installments
      WHERE loan_id = ?
        AND paid_amount > 0
      `,
      [loanId],
    );

    return Number(row.count) > 0;
  },

  /* =====================================================
     DELETE ALL INSTALLMENTS
  ===================================================== */

  async deleteByLoanId(conn, loanId) {
    await conn.query(
      `
      DELETE FROM loan_installments
      WHERE loan_id = ?
      `,
      [loanId],
    );
  },

  /* =====================================================
     UPDATE
  ===================================================== */

  async update(conn, id, data) {
    const fields = [];
    const values = [];

    if (data.penalty_amount !== undefined) {
      fields.push("penalty_amount = ?");
      values.push(data.penalty_amount);
    }

    if (data.total_due !== undefined) {
      fields.push("total_due = ?");
      values.push(data.total_due);
    }

    if (data.paid_amount !== undefined) {
      fields.push("paid_amount = ?");
      values.push(data.paid_amount);
    }

    if (data.balance_amount !== undefined) {
      fields.push("balance_amount = ?");
      values.push(data.balance_amount);
    }

    if (data.paid_date !== undefined) {
      fields.push("paid_date = ?");
      values.push(data.paid_date);
    }

    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }

    if (!fields.length) {
      return false;
    }

    values.push(id);

    const [result] = await conn.query(
      `
      UPDATE loan_installments
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values,
    );

    return result.affectedRows > 0;
  },

  async findTodayCollections(date) {
    const db = getDB();

    const [rows] = await db.query(
      `
    SELECT 
      li.id,
      li.loan_id,
      li.installment_no,
      li.due_date,
      li.paid_amount,
      li.paid_date,
      li.status,

      c.id AS customer_id,
      c.first_name,
      c.last_name,
      c.mobile

    FROM loan_installments li
    JOIN loans l ON l.id = li.loan_id
    JOIN customers c ON c.id = l.customer_id

    WHERE DATE(li.paid_date) = ?
      AND li.status IN ('paid', 'partial')

    ORDER BY li.paid_date DESC
    `,
      [date],
    );

    return rows;
  },
  async findOverdueInstallmentsGlobal(filters = {}) {
    const db = getDB();

    let query = `
    SELECT 
      li.id,
      li.loan_id,
      li.installment_no,
      li.due_date,
      li.principal_amount,
      li.balance_amount,
      li.status,

      c.id AS customer_id,
      c.first_name,
      c.last_name,
      c.mobile,

      lp.id AS loan_plan_id,
      lpp.grace_days,
      lpp.penalty_type,
      lpp.penalty_value,
      lpp.max_penalty,

      -- 🔥 Days overdue
      GREATEST(DATEDIFF(CURDATE(), li.due_date), 0) AS days_overdue,

      -- 🔥 Effective overdue after grace
      GREATEST(DATEDIFF(CURDATE(), li.due_date) - IFNULL(lpp.grace_days, 0), 0) AS chargeable_days,

      -- 🔥 Daily penalty calculation
      CASE 
        WHEN lpp.id IS NULL THEN 0

        WHEN GREATEST(DATEDIFF(CURDATE(), li.due_date) - IFNULL(lpp.grace_days, 0), 0) <= 0 
        THEN 0

        WHEN lpp.penalty_type = 'fixed' 
        THEN 
          LEAST(
            (GREATEST(DATEDIFF(CURDATE(), li.due_date) - IFNULL(lpp.grace_days, 0), 0) * lpp.penalty_value),
            IFNULL(lpp.max_penalty, 999999999)
          )

        WHEN lpp.penalty_type = 'percentage' 
        THEN 
          LEAST(
            (
              (li.principal_amount * lpp.penalty_value / 100)
              * GREATEST(DATEDIFF(CURDATE(), li.due_date) - IFNULL(lpp.grace_days, 0), 0)
            ),
            IFNULL(lpp.max_penalty, 999999999)
          )

        ELSE 0
      END AS penalty_amount

    FROM loan_installments li
    JOIN loans l ON l.id = li.loan_id
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN loan_plans lp ON lp.id = l.loan_plan_id
    LEFT JOIN loan_plan_penalties lpp 
      ON lpp.loan_plan_id = lp.id AND lpp.status = 'active'

    WHERE li.status IN ('pending', 'partial')
      AND li.due_date < CURDATE()
  `;

    const params = [];

    // 🔍 Filters
    if (filters.customer_id) {
      query += ` AND c.id = ?`;
      params.push(filters.customer_id);
    }

    if (filters.loan_id) {
      query += ` AND li.loan_id = ?`;
      params.push(filters.loan_id);
    }

    if (filters.from_date) {
      query += ` AND li.due_date >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND li.due_date <= ?`;
      params.push(filters.to_date);
    }

    query += ` ORDER BY li.due_date ASC`;

    const [rows] = await db.query(query, params);

    return rows;
  },
};

export default LoanInstallmentModel;
