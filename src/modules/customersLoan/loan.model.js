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
const addDateFilter = (column, filters, params) => {
  let sql = "";

  if (filters.from) {
    sql += ` AND ${column} >= ?`;
    params.push(filters.from);
  }

  if (filters.to) {
    sql += ` AND ${column} <= ?`;
    params.push(filters.to);
  }

  return sql;
};

const year = new Date().getFullYear();

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

    return `LN-${year}-${String(next).padStart(6, "0")}`;
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

  async getCustomerReports(filters = {}) {
    const db = getDB();

    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 10);
    const offset = (page - 1) * limit;

    /* =========================================
       LOAN SUBQUERY
    ========================================= */
    let loanParams = [];
    let loanFilter = "WHERE 1=1";

    if (filters.status) {
      loanFilter += " AND status = ?";
      loanParams.push(filters.status);
    }

    loanFilter += addDateFilter("start_date", filters, loanParams);

    /* =========================================
       PAYMENT SUBQUERY
    ========================================= */
    let paymentParams = [];
    let paymentFilter = "WHERE 1=1";

    if (filters.status) {
      paymentFilter += " AND l.status = ?";
      paymentParams.push(filters.status);
    }

    paymentFilter += addDateFilter("li.paid_date", filters, paymentParams);

    /* =========================================
       MAIN QUERY
    ========================================= */
    const [data] = await db.query(
      `
      SELECT
        c.id AS customer_id,
        CONCAT(c.first_name, ' ', c.last_name) AS name,
        c.mobile,

        COALESCE(l.total_loans, 0) AS total_loans,
        COALESCE(l.total_amount, 0) AS total_amount,
        COALESCE(l.total_repayment, 0) AS total_repayment,
        COALESCE(p.total_paid, 0) AS total_paid,

        COALESCE(l.total_repayment, 0) - COALESCE(p.total_paid, 0) AS total_pending

      FROM customers c

      LEFT JOIN (
        SELECT
          customer_id,
          COUNT(*) AS total_loans,
          SUM(loan_amount) AS total_amount,
          SUM(total_repayment) AS total_repayment
        FROM loans
        ${loanFilter}
        GROUP BY customer_id
      ) l ON l.customer_id = c.id

      LEFT JOIN (
        SELECT
          l.customer_id,
          SUM(li.paid_amount) AS total_paid
        FROM loans l
        JOIN loan_installments li ON li.loan_id = l.id
        ${paymentFilter}
        GROUP BY l.customer_id
      ) p ON p.customer_id = c.id

      ORDER BY total_pending DESC
      LIMIT ? OFFSET ?
      `,
      [...loanParams, ...paymentParams, limit, offset],
    );

    /* =========================================
       COUNT (for pagination)
    ========================================= */
    const [[countRow]] = await db.query(`
      SELECT COUNT(*) as total FROM customers
    `);

    /* =========================================
       SUMMARY
    ========================================= */
    const [summaryRows] = await db.query(
      `
      SELECT
        COUNT(DISTINCT c.id) AS total_customers,
        COALESCE(SUM(l.total_loans), 0) AS total_loans,
        COALESCE(SUM(l.total_amount), 0) AS total_amount,
        COALESCE(SUM(p.total_paid), 0) AS total_paid,
        COALESCE(SUM(l.total_repayment), 0) - COALESCE(SUM(p.total_paid), 0) AS total_pending

      FROM customers c

      LEFT JOIN (
        SELECT
          customer_id,
          COUNT(*) AS total_loans,
          SUM(loan_amount) AS total_amount,
          SUM(total_repayment) AS total_repayment
        FROM loans
        ${loanFilter}
        GROUP BY customer_id
      ) l ON l.customer_id = c.id

      LEFT JOIN (
        SELECT
          l.customer_id,
          SUM(li.paid_amount) AS total_paid
        FROM loans l
        JOIN loan_installments li ON li.loan_id = l.id
        ${paymentFilter}
        GROUP BY l.customer_id
      ) p ON p.customer_id = c.id
      `,
      [...loanParams, ...paymentParams],
    );

    return {
      page,
      limit,
      total_records: countRow.total,
      data,
      summary: summaryRows[0],
    };
  },

  async hasPayments(conn, loanId) {
    const [[row]] = await conn.query(
      `
    SELECT EXISTS (
      SELECT 1
      FROM loan_installments
      WHERE loan_id = ?
        AND paid_amount > 0
    ) AS has_payment
    `,
      [loanId],
    );

    return Boolean(row.has_payment);
  },
};
