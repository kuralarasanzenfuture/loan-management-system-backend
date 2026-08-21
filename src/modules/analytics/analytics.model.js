import { getDB } from "../../config/db.js";

const getDateFilter = (column, filters) => {
  const clauses = [];
  const values = [];

  if (filters.from) {
    clauses.push(`${column} >= ?`);
    values.push(filters.from);
  }

  if (filters.to) {
    clauses.push(`${column} <= ?`);
    values.push(filters.to);
  }

  return {
    sql: clauses.length ? `AND ${clauses.join(" AND ")}` : "",
    values,
  };
};

const AnalyticsModel = {
  async getDashboard(filters = {}) {
    const db = getDB();
    const installmentDate = getDateFilter("li.due_date", filters);
    const paymentDate = getDateFilter("li.paid_date", filters);

    const [
      summaryResult,
      dailyResult,
      distributionResult,
      weeklyResult,
      monthlyResult,
      villageResult,
      growthResult,
      topVillageResult,
    ] = await Promise.all([
      db.query(
        `
            SELECT
              COALESCE(SUM(li.paid_amount), 0) AS total_collected,
              COALESCE(SUM(li.balance_amount), 0) AS total_outstanding,
              COUNT(DISTINCT l.customer_id) AS total_customers,
              COALESCE(
                ROUND((SUM(li.paid_amount) / NULLIF(SUM(li.total_due), 0)) * 100, 2),
                0
              ) AS collection_success_rate,
              COALESCE(
                ROUND((SUM(CASE WHEN li.status = 'overdue' THEN 1 ELSE 0 END) /
                  NULLIF(COUNT(*), 0)) * 100, 2),
                0
              ) AS default_rate
            FROM loan_installments li
            JOIN loans l ON l.id = li.loan_id
            WHERE 1 = 1 ${installmentDate.sql}
          `,
        installmentDate.values,
      ),
      db.query(
        `
            SELECT
              DATE(li.paid_date) AS date,
              COALESCE(SUM(li.paid_amount), 0) AS amount
            FROM loan_installments li
            WHERE li.paid_date IS NOT NULL ${paymentDate.sql}
            GROUP BY DATE(li.paid_date)
            ORDER BY date ASC
          `,
        paymentDate.values,
      ),
      db.query(
        `
            SELECT
              l.status,
              COUNT(*) AS loan_count,
              COALESCE(SUM(l.loan_amount), 0) AS loan_amount
            FROM loans l
            GROUP BY l.status
            ORDER BY l.status
          `,
      ),
      db.query(
        `
            SELECT
              YEARWEEK(li.paid_date, 1) AS week,
              MIN(DATE(li.paid_date)) AS week_start,
              COALESCE(SUM(li.paid_amount), 0) AS amount
            FROM loan_installments li
            WHERE li.paid_date IS NOT NULL ${paymentDate.sql}
            GROUP BY YEARWEEK(li.paid_date, 1)
            ORDER BY week ASC
          `,
        paymentDate.values,
      ),
      db.query(
        `
            SELECT
              DATE_FORMAT(li.paid_date, '%Y-%m') AS month,
              COALESCE(SUM(li.paid_amount), 0) AS amount
            FROM loan_installments li
            WHERE li.paid_date IS NOT NULL ${paymentDate.sql}
            GROUP BY DATE_FORMAT(li.paid_date, '%Y-%m')
            ORDER BY month ASC
          `,
        paymentDate.values,
      ),

      db.query(`
        SELECT
          c.city AS village,
          COUNT(*) AS customer_count
        FROM customers c
        WHERE c.city IS NOT NULL AND c.city <> ''
        GROUP BY c.city
        ORDER BY customer_count DESC
        LIMIT 10
      `),

      db.query(
        `
          SELECT
            DATE_FORMAT(c.created_at, '%Y-%m') AS month,
            COUNT(*) AS new_customers
          FROM customers c
          WHERE 1 = 1 ${getDateFilter("c.created_at", filters).sql}
          GROUP BY DATE_FORMAT(c.created_at, '%Y-%m')
          ORDER BY month ASC
        `,
        getDateFilter("c.created_at", filters).values,
      ),
      db.query(`
        SELECT
          c.city AS village,
          COUNT(*) AS total
        FROM customers c
        WHERE c.city IS NOT NULL AND c.city <> ''
        GROUP BY c.city
        ORDER BY total DESC
        LIMIT 5
      `),
    ]);

    return {
      summary: summaryResult[0][0],
      charts: {
        daily_collection: dailyResult[0],
        loan_distribution: distributionResult[0],
        weekly_collection: weeklyResult[0],
        monthly_income: monthlyResult[0],
        village_customers: villageResult[0],
        customer_growth: growthResult[0],
      },
      lists: {
        top_villages: topVillageResult[0],
      },
    };
  },
};

export { AnalyticsModel };
export default AnalyticsModel;
