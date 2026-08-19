import { getDB } from "../../../config/db.js";

const PersonalChitModel = {
  /* =====================================================
     GENERATE CHIT NUMBER
     Format:
     CHIT-00001
  ===================================================== */

  async generateChitNo(conn) {
    const [[row]] = await conn.query(
      `SELECT chit_no
       FROM personal_chits
       ORDER BY id DESC
       LIMIT 1`,
    );

    let next = 1;

    if (row?.chit_no) {
      const match = row.chit_no.match(/(\d+)$/);

      if (match) {
        const lastNumber = Number(match[1]);

        if (!Number.isNaN(lastNumber)) {
          next = lastNumber + 1;
        }
      }
    }

    return `CHIT-${String(next).padStart(5, "0")}`;
  },

  /* =====================================================
     CREATE CHIT
  ===================================================== */

  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO personal_chits (
        chit_no,
        chit_name,
        chit_provider,
        provider_mobile,
        provider_alternate_mobile,
        provider_address,
        chit_amount,
        payment_schedule_type,
        payment_frequency,
        payment_interval,
        start_date,
        expected_end_date,
        actual_end_date,
        is_taken,
        taken_date,
        chit_received_amount,
        total_paid_amount,
        total_pending_amount,
        total_members,
        status,
        remarks,
        created_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?
      )`,
      [
        data.chit_no,
        data.chit_name,
        data.chit_provider,
        data.provider_mobile,
        data.provider_alternate_mobile,
        data.provider_address,
        data.chit_amount,
        data.payment_schedule_type,
        data.payment_frequency,
        data.payment_interval,
        data.start_date,
        data.expected_end_date,
        data.actual_end_date,
        data.is_taken,
        data.taken_date,
        data.chit_received_amount,
        data.total_paid_amount,
        data.total_pending_amount,
        data.total_members,
        data.status,
        data.remarks,
        data.created_by,
      ],
    );

    return result.insertId;
  },

  /* =====================================================
     GET ALL CHITS
  ===================================================== */

  async findAll(filters = {}) {
    const db = getDB();

    let query = `
      SELECT *
      FROM personal_chits
      WHERE 1=1
    `;

    const params = [];

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.chit_provider) {
      query += ` AND chit_provider LIKE ?`;
      params.push(`%${filters.chit_provider}%`);
    }

    if (filters.provider_mobile) {
      query += ` AND provider_mobile LIKE ?`;
      params.push(`%${filters.provider_mobile}%`);
    }

    if (filters.payment_frequency) {
      query += ` AND payment_frequency = ?`;
      params.push(filters.payment_frequency);
    }

    if (filters.payment_schedule_type) {
      query += ` AND payment_schedule_type = ?`;
      params.push(filters.payment_schedule_type);
    }

    if (filters.is_taken !== undefined) {
      query += ` AND is_taken = ?`;

      params.push(
        filters.is_taken === "true" || filters.is_taken === true ? 1 : 0,
      );
    }

    if (filters.from_date) {
      query += ` AND start_date >= ?`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND start_date <= ?`;
      params.push(filters.to_date);
    }

    query += ` ORDER BY id DESC`;

    const [rows] = await db.query(query, params);

    return rows;
  },

  /* =====================================================
     GET CHIT BY ID
  ===================================================== */

  async findById(id) {
    const db = getDB();

    const [[row]] = await db.query(
      `SELECT *
       FROM personal_chits
       WHERE id = ?`,
      [id],
    );

    return row;
  },

  /* =====================================================
     GET CHIT BY ID WITH LOCK
  ===================================================== */

  async findByIdWithConn(conn, id) {
    const [[row]] = await conn.query(
      `SELECT *
       FROM personal_chits
       WHERE id = ?
       FOR UPDATE`,
      [id],
    );

    return row;
  },

  /* =====================================================
     UPDATE CHIT
  ===================================================== */

  async update(conn, id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      "chit_name",
      "chit_provider",
      "provider_mobile",
      "provider_alternate_mobile",
      "provider_address",
      "chit_amount",
      "payment_schedule_type",
      "payment_frequency",
      "payment_interval",
      "start_date",
      "expected_end_date",
      "actual_end_date",
      "is_taken",
      "taken_date",
      "chit_received_amount",
      "total_members",
      "remarks",
      "status",
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (!fields.length) {
      throw {
        status: 400,
        message: "No fields provided for update",
      };
    }

    values.push(id);

    await conn.query(
      `UPDATE personal_chits
       SET ${fields.join(", ")}
       WHERE id = ?`,
      values,
    );
  },

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  async updateStatus(id, status) {
    const db = getDB();

    await db.query(
      `UPDATE personal_chits
       SET status = ?
       WHERE id = ?`,
      [status, id],
    );
  },

  /* =====================================================
     MARK TAKEN
  ===================================================== */

  async markTaken(conn, id, data) {
    await conn.query(
      `UPDATE personal_chits
       SET
         is_taken = 1,
         taken_date = ?,
         chit_received_amount = ?
       WHERE id = ?`,
      [data.taken_date, data.chit_received_amount, id],
    );
  },

  /* =====================================================
     UPDATE SUMMARY
  ===================================================== */

  async updateSummary(conn, id, data) {
    await conn.query(
      `UPDATE personal_chits
       SET
         total_paid_amount = ?,
         total_pending_amount = ?,
         status = ?
       WHERE id = ?`,
      [data.total_paid_amount, data.total_pending_amount, data.status, id],
    );
  },

  /* =====================================================
     DELETE
  ===================================================== */

  async delete(conn, id) {
    await conn.query(
      `DELETE FROM personal_chits
       WHERE id = ?`,
      [id],
    );
  },

  /* =====================================================
     SUMMARY
  ===================================================== */

  async getSummary(filters = {}) {
    const db = getDB();

    let query = `
      SELECT
        COUNT(*) AS total_chits,

        COALESCE(
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END),
          0
        ) AS active_chits,

        COALESCE(
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END),
          0
        ) AS completed_chits,

        COALESCE(
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END),
          0
        ) AS cancelled_chits,

        COALESCE(SUM(chit_amount), 0) AS total_chit_amount,

        COALESCE(SUM(total_paid_amount), 0) AS total_paid_amount,

        COALESCE(SUM(total_pending_amount), 0)
          AS total_pending_amount,

        COALESCE(SUM(chit_received_amount), 0)
          AS total_received_amount

      FROM personal_chits
      WHERE 1=1
    `;

    const params = [];

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    const [[row]] = await db.query(query, params);

    return row;
  },
};

export default PersonalChitModel;
