import { getDB } from "../../config/db.js";

export const LoanPlanModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO loan_plans (
        plan_name, plan_code, collection_frequency,
        tenure, tenure_type,
        commission_type, commission_value,
        description, status, created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        data.plan_name,
        data.plan_code,
        data.collection_frequency,
        data.tenure,
        data.tenure_type,
        data.commission_type,
        data.commission_value,
        data.description,
        data.status,
        data.created_by,
      ],
    );

    return res.insertId;
  },

  async update(conn, id, data) {
    const db = conn || getDB();

    // 🔹 Only update fields that are provided (partial update support)
    const updatableFields = [
      "plan_name",
      "plan_code",
      "collection_frequency",
      "tenure",
      "tenure_type",
      "commission_type",
      "commission_value",
      "description",
      "status",
    ];

    const fields = [];
    const values = [];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return 0;

    fields.push("updated_by = ?");
    values.push(data.updated_by);
    values.push(id);

    const [res] = await db.query(
      `UPDATE loan_plans SET ${fields.join(", ")} WHERE id=?`,
      values,
    );

    return res.affectedRows;
  },

  async findAll() {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT
        lp.*,
        p.grace_days, p.penalty_type, p.penalty_value, p.max_penalty, p.status AS penalty_status,
        CAST(COALESCE(l.loan_count, 0) AS UNSIGNED) AS loan_count
      FROM loan_plans lp
      LEFT JOIN loan_plan_penalties p ON lp.id = p.loan_plan_id
      LEFT JOIN (
        SELECT loan_plan_id, COUNT(*) AS loan_count
        FROM loans
        GROUP BY loan_plan_id
      ) l ON lp.id = l.loan_plan_id
      ORDER BY lp.id DESC
    `);

    return rows;
  },

  async findById(id) {
    const db = getDB();

    const [[row]] = await db.query(
      `
      SELECT
        lp.*,
        p.grace_days, p.penalty_type, p.penalty_value, p.max_penalty, p.status AS penalty_status,
        CAST(COALESCE(l.loan_count, 0) AS UNSIGNED) AS loan_count
      FROM loan_plans lp
      LEFT JOIN loan_plan_penalties p ON lp.id = p.loan_plan_id
      LEFT JOIN (
        SELECT loan_plan_id, COUNT(*) AS loan_count
        FROM loans
        GROUP BY loan_plan_id
      ) l ON lp.id = l.loan_plan_id
      WHERE lp.id=?`,
      [id],
    );

    return row;
  },

  async findByCode(conn, code) {
    const db = conn || getDB();
    const [rows] = await db.query(
      `SELECT id FROM loan_plans WHERE plan_code=?`,
      [code],
    );
    return rows[0];
  },

  async findByName(conn, name) {
    const db = conn || getDB();
    const [rows] = await db.query(
      `SELECT id FROM loan_plans WHERE plan_name=?`,
      [name],
    );
    return rows[0];
  },

  async delete(id) {
    const db = getDB();
    const [res] = await db.query(`DELETE FROM loan_plans WHERE id=?`, [id]);
    return res.affectedRows;
  },
};

export const LoanPlanPenaltyModel = {
  async upsert(conn, loanPlanId, penalty) {
    const [existing] = await conn.query(
      `SELECT * FROM loan_plan_penalties WHERE loan_plan_id=?`,
      [loanPlanId],
    );

    if (existing.length > 0) {
      const prev = existing[0];
      const grace_days =
        penalty.grace_days !== undefined ? penalty.grace_days : prev.grace_days;
      const penalty_type =
        penalty.penalty_type !== undefined
          ? penalty.penalty_type
          : prev.penalty_type;
      const penalty_value =
        penalty.penalty_value !== undefined
          ? penalty.penalty_value
          : prev.penalty_value;
      const max_penalty =
        penalty.max_penalty !== undefined
          ? penalty.max_penalty
          : prev.max_penalty;
      const status =
        penalty.status !== undefined ? penalty.status : prev.status;

      await conn.query(
        `UPDATE loan_plan_penalties SET
          grace_days=?, penalty_type=?, penalty_value=?, max_penalty=?, status=?
        WHERE loan_plan_id=?`,
        [
          grace_days,
          penalty_type,
          penalty_value,
          max_penalty,
          status,
          loanPlanId,
        ],
      );
    } else {
      await conn.query(
        `INSERT INTO loan_plan_penalties (
          loan_plan_id, grace_days,
          penalty_type, penalty_value,
          max_penalty, status
        ) VALUES (?,?,?,?,?,?)`,
        [
          loanPlanId,
          penalty.grace_days ?? 0,
          penalty.penalty_type,
          penalty.penalty_value,
          penalty.max_penalty ?? null,
          penalty.status ?? "active",
        ],
      );
    }
  },
};
