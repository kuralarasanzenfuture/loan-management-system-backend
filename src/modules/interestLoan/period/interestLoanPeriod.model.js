import { getDB } from "../../../config/db.js";

export const InterestLoanPeriodModel = {
  /**
   * Insert interest loan period
   */
  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO interest_loan_periods (
        loan_id,
        period_no,
        period_start_date,
        period_end_date,
        scheduled_date,
        opening_principal,
        interest_rate,
        interest_amount,
        paid_interest_amount,
        outstanding_interest_amount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.loan_id,
        data.period_no,
        data.period_start_date,
        data.period_end_date,
        data.scheduled_date,
        data.opening_principal,
        data.interest_rate,
        data.interest_amount,
        data.paid_interest_amount ?? 0.0,
        data.outstanding_interest_amount ?? data.interest_amount,
        data.status ?? "pending",
      ],
    );

    return result.insertId;
  },

  /**
   * Get all periods for a loan ordered by period_no
   */
  async getByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_loan_periods WHERE loan_id = ? ORDER BY period_no ASC`,
      [loan_id],
    );
    return rows;
  },

  /**
   * Find period by ID
   */
  async findById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_loan_periods WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  /**
   * Automatically update period statuses based on current date
   * Transitions 'pending' to 'due' if scheduled_date <= CURRENT_DATE()
   */
  /**
   * Automatically update period statuses based on current date
   * Transitions 'pending' to 'due' if scheduled_date <= CURRENT_DATE()
   * Ensures zero balance periods are marked 'paid'
   */
  async syncDueStatuses(loan_id = null, conn = null) {
    const client = conn || getDB();

    // Mark any zero balance periods as paid
    await client.query(
      `UPDATE interest_loan_periods 
       SET status = 'paid' 
       WHERE outstanding_interest_amount <= 0 AND status != 'paid'`
    );

    let query = `
      UPDATE interest_loan_periods 
      SET status = 'due' 
      WHERE status = 'pending' 
        AND scheduled_date <= CURRENT_DATE() 
        AND outstanding_interest_amount > 0
    `;
    const params = [];

    if (loan_id) {
      query += ` AND loan_id = ?`;
      params.push(loan_id);
    }

    await client.query(query, params);

    // Keep interest_loans.outstanding_interest in sync
    if (loan_id) {
      await client.query(
        `UPDATE interest_loans l
         SET l.outstanding_interest = (
           SELECT COALESCE(SUM(p.outstanding_interest_amount), 0.00)
           FROM interest_loan_periods p
           WHERE p.loan_id = l.id
         )
         WHERE l.id = ?`,
        [loan_id]
      );
    } else {
      await client.query(
        `UPDATE interest_loans l
         SET l.outstanding_interest = (
           SELECT COALESCE(SUM(p.outstanding_interest_amount), 0.00)
           FROM interest_loan_periods p
           WHERE p.loan_id = l.id
         )`
      );
    }
  },

  /**
   * Update initial Period 1 before any payments are made
   */
  async updatePeriod1(conn, loan_id, data) {
    await conn.query(
      `UPDATE interest_loan_periods
       SET period_start_date = ?,
           period_end_date = ?,
           scheduled_date = ?,
           opening_principal = ?,
           interest_rate = ?,
           interest_amount = ?,
           outstanding_interest_amount = ?,
           status = ?
       WHERE loan_id = ? AND period_no = 1`,
      [
        data.period_start_date,
        data.period_end_date,
        data.scheduled_date,
        data.opening_principal,
        data.interest_rate,
        data.interest_amount,
        data.outstanding_interest_amount,
        data.status || "pending",
        loan_id,
      ],
    );
  },

  async deleteByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    await client.query(
      `DELETE FROM interest_loan_periods WHERE loan_id = ?`,
      [loan_id],
    );
  },

  /**
   * Get Today's Collections
   * Returns all periods scheduled for today (or target date) with loan and customer details
   * Supports scope: 'date_only' (exact match) or 'up_to_date' (cumulative pending up to date)
   */
  async getTodayCollections(options = {}) {
    await this.syncDueStatuses(null);
    const db = getDB();
    const today =
      options.date ||
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

    const isUpToDate = options.due_scope === "up_to_date" || options.cumulative === true || options.cumulative === "true";

    let query = `
      SELECT 
        p.*,
        l.loan_no,
        l.principal_amount AS loan_principal,
        l.outstanding_principal,
        l.interest_frequency,
        l.status AS loan_status,
        c.id AS customer_id,
        c.customer_no,
        c.first_name,
        c.last_name,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        pl.plan_name,
        pl.plan_code
      FROM interest_loan_periods p
      INNER JOIN interest_loans l ON p.loan_id = l.id
      INNER JOIN customers c ON l.customer_id = c.id
      INNER JOIN interest_loan_plans pl ON l.interest_plan_id = pl.id
      WHERE l.status NOT IN ('cancelled')
    `;

    const params = [];

    if (isUpToDate) {
      query += ` AND p.scheduled_date <= ? AND (p.status != 'paid' OR p.scheduled_date = ?)`;
      params.push(today, today);
    } else {
      query += ` AND p.scheduled_date = ?`;
      params.push(today);
    }

    if (options.status && options.status !== "all") {
      if (options.status === "due" || options.status === "pending") {
        query += ` AND p.status IN ('due', 'pending') AND p.outstanding_interest_amount > 0`;
      } else if (options.status === "unpaid") {
        query += ` AND p.status != 'paid' AND p.outstanding_interest_amount > 0`;
      } else {
        query += ` AND p.status = ?`;
        params.push(options.status);
      }
    }

    if (options.frequency && options.frequency !== "all") {
      query += ` AND l.interest_frequency = ?`;
      params.push(options.frequency);
    }

    if (options.search) {
      const term = `%${options.search.trim()}%`;
      query += ` AND (
        l.loan_no LIKE ? OR 
        c.customer_no LIKE ? OR 
        c.first_name LIKE ? OR 
        c.last_name LIKE ? OR 
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) LIKE ? OR
        c.mobile LIKE ? OR
        pl.plan_name LIKE ? OR
        pl.plan_code LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term, term);
    }

    query += ` ORDER BY p.scheduled_date ASC, p.id ASC`;

    const [rows] = await db.query(query, params);

    const formatted = rows.map((r) => ({
      ...r,
      opening_principal: parseFloat(r.opening_principal),
      interest_rate: parseFloat(r.interest_rate),
      interest_amount: parseFloat(r.interest_amount),
      paid_interest_amount: parseFloat(r.paid_interest_amount || 0),
      outstanding_interest_amount: parseFloat(r.outstanding_interest_amount || 0),
      loan_principal: parseFloat(r.loan_principal || 0),
      outstanding_principal: parseFloat(r.outstanding_principal || 0),
    }));

    const totalDue = formatted.reduce((acc, cur) => acc + cur.interest_amount, 0);
    const totalCollected = formatted.reduce((acc, cur) => acc + cur.paid_interest_amount, 0);
    const totalOutstanding = formatted.reduce((acc, cur) => acc + cur.outstanding_interest_amount, 0);
    const paidCount = formatted.filter((r) => r.status === "paid" || r.outstanding_interest_amount <= 0).length;
    const unpaidCount = formatted.length - paidCount;

    const summary = {
      date: today,
      due_scope: isUpToDate ? "up_to_date" : "date_only",
      total_records: formatted.length,
      total_due_amount: totalDue,
      total_collected_amount: totalCollected,
      total_outstanding_amount: totalOutstanding,
      paid_count: paidCount,
      unpaid_count: unpaidCount,
      collection_percentage: totalDue > 0 ? parseFloat(((totalCollected / totalDue) * 100).toFixed(1)) : 0,
    };

    return {
      summary,
      data: formatted,
    };
  },

  /**
   * Get Overdue Collections
   * Returns ALL periods past their scheduled date with outstanding interest
   * Includes comprehensive aging bucket breakdown and filters
   */
  async getOverdueCollections(options = {}) {
    await this.syncDueStatuses(null);
    const db = getDB();
    const today =
      options.date ||
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

    let query = `
      SELECT 
        p.*,
        DATEDIFF(?, p.scheduled_date) AS days_overdue,
        l.loan_no,
        l.principal_amount AS loan_principal,
        l.outstanding_principal,
        l.interest_frequency,
        l.status AS loan_status,
        c.id AS customer_id,
        c.customer_no,
        c.first_name,
        c.last_name,
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        pl.plan_name,
        pl.plan_code
      FROM interest_loan_periods p
      INNER JOIN interest_loans l ON p.loan_id = l.id
      INNER JOIN customers c ON l.customer_id = c.id
      INNER JOIN interest_loan_plans pl ON l.interest_plan_id = pl.id
      WHERE p.scheduled_date < ?
        AND p.status != 'paid'
        AND p.outstanding_interest_amount > 0
        AND l.status NOT IN ('cancelled')
    `;

    const params = [today, today];

    // Aging bucket filtering
    if (options.aging_bucket) {
      if (options.aging_bucket === "1-15") {
        query += ` AND DATEDIFF(?, p.scheduled_date) BETWEEN 1 AND 15`;
        params.push(today);
      } else if (options.aging_bucket === "16-30") {
        query += ` AND DATEDIFF(?, p.scheduled_date) BETWEEN 16 AND 30`;
        params.push(today);
      } else if (options.aging_bucket === "31-60") {
        query += ` AND DATEDIFF(?, p.scheduled_date) BETWEEN 31 AND 60`;
        params.push(today);
      } else if (options.aging_bucket === "60+") {
        query += ` AND DATEDIFF(?, p.scheduled_date) > 60`;
        params.push(today);
      }
    } else {
      if (options.min_days_overdue) {
        query += ` AND DATEDIFF(?, p.scheduled_date) >= ?`;
        params.push(today, parseInt(options.min_days_overdue, 10));
      }
      if (options.max_days_overdue) {
        query += ` AND DATEDIFF(?, p.scheduled_date) <= ?`;
        params.push(today, parseInt(options.max_days_overdue, 10));
      }
    }

    if (options.frequency && options.frequency !== "all") {
      query += ` AND l.interest_frequency = ?`;
      params.push(options.frequency);
    }

    if (options.search) {
      const term = `%${options.search.trim()}%`;
      query += ` AND (
        l.loan_no LIKE ? OR 
        c.customer_no LIKE ? OR 
        c.first_name LIKE ? OR 
        c.last_name LIKE ? OR 
        CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) LIKE ? OR
        c.mobile LIKE ? OR
        pl.plan_name LIKE ? OR
        pl.plan_code LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term, term);
    }

    query += ` ORDER BY days_overdue DESC, p.scheduled_date ASC`;

    const [rows] = await db.query(query, params);

    const formatted = rows.map((r) => ({
      ...r,
      days_overdue: parseInt(r.days_overdue, 10),
      opening_principal: parseFloat(r.opening_principal),
      interest_rate: parseFloat(r.interest_rate),
      interest_amount: parseFloat(r.interest_amount),
      paid_interest_amount: parseFloat(r.paid_interest_amount || 0),
      outstanding_interest_amount: parseFloat(r.outstanding_interest_amount || 0),
      loan_principal: parseFloat(r.loan_principal || 0),
      outstanding_principal: parseFloat(r.outstanding_principal || 0),
    }));

    const uniqueLoans = new Set(formatted.map((r) => r.loan_id));

    // Aging bucket breakdown
    const agingBreakdown = {
      bucket_1_15: { count: 0, amount: 0 },
      bucket_16_30: { count: 0, amount: 0 },
      bucket_31_60: { count: 0, amount: 0 },
      bucket_60_plus: { count: 0, amount: 0 },
    };

    formatted.forEach((r) => {
      const days = r.days_overdue;
      const amt = r.outstanding_interest_amount;
      if (days <= 15) {
        agingBreakdown.bucket_1_15.count += 1;
        agingBreakdown.bucket_1_15.amount += amt;
      } else if (days <= 30) {
        agingBreakdown.bucket_16_30.count += 1;
        agingBreakdown.bucket_16_30.amount += amt;
      } else if (days <= 60) {
        agingBreakdown.bucket_31_60.count += 1;
        agingBreakdown.bucket_31_60.amount += amt;
      } else {
        agingBreakdown.bucket_60_plus.count += 1;
        agingBreakdown.bucket_60_plus.amount += amt;
      }
    });

    const summary = {
      reference_date: today,
      total_overdue_periods: formatted.length,
      total_loans_overdue: uniqueLoans.size,
      total_overdue_amount: formatted.reduce((acc, cur) => acc + cur.outstanding_interest_amount, 0),
      max_days_overdue: formatted.length > 0 ? Math.max(...formatted.map((r) => r.days_overdue)) : 0,
      aging_breakdown: agingBreakdown,
    };

    return {
      summary,
      data: formatted,
    };
  },
  
  async getCollectionsOverview(options = {}) {
    const todayResult = await this.getTodayCollections(options);
    const overdueResult = await this.getOverdueCollections(options);

    const db = getDB();
    const today = options.date || new Date().toISOString().split("T")[0];

    // Upcoming query (next 7 days)
    const [upcomingRows] = await db.query(
      `SELECT 
        COUNT(*) AS upcoming_count,
        COALESCE(SUM(p.interest_amount), 0.00) AS upcoming_amount
       FROM interest_loan_periods p
       INNER JOIN interest_loans l ON p.loan_id = l.id
       WHERE p.scheduled_date > ? 
         AND p.scheduled_date <= DATE_ADD(?, INTERVAL 7 DAY)
         AND p.status != 'paid'
         AND l.status = 'active'`,
      [today, today]
    );

    const upcomingSummary = {
      total_records: parseInt(upcomingRows[0].upcoming_count, 10) || 0,
      total_due_amount: parseFloat(upcomingRows[0].upcoming_amount) || 0,
    };

    const type = options.type || "all";
    let records = [];

    if (type === "today") {
      records = todayResult.data;
    } else if (type === "overdue") {
      records = overdueResult.data;
    } else {
      records = {
        today: todayResult.data,
        overdue: overdueResult.data,
      };
    }

    return {
      summary: {
        today: todayResult.summary,
        overdue: overdueResult.summary,
        upcoming_7_days: upcomingSummary,
      },
      active_filter: type,
      data: records,
    };
  },
};

