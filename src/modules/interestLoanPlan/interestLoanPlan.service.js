import { getDB } from "../../config/db.js";
import { InterestOnlyLoanPlanModel } from "./interestLoanPlan.model.js";

export const InterestOnlyLoanPlanService = {
  /**
   * AUTO-GENERATE MEANINGFUL PLAN CODE
   * Structure: IOLP-{FREQUENCY}-{TENURE}{UNIT}-{SEQUENCE}
   * Examples:
   *  - IOLP-MTH-12M-001 (Monthly, 12 Months)
   *  - IOLP-QTR-2Y-001  (Quarterly, 2 Years)
   *  - IOLP-HY-1Y-001   (Half-Yearly, 1 Year)
   *  - IOLP-YR-3Y-001   (Yearly, 3 Years)
   */
  async generatePlanCode(conn, frequency, tenure, tenureType = "months") {
    const freqMap = {
      monthly: "MTH",
      quarterly: "QTR",
      half_yearly: "HY",
      yearly: "YR",
    };

    const freqCode = freqMap[frequency?.toLowerCase()] || "MTH";
    const tenureUnit = tenureType?.toLowerCase() === "years" ? "Y" : "M";
    const tenureCode = `${tenure}${tenureUnit}`;
    const prefix = `IOLP-${freqCode}-${tenureCode}-`;

    const [rows] = await conn.query(
      `SELECT plan_code 
       FROM interest_only_loan_plans 
       WHERE plan_code LIKE ? 
       ORDER BY id DESC 
       LIMIT 1
       FOR UPDATE`,
      [`${prefix}%`],
    );

    let nextSeq = 1;
    if (rows.length > 0) {
      const lastCode = rows[0].plan_code;
      const parts = lastCode.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextSeq = lastNum + 1;
      }
    }

    let candidateCode = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    // Guarantee uniqueness
    while (
      await InterestOnlyLoanPlanModel.findByCode(candidateCode, null, conn)
    ) {
      nextSeq++;
      candidateCode = `${prefix}${String(nextSeq).padStart(3, "0")}`;
    }

    return candidateCode;
  },

  /**
   * CREATE
   */
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // Auto-generate professional plan_code if not provided
      if (!data.plan_code || !data.plan_code.trim()) {
        data.plan_code = await InterestOnlyLoanPlanService.generatePlanCode(
          conn,
          data.interest_frequency,
          data.tenure,
          data.tenure_type,
        );
      } else {
        data.plan_code = data.plan_code.trim().toUpperCase();
      }

      // Duplicate checks
      const codeExists = await InterestOnlyLoanPlanModel.findByCode(
        data.plan_code,
        null,
        conn,
      );
      if (codeExists) {
        throw { status: 400, message: "Loan plan code already exists" };
      }

      const nameExists = await InterestOnlyLoanPlanModel.findByName(
        data.plan_name,
        null,
        conn,
      );
      if (nameExists) {
        throw { status: 400, message: "Loan plan name already exists" };
      }

      // Attach created_by
      data.created_by = user?.id;

      const id = await InterestOnlyLoanPlanModel.create(conn, data);
      const plan = await InterestOnlyLoanPlanModel.findById(id, conn);

      await conn.commit();

      return {
        message: "Loan plan created successfully",
        data: plan,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * GET ALL
   */
  async getAll(filters = {}) {
    return await InterestOnlyLoanPlanModel.getAll(filters);
  },

  /**
   * GET ACTIVE
   */
  async getActive() {
    return await InterestOnlyLoanPlanModel.getAll({ status: "active" });
  },

  /**
   * GET BY ID
   */
  async getById(id) {
    const plan = await InterestOnlyLoanPlanModel.findById(id);

    if (!plan) {
      throw { status: 404, message: "Loan plan not found" };
    }

    return plan;
  },

  /**
   * UPDATE
   */
  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await InterestOnlyLoanPlanModel.findById(id, conn);

      if (!existing) {
        throw { status: 404, message: "Loan plan not found" };
      }

      // Duplicate checks (exclude current record)
      if (data.plan_code && data.plan_code !== existing.plan_code) {
        const codeExists = await InterestOnlyLoanPlanModel.findByCode(
          data.plan_code,
          id,
          conn,
        );
        if (codeExists) {
          throw { status: 400, message: "Loan plan code already exists" };
        }
      }

      if (data.plan_name && data.plan_name !== existing.plan_name) {
        const nameExists = await InterestOnlyLoanPlanModel.findByName(
          data.plan_name,
          id,
          conn,
        );
        if (nameExists) {
          throw { status: 400, message: "Loan plan name already exists" };
        }
      }

      data.updated_by = user?.id;

      await InterestOnlyLoanPlanModel.update(conn, id, data);

      await conn.commit();

      const updatedPlan = await InterestOnlyLoanPlanModel.findById(id);

      return {
        message: "Loan plan updated successfully",
        data: updatedPlan,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * UPDATE STATUS
   */
  async updateStatus(id, status, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await InterestOnlyLoanPlanModel.findById(id, conn);

      if (!existing) {
        throw { status: 404, message: "Loan plan not found" };
      }

      await InterestOnlyLoanPlanModel.updateStatus(
        conn,
        id,
        status,
        user?.id,
      );

      await conn.commit();

      const updatedPlan = await InterestOnlyLoanPlanModel.findById(id);

      return {
        message: "Status updated successfully",
        data: updatedPlan,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * DELETE
   */
  async delete(id) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await InterestOnlyLoanPlanModel.findById(id, conn);

      if (!existing) {
        throw { status: 404, message: "Loan plan not found" };
      }

      await InterestOnlyLoanPlanModel.delete(conn, id);

      await conn.commit();

      return {
        message: "Loan plan deleted successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
