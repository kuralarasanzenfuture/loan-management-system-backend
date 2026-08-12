import { getDB } from "../../config/db.js";
import BankTransactionModel from "./bankTransaction.model.js";

const BankTransactionService = {
  /**
   * Create a bank transaction within a provided connection (for nested use)
   * or standalone (opens its own connection).
   */
  async _createInConnection(conn, data, user) {
    /* 🔒 LOCK BANK */
    const [[bank]] = await conn.query(
      `SELECT current_balance 
       FROM company_banks 
       WHERE id=? FOR UPDATE`,
      [data.company_bank_id],
    );

    if (!bank) {
      throw { status: 404, message: "Bank account not found" };
    }

    const balance_before = Number(bank.current_balance);
    let balance_after;

    if (data.transaction_type === "credit") {
      balance_after = balance_before + Number(data.amount);
    } else {
      if (balance_before < Number(data.amount)) {
        throw { status: 400, message: "Insufficient balance for this debit transaction" };
      }
      balance_after = balance_before - Number(data.amount);
    }

    /* 🔥 GENERATE TRANSACTION NO */
    const year = new Date().getFullYear();
    const lastNo = await BankTransactionModel.getLastTransactionNo(conn, year);
    let next = 1;
    if (lastNo) {
      next = Number(lastNo.split("-")[2]) + 1;
    }
    const transaction_no = `BT-${year}-${String(next).padStart(6, "0")}`;

    /* 💾 INSERT TRANSACTION */
    const id = await BankTransactionModel.create(conn, {
      ...data,
      transaction_no,
      balance_before,
      balance_after,
      created_by: user.id,
    });

    /* 🔄 UPDATE BANK BALANCE */
    await conn.query(
      `UPDATE company_banks 
       SET current_balance=? 
       WHERE id=?`,
      [balance_after, data.company_bank_id],
    );

    return { id, transaction_no };
  },

  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const result = await this._createInConnection(conn, data, user);

      await conn.commit();

      return {
        message: "Transaction created successfully",
        ...result,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll(query) {
    const data = await BankTransactionModel.getAll(query);
    return { data };
  },

  async getById(id) {
    const row = await BankTransactionModel.findById(id);
    if (!row) throw { status: 404, message: "Transaction not found" };
    return row;
  },

  async getByNumber(no) {
    const row = await BankTransactionModel.findByNumber(no);
    if (!row) throw { status: 404, message: "Transaction not found" };
    return row;
  },

  async summary(bank_id) {
    const db = getDB();

    const [[row]] = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN transaction_type='credit' THEN amount ELSE 0 END), 0) AS total_credit,
        COALESCE(SUM(CASE WHEN transaction_type='debit' THEN amount ELSE 0 END), 0) AS total_debit
       FROM bank_transactions
       WHERE company_bank_id=?`,
      [bank_id],
    );

    // Get current balance from company_banks as closing_balance
    const [[bankRow]] = await db.query(
      `SELECT current_balance FROM company_banks WHERE id=?`,
      [bank_id],
    );

    return {
      total_credit: Number(row.total_credit),
      total_debit: Number(row.total_debit),
      closing_balance: bankRow ? Number(bankRow.current_balance) : 0,
    };
  },

  async reverse(id, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* 1. Find the original transaction */
      const tx = await BankTransactionModel.findById(id);
      if (!tx) throw { status: 404, message: "Transaction not found" };
      if (tx.status === "reversed") {
        throw { status: 400, message: "This transaction has already been reversed" };
      }

      /* 2. Create a reversing entry using the shared helper (same conn) */
      const reverseType = tx.transaction_type === "credit" ? "debit" : "credit";

      const { id: reversalId, transaction_no: reversal_no } = await this._createInConnection(
        conn,
        {
          company_bank_id: tx.company_bank_id,
          transaction_date: new Date(),
          transaction_type: reverseType,
          amount: tx.amount,
          reference_type: "other",
          reference_id: null,
          payment_method: null,
          transaction_reference: null,
          cheque_number: null,
          description: `Reversal of ${tx.transaction_no}`,
          remarks: null,
        },
        user,
      );

      /* 3. Mark original as reversed */
      await BankTransactionModel.markAsReversed(conn, id, reversalId);

      await conn.commit();

      return {
        message: "Transaction reversed successfully",
        reversal_id: reversalId,
        reversal_transaction_no: reversal_no,
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};

export default BankTransactionService;
