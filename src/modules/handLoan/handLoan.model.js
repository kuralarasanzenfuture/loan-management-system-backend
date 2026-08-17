import { getDB } from "../../config/db.js";

/* =====================================================
   HAND LOAN MODEL
===================================================== */

export const HandLoanModel = {
  /* =====================================================
     GENERATE LOAN NUMBER
  ===================================================== */

  async generateLoanNo(conn) {
    const [[result]] = await conn.query(
      `SELECT COUNT(*) AS total FROM hand_loans`,
    );
    const seq = Number(result.total) + 1;
    return `HL-${String(seq).padStart(5, "0")}`;
  },

  /* =====================================================
     GENERATE TRANSACTION NUMBER
  ===================================================== */

  async generateTransactionNo(conn) {
    const [[result]] = await conn.query(
      `SELECT COUNT(*) AS total FROM hand_loan_transactions`,
    );
    const seq = Number(result.total) + 1;
    return `HTN-${String(seq).padStart(5, "0")}`;
  },

  /* =====================================================
     CREATE LOAN
  ===================================================== */

  async create(conn, data) {
    const {
      hand_loan_no,
      loan_direction,
      customer_id,
      person_name,
      mobile,
      address,
      amount,
      paid_amount,
      outstanding_amount,
      given_date,
      expected_return_date,
      status,
      payment_mode,
      purpose,
      remarks,
      created_by,
      updated_by,
    } = data;

    const [result] = await conn.query(
      `
      INSERT INTO hand_loans (
        hand_loan_no,
        loan_direction,
        customer_id,
        person_name,
        mobile,
        address,
        amount,
        paid_amount,
        outstanding_amount,
        given_date,
        expected_return_date,
        status,
        payment_mode,
        purpose,
        remarks,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        hand_loan_no,
        loan_direction,
        customer_id,
        person_name,
        mobile,
        address,
        amount,
        paid_amount,
        outstanding_amount,
        given_date,
        expected_return_date,
        status ?? "pending",
        payment_mode,
        purpose,
        remarks,
        created_by,
        updated_by,
      ],
    );

    return result.insertId;
  },

  /* =====================================================
     FIND ALL
  ===================================================== */

  async findAll(filters = {}) {
    const db = getDB();

    let query = `
    SELECT
      hl.*,
      CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name
    FROM hand_loans hl
    LEFT JOIN customers c
      ON c.id = hl.customer_id
    WHERE 1=1
    `;

    const params = [];

    if (filters.loan_direction) {
      query += ` AND hl.loan_direction = ?`;
      params.push(filters.loan_direction);
    }

    if (filters.status) {
      query += ` AND hl.status = ?`;
      params.push(filters.status);
    }

    if (filters.customer_id) {
      query += ` AND hl.customer_id = ?`;
      params.push(filters.customer_id);
    }

    if (filters.payment_mode) {
      query += ` AND hl.payment_mode = ?`;
      params.push(filters.payment_mode);
    }

    if (filters.search) {
      query += `
        AND (
          hl.hand_loan_no LIKE ?
          OR hl.person_name LIKE ?
          OR hl.mobile LIKE ?
          OR hl.purpose LIKE ?
        )
      `;

      const search = `%${filters.search}%`;
      params.push(search, search, search, search);
    }

    if (filters.from_date) {
      query += ` AND hl.given_date >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND hl.given_date <= ?`;
      params.push(filters.to_date);
    }

    if (filters.return_from_date) {
      query += `
        AND hl.expected_return_date >= ?
      `;
      params.push(filters.return_from_date);
    }

    if (filters.return_to_date) {
      query += `
        AND hl.expected_return_date <= ?
      `;
      params.push(filters.return_to_date);
    }

    query += ` ORDER BY hl.id DESC`;

    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    return rows;
  },
  /* =====================================================
     COUNT
  ===================================================== */

  async count(filters = {}) {
    const db = getDB();

    let query = `
    SELECT COUNT(*) AS total
    FROM hand_loans hl
    WHERE 1=1
    `;

    const params = [];

    if (filters.loan_direction) {
      query += ` AND hl.loan_direction = ?`;
      params.push(filters.loan_direction);
    }

    if (filters.status) {
      query += ` AND hl.status = ?`;
      params.push(filters.status);
    }

    if (filters.customer_id) {
      query += ` AND hl.customer_id = ?`;
      params.push(filters.customer_id);
    }

    if (filters.payment_mode) {
      query += ` AND hl.payment_mode = ?`;
      params.push(filters.payment_mode);
    }

    if (filters.search) {
      query += `
        AND (
          hl.hand_loan_no LIKE ?
          OR hl.person_name LIKE ?
          OR hl.mobile LIKE ?
          OR hl.purpose LIKE ?
        )
      `;
      const search = `%${filters.search}%`;
      params.push(search, search, search, search);
    }

    if (filters.from_date) {
      query += ` AND hl.given_date >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND hl.given_date <= ?`;
      params.push(filters.to_date);
    }

    if (filters.return_from_date) {
      query += `
        AND hl.expected_return_date >= ?
      `;
      params.push(filters.return_from_date);
    }

    if (filters.return_to_date) {
      query += `
        AND hl.expected_return_date <= ?
      `;
      params.push(filters.return_to_date);
    }

    const [[result]] = await db.query(query, params);

    return Number(result.total);
  },

  /* =====================================================
     FIND BY ID
  ===================================================== */

  async findById(id) {
    const db = getDB();

    const [[row]] = await db.query(
      `
      SELECT
        hl.*,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name
      FROM hand_loans hl
      LEFT JOIN customers c
        ON c.id = hl.customer_id
      WHERE hl.id = ?
      LIMIT 1
      `,
      [id],
    );

    return row || null;
  },

  /* =====================================================
     FIND BY ID WITH CONNECTION (for transactions with FOR UPDATE)
  ===================================================== */

  async findByIdWithConn(conn, id) {
    const [[row]] = await conn.query(
      `
      SELECT *
      FROM hand_loans
      WHERE id = ?
      FOR UPDATE
      `,
      [id],
    );

    return row || null;
  },
  /* =====================================================
     FIND BY ID FOR UPDATE (alias)
  ===================================================== */

  async findByIdForUpdate(conn, id) {
    return this.findByIdWithConn(conn, id);
  },

  /* =====================================================
     UPDATE
  ===================================================== */

  async update(conn, id, data) {
    const fields = [];
    const params = [];

    const allowedFields = [
      "loan_direction",
      "customer_id",
      "person_name",
      "mobile",
      "address",
      "amount",
      "outstanding_amount",
      "given_date",
      "expected_return_date",
      "payment_mode",
      "purpose",
      "remarks",
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (data.updated_by !== undefined) {
      fields.push(`updated_by = ?`);
      params.push(data.updated_by);
    }

    if (!fields.length) {
      return false;
    }

    params.push(id);

    const [result] = await conn.query(
      `
      UPDATE hand_loans
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      params,
    );
    return result.affectedRows > 0;
  },

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  async updateStatus(id, status, updatedBy) {
    const db = getDB();
    const [result] = await db.query(
      `
      UPDATE hand_loans
      SET
        status = ?,
        updated_by = ?,
        completed_date =
          CASE
            WHEN ? = 'completed'
              THEN COALESCE(completed_date, CURDATE())
            ELSE completed_date
          END
      WHERE id = ?
      `,
      [status, updatedBy, status, id],
    );

    return result.affectedRows > 0;
  },

  /* =====================================================
     UPDATE AMOUNTS (paid, outstanding, status)
  ===================================================== */

  async updateAmounts(
    conn,
    id,
    { paid_amount, outstanding_amount, status, updated_by },
  ) {
    const [result] = await conn.query(
      `
      UPDATE hand_loans
      SET
        paid_amount = ?,
        outstanding_amount = ?,
        status = ?,
        updated_by = ?,
        completed_date =
          CASE
            WHEN ? = 'completed'
              THEN COALESCE(completed_date, CURDATE())
            ELSE completed_date
          END
      WHERE id = ?
      `,
      [paid_amount, outstanding_amount, status, updated_by, status, id],
    );

    return result.affectedRows > 0;
  },

  /* =====================================================
     DELETE
  ===================================================== */

  async delete(id) {
    const db = getDB();
    const [result] = await db.query(
      `
      DELETE FROM hand_loans
      WHERE id = ?
      `,
      [id],
    );

    return result.affectedRows > 0;
  },

  /* =====================================================
     ACTIVE TRANSACTION COUNT
  ===================================================== */

  async countActiveTransactions(conn, loanId) {
    const [[result]] = await conn.query(
      `
      SELECT COUNT(*) AS total
      FROM hand_loan_transactions
      WHERE hand_loan_id = ?
        AND status = 'active'
      `,
      [loanId],
    );

    return Number(result.total);
  },

  /* =====================================================
     CREATE TRANSACTION
  ===================================================== */

  async createTransaction(conn, data) {
    const {
      transaction_no,
      hand_loan_id,
      transaction_type,
      amount,
      transaction_date,
      payment_mode,
      company_bank_id,
      transaction_reference,
      cheque_number,
      description,
      remarks,
      received_by,
      created_by,
    } = data;

    const [result] = await conn.query(
      `
      INSERT INTO hand_loan_transactions (
        transaction_no,
        hand_loan_id,
        transaction_type,
        amount,
        transaction_date,
        payment_mode,
        company_bank_id,
        transaction_reference,
        cheque_number,
        description,
        remarks,
        received_by,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        transaction_no,
        hand_loan_id,
        transaction_type,
        amount,
        transaction_date,
        payment_mode,
        company_bank_id,
        transaction_reference,
        cheque_number,
        description,
        remarks,
        received_by,
        created_by,
      ],
    );

    return result.insertId;
  },

  /* =====================================================
     TRANSACTIONS
  ===================================================== */

  // Alias used by service
  async findTransactions(loanId, filters = {}) {
    return this.findTransactionsByLoan(loanId, filters);
  },

  async findTransactionsByLoan(loanId, filters = {}) {
    const db = getDB();

    let query = `
    SELECT
      hlt.*,
      cb.bank_name,
      u.username AS created_by_name
    FROM hand_loan_transactions hlt
    LEFT JOIN company_banks cb
      ON cb.id = hlt.company_bank_id
    LEFT JOIN users u
      ON u.id = hlt.created_by
    WHERE hlt.hand_loan_id = ?
    `;

    const params = [loanId];

    if (filters.transaction_type) {
      query += `
        AND hlt.transaction_type = ?
      `;
      params.push(filters.transaction_type);
    }

    if (filters.status) {
      query += `
        AND hlt.status = ?
      `;
      params.push(filters.status);
    }

    if (filters.payment_mode) {
      query += `
        AND hlt.payment_mode = ?
      `;
      params.push(filters.payment_mode);
    }

    if (filters.from_date) {
      query += `
        AND hlt.transaction_date >= ?
      `;
      params.push(`${filters.from_date} 00:00:00`);
    }

    if (filters.to_date) {
      query += `
        AND hlt.transaction_date <= ?
      `;
      params.push(`${filters.to_date} 23:59:59`);
    }

    query += `
    ORDER BY hlt.transaction_date DESC, hlt.id DESC
    `;

    const [rows] = await db.query(query, params);

    return rows;
  },
};

