import { getDB } from "../../config/db.js";
import { getImageUrl } from "../../utils/imageUrl.js";

const getDateRange = (filters = {}) => ({
  from: filters.from_date || filters.from,
  to: filters.to_date || filters.to,
});

const addDateFilters = (query, params, column, filters = {}) => {
  const { from, to } = getDateRange(filters);

  if (from) {
    query += ` AND ${column} >= ?`;
    params.push(from);
  }

  if (to) {
    query += ` AND ${column} <= ?`;
    params.push(to);
  }

  return query;
};

export const LoanModel = {
  /* ==========================================================
      GENERATE LOAN NUMBER
      LN-000001
  ========================================================== */

  async generateLoanNo(conn) {
    const [[row]] = await conn.query(
      `SELECT id
       FROM loans
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
    );

    const next = row ? row.id + 1 : 1;

    return `LN-${String(next).padStart(6, "0")}`;
  },

  /* ==========================================================
      CUSTOMER
  ========================================================== */

  async findCustomerById(conn, customerId) {
    const [[customer]] = await conn.query(
      `
      SELECT
          id,
          customer_no,
          first_name,
          last_name,
          mobile,
          status
      FROM customers
      WHERE id=?
      `,
      [customerId],
    );

    return customer;
  },

  /* ==========================================================
      LOAN PLAN
  ========================================================== */

  async findLoanPlanById(conn, loanPlanId) {
    const [[plan]] = await conn.query(
      `
      SELECT
          lp.id,
          lp.plan_name,
          lp.plan_code,
          lp.collection_frequency,
          lp.tenure,
          lp.tenure_type,
          lp.commission_type,
          lp.commission_value,

          pp.grace_days,
          pp.penalty_type,
          pp.penalty_value,
          pp.max_penalty

      FROM loan_plans lp

      LEFT JOIN loan_plan_penalties pp
             ON lp.id = pp.loan_plan_id

      WHERE lp.id=?
      `,
      [loanPlanId],
    );

    return plan;
  },

  /* ==========================================================
      CREATE
  ========================================================== */

  async create(conn, data) {
    const [result] = await conn.query(
      `
    INSERT INTO loans (
      loan_no,
      customer_id,
      loan_plan_id,
      loan_amount,
      commission_amount,
      net_disbursed_amount,
      installment_amount,
      total_repayment,
      start_date,
      end_date,
      created_by,
      updated_by,
      status
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    `,
      [
        data.loan_no,
        data.customer_id,
        data.loan_plan_id,
        data.loan_amount,
        data.commission_amount,
        data.net_disbursed_amount,
        data.installment_amount,
        data.total_repayment,
        data.start_date,
        data.end_date,
        data.created_by,
        data.updated_by,
        data.status,
      ],
    );

    return result.insertId;
  },

  /* ==========================================================
      UPDATE
  ========================================================== */

  async update(conn, id, data) {
    const [result] = await conn.query(
      `
      UPDATE loans
      SET

        customer_id=?,
        loan_plan_id=?,

        loan_amount=?,
        commission_amount=?,
        net_disbursed_amount=?,
        installment_amount=?,
        total_repayment=?,

        start_date=?,
        end_date=?,

        updated_by=?,
        status=?

      WHERE id=?
      `,
      [
        data.customer_id,
        data.loan_plan_id,

        data.loan_amount,
        data.commission_amount,
        data.net_disbursed_amount,
        data.installment_amount,
        data.total_repayment,

        data.start_date,
        data.end_date,

        data.updated_by,
        data.status,

        id,
      ],
    );

    return result.affectedRows;
  },

  /* ==========================================================
      GET ALL
  ========================================================== */

  async findAll(conn, query = {}) {
    const { status, customer_id, loan_plan_id, page = 1, limit = 10 } = query;

    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push("l.status = ?");
      params.push(status);
    }

    if (customer_id) {
      whereClauses.push("l.customer_id = ?");
      params.push(customer_id);
    }

    if (loan_plan_id) {
      whereClauses.push("l.loan_plan_id = ?");
      params.push(loan_plan_id);
    }

    const whereSQL = whereClauses.length
      ? "WHERE " + whereClauses.join(" AND ")
      : "";

    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await conn.query(
      `
        SELECT

            l.*,

            c.customer_no,
            CONCAT(c.first_name,' ',IFNULL(c.last_name,'')) customer_name,
            c.mobile,
            c.photo,

            lp.plan_name,
            lp.plan_code,
            lp.collection_frequency,
            lp.tenure

        FROM loans l

        INNER JOIN customers c
                ON c.id=l.customer_id

        INNER JOIN loan_plans lp
                ON lp.id=l.loan_plan_id

        ${whereSQL}

        ORDER BY l.id DESC

        LIMIT ? OFFSET ?
    `,
      [...params, Number(limit), offset],
    );

    // return rows;
    return rows.map((row) => ({
      ...row,
      photo: getImageUrl(row.photo),
    }));
  },

  /* ==========================================================
      GET BY ID
  ========================================================== */

  async findById(conn, id) {
    const [[row]] = await conn.query(
      `
        SELECT

            l.*,

            c.customer_no,
            CONCAT(c.first_name,' ',IFNULL(c.last_name,'')) customer_name,
            c.mobile,
            c.photo,

            lp.plan_name,
            lp.plan_code,
            lp.collection_frequency,
            lp.tenure,
            lp.tenure_type,
            lp.commission_type,
            lp.commission_value

        FROM loans l

        INNER JOIN customers c
                ON c.id=l.customer_id

        INNER JOIN loan_plans lp
                ON lp.id=l.loan_plan_id

        WHERE l.id=?
      `,
      [id],
    );

    // return row;
    return {
      ...row,
      photo: getImageUrl(row.photo),
    };
  },

  /* ==========================================================
      UPDATE STATUS
  ========================================================== */

  async updateStatus(conn, id, status, updatedBy) {
    const [result] = await conn.query(
      `
      UPDATE loans
      SET
          status=?,
          updated_by=?
      WHERE id=?
      `,
      [status, updatedBy, id],
    );

    return result.affectedRows;
  },

  /* ==========================================================
      DELETE
  ========================================================== */

  async delete(conn, id) {
    const [result] = await conn.query(
      `
      DELETE FROM loans
      WHERE id=?
      `,
      [id],
    );

    return result.affectedRows;
  },

  async getLoanSummary(filters = {}) {
    const db = getDB();

    let query = `
    SELECT
      COUNT(*) AS total_loans,
      SUM(loan_amount) AS total_disbursed,
      SUM(total_repayment) AS total_expected,
      SUM(
        (SELECT COALESCE(SUM(paid_amount),0)
         FROM loan_installments li
         WHERE li.loan_id = l.id)
      ) AS total_collected,
      SUM(
        (SELECT COALESCE(SUM(balance_amount),0)
         FROM loan_installments li
         WHERE li.loan_id = l.id)
      ) AS total_outstanding
    FROM loans l
    WHERE 1=1
  `;
    const params = [];
    query = addDateFilters(query, params, "l.start_date", filters);

    const [rows] = await db.query(query, params);
    return rows[0];
  },
  async getStatusBreakdown(filters = {}) {
    const db = getDB();

    let query = `
    SELECT 
      status,
      COUNT(*) AS count,
      SUM(loan_amount) AS amount
    FROM loans
    WHERE 1=1
  `;
    const params = [];
    query = addDateFilters(query, params, "start_date", filters);
    query += " GROUP BY status";

    const [rows] = await db.query(query, params);

    return rows;
  },

  async getCollectionTrend(filters = {}) {
    const db = getDB();

    let query = `
    SELECT 
      DATE(paid_date) AS date,
      SUM(paid_amount) AS amount
    FROM loan_installments
    WHERE paid_date IS NOT NULL
  `;
    const params = [];
    query = addDateFilters(query, params, "paid_date", filters);
    query += " GROUP BY DATE(paid_date) ORDER BY date ASC";

    const [rows] = await db.query(query, params);

    return rows;
  },
  async getInstallmentsReport(filters = {}) {
    const db = getDB();

    let query = `
    SELECT
      li.id,
      li.loan_id,
      li.installment_no,
      li.due_date,
      li.paid_date,
      li.total_due,
      li.paid_amount,
      li.balance_amount,
      li.status,

      l.loan_no,
      c.first_name,
      c.last_name,
      c.mobile

    FROM loan_installments li
    JOIN loans l ON l.id = li.loan_id
    JOIN customers c ON c.id = l.customer_id

    WHERE 1=1
  `;

    const params = [];

    if (filters.status) {
      query += ` AND li.status = ?`;
      params.push(filters.status);
    }

    if (filters.from_date) {
      query += ` AND li.due_date >= ?`;
      params.push(filters.from_date);
    } else if (filters.from) {
      query += ` AND li.due_date >= ?`;
      params.push(filters.from);
    }

    if (filters.to_date) {
      query += ` AND li.due_date <= ?`;
      params.push(filters.to_date);
    } else if (filters.to) {
      query += ` AND li.due_date <= ?`;
      params.push(filters.to);
    }

    query += ` ORDER BY li.due_date ASC`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  async getCustomerSummary(filters = {}) {
    const db = getDB();

    let loanQuery = `
      SELECT
        l.customer_id,
        COUNT(*) AS total_loans,
        COALESCE(SUM(l.loan_amount), 0) AS total_loan
      FROM loans l
      WHERE 1=1
    `;
    const loanParams = [];
    loanQuery = addDateFilters(loanQuery, loanParams, "l.start_date", filters);
    loanQuery += " GROUP BY l.customer_id";

    let installmentQuery = `
      SELECT
        l.customer_id,
        COALESCE(SUM(li.paid_amount), 0) AS total_paid,
        COALESCE(SUM(li.balance_amount), 0) AS total_pending
      FROM loans l
      JOIN loan_installments li ON li.loan_id = l.id
      WHERE 1=1
    `;
    const installmentParams = [];
    installmentQuery = addDateFilters(
      installmentQuery,
      installmentParams,
      "li.due_date",
      filters,
    );
    installmentQuery += " GROUP BY l.customer_id";

    const [rows] = await db.query(`
    SELECT
      c.id,
      c.first_name,
      c.last_name,
      c.mobile,
      COALESCE(ls.total_loans, 0) AS total_loans,
      COALESCE(ls.total_loan, 0) AS total_loan,
      COALESCE(isummary.total_paid, 0) AS total_paid,
      COALESCE(isummary.total_pending, 0) AS total_pending
    FROM customers c
    LEFT JOIN (${loanQuery}) ls ON ls.customer_id = c.id
    LEFT JOIN (${installmentQuery}) isummary ON isummary.customer_id = c.id
    ORDER BY total_pending DESC
  `, [...loanParams, ...installmentParams]);

    return rows;
  },

  
};
