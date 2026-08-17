import { getDB } from "../../config/db.js";
import { HandLoanModel } from "./handLoan.model.js";

export const HandLoanService = {
  /* =====================================================
     CREATE (Loan + Initial Transaction)
  ===================================================== */
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* =====================================================
       1. GENERATE LOAN NUMBER
    ===================================================== */
      const hand_loan_no = await HandLoanModel.generateLoanNo(conn);

      /* =====================================================
       2. CALCULATE AMOUNTS
    ===================================================== */
      const amount = Number(data.amount);

      if (!amount || amount <= 0) {
        throw { status: 400, message: "Invalid loan amount" };
      }

      const paid_amount = 0;
      const outstanding_amount = amount;

      /* =====================================================
       3. INSERT LOAN
    ===================================================== */
      const loanId = await HandLoanModel.create(conn, {
        ...data,
        hand_loan_no,
        paid_amount,
        outstanding_amount,
        status: "pending", // 🔥 NEVER trust DB/default
        created_by: user.id,
        updated_by: user.id,
      });

      /* =====================================================
       4. GENERATE TRANSACTION NUMBER
    ===================================================== */
      const transaction_no = await HandLoanModel.generateTransactionNo(conn);

      /* =====================================================
       5. CREATE INITIAL TRANSACTION
       (disbursement always)
    ===================================================== */
      await HandLoanModel.createTransaction(conn, {
        transaction_no, // 🔥 REQUIRED FIX
        hand_loan_id: loanId,
        transaction_type: "disbursement",
        amount: amount,
        transaction_date: data.given_date || new Date(),
        payment_mode: data.payment_mode || "cash",
        description: "Initial loan disbursement",
        created_by: user.id,
      });

      /* =====================================================
       6. COMMIT
    ===================================================== */
      await conn.commit();

      return {
        message: "Hand loan created successfully",
        id: loanId,
        hand_loan_no,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     GET ALL (FILTER)
  ===================================================== */
  async getAll(filters = {}) {
    const data = await HandLoanModel.findAll(filters);
    return {
      count: data.length,
      data,
    };
  },

  /* =====================================================
     GET BY ID
  ===================================================== */
  async getById(id) {
    const loan = await HandLoanModel.findById(id);

    if (!loan) {
      throw { status: 404, message: "Loan not found" };
    }

    return loan;
  },

  /* =====================================================
     UPDATE
  ===================================================== */
  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await HandLoanModel.findByIdWithConn(conn, id);

      if (!existing) {
        throw { status: 404, message: "Loan not found" };
      }

      await HandLoanModel.update(conn, id, {
        ...data,
        updated_by: user.id,
      });

      await conn.commit();

      return { message: "Loan updated" };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     UPDATE STATUS
  ===================================================== */
  async updateStatus(id, data, user) {
    const existing = await HandLoanModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Loan not found" };
    }

    await HandLoanModel.updateStatus(id, data.status, user.id);

    return { message: "Status updated" };
  },

  /* =====================================================
     ADD TRANSACTION
  ===================================================== */
  async addTransaction(loanId, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const loan = await HandLoanModel.findByIdWithConn(conn, loanId);

      if (!loan) {
        throw { status: 404, message: "Loan not found" };
      }

      const amount = Number(data.amount);

      // 🔥 Core logic (don’t screw this up)
      let paid_amount = Number(loan.paid_amount);
      let outstanding = Number(loan.outstanding_amount);

      if (loan.loan_direction === "given") {
        // company receives money
        paid_amount += amount;
        outstanding -= amount;
      } else {
        // borrowed → company pays back
        paid_amount += amount;
        outstanding -= amount;
      }

      // 🚨 Prevent overpayment
      if (outstanding < 0) {
        throw {
          status: 400,
          message: "Amount exceeds outstanding",
        };
      }

      // 📌 Insert transaction
      const transaction_no = await HandLoanModel.generateTransactionNo(conn);

      await HandLoanModel.createTransaction(conn, {
        transaction_no,
        ...data,
        transaction_date: data.transaction_date || new Date(),
        hand_loan_id: loanId,
        created_by: user.id,
      });

      // 📌 Update loan
      let status = "pending";

      if (paid_amount === 0) status = "pending";
      else if (outstanding === 0) status = "completed";
      else status = "partial";

      await HandLoanModel.updateAmounts(conn, loanId, {
        paid_amount,
        outstanding_amount: outstanding,
        status,
        updated_by: user.id,
      });

      await conn.commit();

      return {
        message: "Transaction added",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     GET TRANSACTIONS
  ===================================================== */
  async getTransactions(loanId, filters = {}) {
    const data = await HandLoanModel.findTransactions(loanId, filters);

    return {
      count: data.length,
      data,
    };
  },

  /* =====================================================
     DELETE
  ===================================================== */
  async delete(id) {
    const existing = await HandLoanModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Loan not found" };
    }

    await HandLoanModel.delete(id);

    return { message: "Loan deleted" };
  },
};
