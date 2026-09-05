import { getDB } from "../../../config/db.js";

let scheduleColumns = null;
let scheduleColumnsChecked = false;

export async function ensureScheduleColumns(client) {
  if (scheduleColumnsChecked) return;
  try {
    const [cols] = await client.query(
      `SHOW COLUMNS FROM interest_only_loan_schedules`,
    );
    const fieldNames = cols.map((c) => c.Field);
    scheduleColumns = fieldNames;

    if (!fieldNames.includes("interest_paid")) {
      await client.query(
        `ALTER TABLE interest_only_loan_schedules ADD COLUMN interest_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00 AFTER paid_amount`,
      );
      scheduleColumns.push("interest_paid");
    }
    if (!fieldNames.includes("principal_paid")) {
      await client.query(
        `ALTER TABLE interest_only_loan_schedules ADD COLUMN principal_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00 AFTER interest_paid`,
      );
      scheduleColumns.push("principal_paid");
    }
    if (!fieldNames.includes("remarks")) {
      await client.query(
        `ALTER TABLE interest_only_loan_schedules ADD COLUMN remarks TEXT NULL AFTER status`,
      );
      scheduleColumns.push("remarks");
    }
    scheduleColumnsChecked = true;
  } catch (err) {
    if (!scheduleColumns) {
      try {
        const [cols] = await client.query(
          `SHOW COLUMNS FROM interest_only_loan_schedules`,
        );
        scheduleColumns = cols.map((c) => c.Field);
      } catch (e) {
        scheduleColumns = [];
      }
    }
  }
}

export const ScheduleModel = {
  async create(conn, data) {
    await ensureScheduleColumns(conn);

    const allowed = [
      "loan_id",
      "schedule_no",
      "due_date",
      "interest_amount",
      "principal_amount",
      "total_due",
      "paid_amount",
      "interest_paid",
      "principal_paid",
      "balance_amount",
      "paid_date",
      "payment_type",
      "status",
      "remarks",
    ];

    const fields = [];
    const values = [];

    for (const [key, val] of Object.entries(data)) {
      if (
        allowed.includes(key) &&
        val !== undefined &&
        (!scheduleColumns ||
          scheduleColumns.length === 0 ||
          scheduleColumns.includes(key))
      ) {
        fields.push(key);
        values.push(val);
      }
    }

    const placeholders = fields.map(() => "?").join(", ");
    await conn.query(
      `INSERT INTO interest_only_loan_schedules (${fields.join(", ")}) VALUES (${placeholders})`,
      values,
    );
  },

  async getByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_only_loan_schedules
       WHERE loan_id = ?
       ORDER BY schedule_no ASC`,
      [loan_id],
    );
    return rows;
  },

  async getPendingByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_only_loan_schedules
       WHERE loan_id = ? AND status IN ('pending', 'partial')
       ORDER BY due_date ASC, schedule_no ASC`,
      [loan_id],
    );
    return rows;
  },

  async getOverdueByLoanId(loan_id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT * FROM interest_only_loan_schedules
       WHERE loan_id = ? 
         AND status IN ('pending', 'partial') 
         AND due_date < CURDATE()
       ORDER BY due_date ASC, schedule_no ASC`,
      [loan_id],
    );
    return rows;
  },

  async getById(id, conn = null) {
    const client = conn || getDB();
    const [rows] = await client.query(
      `SELECT 
         s.*,
         l.loan_no,
         l.customer_id,
         CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
         c.mobile AS customer_mobile
       FROM interest_only_loan_schedules s
       JOIN interest_only_loans l ON s.loan_id = l.id
       JOIN customers c ON l.customer_id = c.id
       WHERE s.id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  async getPendingSchedules(conn, loan_id) {
    const [rows] = await conn.query(
      `SELECT * FROM interest_only_loan_schedules
       WHERE loan_id = ? AND status IN ('pending', 'partial')
       ORDER BY due_date ASC, schedule_no ASC FOR UPDATE`,
      [loan_id],
    );
    return rows;
  },

  async updateSchedule(conn, id, data) {
    await ensureScheduleColumns(conn);

    const allowed = [
      "interest_paid",
      "principal_paid",
      "paid_amount",
      "balance_amount",
      "status",
      "paid_date",
      "remarks",
    ];

    const fields = [];
    const values = [];

    for (const [k, v] of Object.entries(data)) {
      if (
        allowed.includes(k) &&
        v !== undefined &&
        (!scheduleColumns ||
          scheduleColumns.length === 0 ||
          scheduleColumns.includes(k))
      ) {
        fields.push(`${k} = ?`);
        values.push(v);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await conn.query(
      `UPDATE interest_only_loan_schedules SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  async findTodayCollections(dateOrFilters, status = "all", search = "", conn = null) {
    let date = dateOrFilters;
    if (typeof dateOrFilters === "object" && dateOrFilters !== null && !(dateOrFilters instanceof Date)) {
      date = dateOrFilters.date;
      status = dateOrFilters.status || "all";
      search = dateOrFilters.search || "";
      conn = dateOrFilters.conn || conn;
    }
    const client = conn || getDB();
    const targetDate = date || new Date().toISOString().slice(0, 10);

    let query = `
      SELECT 
        s.id,
        s.loan_id,
        s.schedule_no,
        s.due_date,
        s.interest_amount,
        s.principal_amount,
        s.total_due,
        s.paid_amount,
        s.interest_paid,
        s.principal_paid,
        s.balance_amount,
        s.status,
        s.payment_type,
        s.paid_date,
        s.remarks,
        l.loan_no,
        l.principal_amount AS loan_principal,
        l.interest_rate,
        l.interest_frequency,
        l.status AS loan_status,
        l.outstanding_interest,
        l.outstanding_principal,
        l.total_payable,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        p.id AS plan_id,
        p.plan_name,
        p.plan_code
      FROM interest_only_loan_schedules s
      JOIN interest_only_loans l ON s.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      LEFT JOIN interest_only_loan_plans p ON l.interest_plan_id = p.id
      WHERE DATE(s.due_date) = ?
        AND l.status NOT IN ('cancelled', 'closed')
    `;
    const params = [targetDate];

    if (status && status !== "all") {
      if (status === "pending") {
        query += ` AND s.status IN ('pending', 'overdue')`;
      } else if (status === "partial") {
        query += ` AND s.status = 'partial'`;
      } else if (status === "paid") {
        query += ` AND s.status = 'paid'`;
      } else {
        query += ` AND s.status = ?`;
        params.push(status);
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (CONCAT_WS(\' \', c.first_name, c.last_name) LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.mobile LIKE ? OR l.loan_no LIKE ? OR c.customer_no LIKE ?)`;
      params.push(term, term, term, term, term, term);
    }

    query += ` ORDER BY s.due_date ASC, s.schedule_no ASC`;

    const [rows] = await client.query(query, params);
    return rows;
  },

  async findOverdueCollectionsGlobal(searchOrFilters = "", conn = null) {
    let search = searchOrFilters;
    if (typeof searchOrFilters === "object" && searchOrFilters !== null) {
      search = searchOrFilters.search || "";
      conn = searchOrFilters.conn || conn;
    }
    const client = conn || getDB();

    let query = `
      SELECT 
        s.id,
        s.loan_id,
        s.schedule_no,
        s.due_date,
        s.interest_amount,
        s.principal_amount,
        s.total_due,
        s.paid_amount,
        s.interest_paid,
        s.principal_paid,
        s.balance_amount,
        s.status,
        s.payment_type,
        GREATEST(DATEDIFF(CURDATE(), s.due_date), 0) AS days_overdue,
        l.loan_no,
        l.principal_amount AS loan_principal,
        l.interest_rate,
        l.interest_frequency,
        l.status AS loan_status,
        l.outstanding_interest,
        l.outstanding_principal,
        l.total_payable,
        c.id AS customer_id,
        c.customer_no,
        CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
        c.mobile AS customer_mobile,
        p.id AS plan_id,
        p.plan_name,
        p.plan_code
      FROM interest_only_loan_schedules s
      JOIN interest_only_loans l ON s.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      LEFT JOIN interest_only_loan_plans p ON l.interest_plan_id = p.id
      WHERE (s.due_date < CURDATE() OR s.status = 'overdue')
        AND s.status != 'paid'
        AND s.balance_amount > 0
        AND l.status NOT IN ('closed', 'completed', 'cancelled')
    `;
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (CONCAT_WS(\' \', c.first_name, c.last_name) LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.mobile LIKE ? OR l.loan_no LIKE ? OR c.customer_no LIKE ?)`;
      params.push(term, term, term, term, term, term);
    }

    query += ` ORDER BY days_overdue DESC, s.due_date ASC, s.schedule_no ASC`;

    const [rows] = await client.query(query, params);
    return rows;
  },

  async deleteByLoanId(conn, loan_id) {
    await conn.query(
      `DELETE FROM interest_only_loan_schedules WHERE loan_id = ?`,
      [loan_id],
    );
  },
};
