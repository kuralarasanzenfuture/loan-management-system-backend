import { getDB } from "../../config/db.js";

const buildDateFilter = (column, filters, params) => {
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

const DashboardModel = {
  async getDashboardOverview(filters = {}) {
    const db = getDB();

    const loanParams = [];
    const installmentParams = [];

    let loanFilter = "";

    if (filters.from) {
      loanFilter += ` AND l.start_date >= ?`;
      loanParams.push(filters.from);
    }

    if (filters.to) {
      loanFilter += ` AND l.start_date <= ?`;
      loanParams.push(filters.to);
    }

    if (filters.status) {
      loanFilter += ` AND l.status = ?`;
      loanParams.push(filters.status);
    }

    /* =====================================================
       ACTIVE PORTFOLIO
    ===================================================== */

    const [portfolioRows] = await db.query(
      `
      SELECT
        COALESCE(SUM(l.loan_amount), 0) AS active_portfolio,
        COUNT(*) AS active_loans,
        COUNT(DISTINCT l.customer_id) AS active_borrowers,
        COALESCE(AVG(l.loan_amount), 0) AS average_loan_size

      FROM loans l

      WHERE l.status = 'active'
      ${loanFilter}
      `,
      loanParams,
    );

    /* =====================================================
       OUTSTANDING RECEIVABLES
    ===================================================== */

    let outstandingFilter = `
      li.status IN ('pending', 'partial', 'overdue')
    `;

    if (filters.from) {
      outstandingFilter += ` AND li.due_date >= ?`;
      installmentParams.push(filters.from);
    }

    if (filters.to) {
      outstandingFilter += ` AND li.due_date <= ?`;
      installmentParams.push(filters.to);
    }

    const [receivableRows] = await db.query(
      `
      SELECT
        COALESCE(
          SUM(li.balance_amount),
          0
        ) AS outstanding_receivables,

        COALESCE(
          SUM(
            CASE
              WHEN li.status = 'overdue'
              THEN li.balance_amount
              ELSE 0
            END
          ),
          0
        ) AS overdue_amount,

        COALESCE(
          SUM(
            CASE
              WHEN li.status = 'overdue'
              THEN li.penalty_amount
              ELSE 0
            END
          ),
          0
        ) AS overdue_penalty

      FROM loan_installments li

      WHERE ${outstandingFilter}
      `,
      installmentParams,
    );

    /* =====================================================
       COLLECTION RATE
    ===================================================== */

    const [collectionRows] = await db.query(
      `
      SELECT
        COALESCE(SUM(li.paid_amount), 0) AS total_paid,

        COALESCE(SUM(li.total_due), 0) AS total_due,

        COALESCE(
          (
            SUM(li.paid_amount)
            /
            NULLIF(SUM(li.total_due), 0)
          ) * 100,
          0
        ) AS collection_rate

      FROM loan_installments li
      `,
    );

    const portfolio = portfolioRows[0];
    const receivable = receivableRows[0];
    const collection = collectionRows[0];

    return {
      active_portfolio: Number(portfolio.active_portfolio).toFixed(2),

      active_loans: Number(portfolio.active_loans),

      active_borrowers: Number(portfolio.active_borrowers),

      average_loan_size: Number(portfolio.average_loan_size).toFixed(2),

      outstanding_receivables: Number(
        receivable.outstanding_receivables,
      ).toFixed(2),

      overdue_amount: Number(receivable.overdue_amount).toFixed(2),

      overdue_penalty: Number(receivable.overdue_penalty).toFixed(2),

      total_paid: Number(collection.total_paid).toFixed(2),

      total_due: Number(collection.total_due).toFixed(2),

      collection_rate: Number(collection.collection_rate).toFixed(2),
    };
  },

  async getPortfolioTrends(filters = {}) {
    const db = getDB();

    const params = [];

    let dateFilter = "";

    if (filters.from) {
      dateFilter += ` AND l.start_date >= ?`;
      params.push(filters.from);
    }

    if (filters.to) {
      dateFilter += ` AND l.start_date <= ?`;
      params.push(filters.to);
    }

    /* =====================================================
       MONTHLY PORTFOLIO
    ===================================================== */

    const [portfolioRows] = await db.query(
      `
      SELECT
        DATE_FORMAT(
          l.start_date,
          '%Y-%m'
        ) AS month,

        COALESCE(
          SUM(l.loan_amount),
          0
        ) AS disbursed_amount,

        COUNT(*) AS loan_count

      FROM loans l

      WHERE l.start_date IS NOT NULL
      ${dateFilter}

      GROUP BY
        DATE_FORMAT(l.start_date, '%Y-%m')

      ORDER BY month ASC
      `,
      params,
    );

    /* =====================================================
       MONTHLY COLLECTION
    ===================================================== */

    const collectionParams = [];

    let collectionFilter = `
      li.paid_date IS NOT NULL
    `;

    if (filters.from) {
      collectionFilter += ` AND li.paid_date >= ?`;
      collectionParams.push(filters.from);
    }

    if (filters.to) {
      collectionFilter += ` AND li.paid_date <= ?`;
      collectionParams.push(filters.to);
    }

    const [collectionRows] = await db.query(
      `
      SELECT

        DATE_FORMAT(
          li.paid_date,
          '%Y-%m'
        ) AS month,

        COALESCE(
          SUM(li.paid_amount),
          0
        ) AS collected_amount

      FROM loan_installments li

      WHERE ${collectionFilter}

      GROUP BY
        DATE_FORMAT(li.paid_date, '%Y-%m')

      ORDER BY month ASC
      `,
      collectionParams,
    );

    /* =====================================================
       MONTHLY OVERDUE
    ===================================================== */

    const overdueParams = [];

    let overdueFilter = `
      li.status = 'overdue'
    `;

    if (filters.from) {
      overdueFilter += ` AND li.due_date >= ?`;
      overdueParams.push(filters.from);
    }

    if (filters.to) {
      overdueFilter += ` AND li.due_date <= ?`;
      overdueParams.push(filters.to);
    }

    const [overdueRows] = await db.query(
      `
      SELECT

        DATE_FORMAT(
          li.due_date,
          '%Y-%m'
        ) AS month,

        COALESCE(
          SUM(li.balance_amount),
          0
        ) AS overdue_amount,

        COALESCE(
          SUM(li.penalty_amount),
          0
        ) AS penalty_amount

      FROM loan_installments li

      WHERE ${overdueFilter}

      GROUP BY
        DATE_FORMAT(li.due_date, '%Y-%m')

      ORDER BY month ASC
      `,
      overdueParams,
    );

    return {
      portfolio: portfolioRows,
      collections: collectionRows,
      overdue: overdueRows,
    };
  },

  async getLoanPlanMix(filters = {}) {
    const db = getDB();

    const params = [];

    let filter = "";

    if (filters.from) {
      filter += ` AND l.start_date >= ?`;
      params.push(filters.from);
    }

    if (filters.to) {
      filter += ` AND l.start_date <= ?`;
      params.push(filters.to);
    }

    if (filters.status) {
      filter += ` AND l.status = ?`;
      params.push(filters.status);
    }

    const [rows] = await db.query(
      `
    SELECT
      lp.id AS loan_plan_id,
      lp.plan_name,
      lp.plan_code,

      COUNT(l.id) AS loan_count,

      COALESCE(
        SUM(l.loan_amount),
        0
      ) AS total_loan_amount,

      COALESCE(
        SUM(l.total_repayment),
        0
      ) AS total_repayment,

      COALESCE(
        SUM(
          CASE
            WHEN l.status = 'active'
            THEN l.loan_amount
            ELSE 0
          END
        ),
        0
      ) AS active_amount

    FROM loans l

    INNER JOIN loan_plans lp
      ON lp.id = l.loan_plan_id

    WHERE 1 = 1
    ${filter}

    GROUP BY
      lp.id,
      lp.plan_name,
      lp.plan_code

    ORDER BY
      total_loan_amount DESC
    `,
      params,
    );

    /* =====================================================
     CALCULATE PORTFOLIO PERCENTAGE
  ===================================================== */

    const totalAmount = rows.reduce(
      (sum, row) => sum + Number(row.total_loan_amount || 0),
      0,
    );

    return rows.map((row) => ({
      ...row,

      loan_count: Number(row.loan_count),

      total_loan_amount: Number(row.total_loan_amount).toFixed(2),

      total_repayment: Number(row.total_repayment).toFixed(2),

      active_amount: Number(row.active_amount).toFixed(2),

      portfolio_percentage:
        totalAmount > 0
          ? Number(
              ((Number(row.total_loan_amount) / totalAmount) * 100).toFixed(2),
            )
          : 0,
    }));
  },

  async getPortfolioHealth() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT

        /* ON-TIME PAYMENT % */
        COALESCE(
          ROUND(
            (SUM(CASE 
                WHEN li.paid_date IS NOT NULL 
                     AND li.paid_date <= li.due_date 
                THEN 1 ELSE 0 END)
            /
            NULLIF(SUM(CASE 
                WHEN li.paid_date IS NOT NULL 
                THEN 1 ELSE 0 END), 0)
            ) * 100, 2
          ), 0
        ) AS on_time_payment_rate,

        /* NPL RATIO */
        COALESCE(
          ROUND(
            (
              COUNT(DISTINCT CASE 
                WHEN li.status = 'overdue'
                     AND DATEDIFF(CURDATE(), li.due_date) > 30
                THEN l.id END
              )
              /
              NULLIF(COUNT(DISTINCT l.id), 0)
            ) * 100, 2
          ), 0
        ) AS npl_ratio,

        /* ACTIVE CAPITAL */
        COALESCE(SUM(
          CASE 
            WHEN l.status = 'active' 
            THEN li.balance_amount 
            ELSE 0 
          END
        ), 0) AS active_capital

      FROM loan_installments li
      JOIN loans l ON l.id = li.loan_id
    `);

    return rows[0];
  },
  async getRecentLoans() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT
        l.id,
        l.loan_no,
        l.loan_amount,
        l.status,
        l.created_at,

        c.first_name,
        c.last_name,
        c.mobile

      FROM loans l
      JOIN customers c ON c.id = l.customer_id

      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    return rows;
  },
  async getQuickInsights() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT

        /* TOTAL DISBURSED */
        COALESCE(SUM(l.net_disbursed_amount), 0) AS total_disbursed,

        /* TOTAL COLLECTED */
        COALESCE(SUM(li.paid_amount), 0) AS total_collected,

        /* TOTAL OUTSTANDING */
        COALESCE(SUM(li.balance_amount), 0) AS total_outstanding,

        /* NPL % */
        COALESCE(
          ROUND(
            (
              SUM(CASE WHEN li.status = 'overdue' THEN 1 ELSE 0 END)
              /
              NULLIF(COUNT(*), 0)
            ) * 100
          , 2),
          0
        ) AS npl_ratio

      FROM loan_installments li
      JOIN loans l ON l.id = li.loan_id
    `);

    return rows[0];
  },
  async getTopLoanOfficers() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT
        u.id,
        u.username,

        COUNT(l.id) AS total_loans,
        COALESCE(SUM(l.loan_amount), 0) AS total_amount

      FROM loans l
      JOIN users u ON u.id = l.created_by

      GROUP BY u.id
      ORDER BY total_amount DESC
      LIMIT 5
    `);

    return rows;
  },
};

export default DashboardModel;
