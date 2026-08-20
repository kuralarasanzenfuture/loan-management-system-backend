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
};

export default LoanInstallmentModel;
