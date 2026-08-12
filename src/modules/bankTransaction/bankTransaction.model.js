import { getDB } from "../../config/db.js";

const BankTransactionModel = {
  async getLastTransactionNo(conn, year) {
    const [[row]] = await conn.query(
      `SELECT transaction_no
       FROM bank_transactions
       WHERE transaction_no LIKE ?
       ORDER BY id DESC
       LIMIT 1 FOR UPDATE`,
      [`BT-${year}-%`],
    );

    return row?.transaction_no || null;
  },

  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO bank_transactions (
        company_bank_id,
        transaction_no,
        transaction_date,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        reference_type,
        reference_id,
        payment_method,
        transaction_reference,
        cheque_number,
        description,
        remarks,
        created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.company_bank_id,
        data.transaction_no,
        data.transaction_date,
        data.transaction_type,
        data.amount,
        data.balance_before,
        data.balance_after,
        data.reference_type,
        data.reference_id ?? null,
        data.payment_method ?? null,
        data.transaction_reference ?? null,
        data.cheque_number ?? null,
        data.description ?? null,
        data.remarks ?? null,
        data.created_by,
      ],
    );

    return result.insertId;
  },

  async markAsReversed(conn, id, reversalId) {
    await conn.query(
      `UPDATE bank_transactions
       SET status = 'reversed', reversal_id = ?
       WHERE id = ?`,
      [reversalId, id],
    );
  },

  async getAll(filters) {
    const db = getDB();

    let query = `SELECT * FROM bank_transactions WHERE 1=1`;
    const params = [];

    if (filters.company_bank_id) {
      query += ` AND company_bank_id = ?`;
      params.push(filters.company_bank_id);
    }

    if (filters.transaction_type) {
      query += ` AND transaction_type = ?`;
      params.push(filters.transaction_type);
    }

    if (filters.reference_type) {
      query += ` AND reference_type = ?`;
      params.push(filters.reference_type);
    }

    if (filters.date_from) {
      query += ` AND DATE(transaction_date) >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND DATE(transaction_date) <= ?`;
      params.push(filters.date_to);
    }

    query += ` ORDER BY id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const db = getDB();
    const [[row]] = await db.query(
      `SELECT * FROM bank_transactions WHERE id=?`,
      [id],
    );
    return row;
  },

  async findByNumber(no) {
    const db = getDB();
    const [[row]] = await db.query(
      `SELECT * FROM bank_transactions WHERE transaction_no=?`,
      [no],
    );
    return row;
  },
};

export default BankTransactionModel;
