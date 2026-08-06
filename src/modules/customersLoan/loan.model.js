import { getDB } from "../../config/db.js";

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

          ?,?,?,?,?,?,?,?,?,?,?,?

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

    return rows;
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

    return row;
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
};
