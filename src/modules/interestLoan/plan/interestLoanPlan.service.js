import { getDB } from "../../../config/db.js";
import { InterestLoanPlanModel } from "./interestLoanPlan.model.js";

export const InterestLoanPlanService = {
  /**
   * Auto-generate a readable plan code
   * Examples: INT-MONTHLY-2, INT-MONTHLY-3, INT-WEEKLY-1
   */
  async generatePlanCode(conn, frequency, interestValue) {
    const freqMap = {
      daily: "DAILY",
      weekly: "WEEKLY",
      monthly: "MONTHLY",
      yearly: "YEARLY",
    };

    const freqCode = freqMap[frequency?.toLowerCase()] || "MONTHLY";
    const val = parseFloat(interestValue) || 0;
    const baseCode = `INT-${freqCode}-${val}`;

    const exists = await InterestLoanPlanModel.findByCode(baseCode, null, conn);
    if (!exists) {
      return baseCode;
    }

    // If exists, find next suffix
    const [rows] = await conn.query(
      `SELECT plan_code 
       FROM interest_loan_plans 
       WHERE plan_code LIKE ? 
       ORDER BY id DESC 
       LIMIT 1
       FOR UPDATE`,
      [`${baseCode}-%`],
    );

    let nextSeq = 1;
    if (rows.length > 0) {
      const parts = rows[0].plan_code.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextSeq = lastNum + 1;
      }
    }

    let candidateCode = `${baseCode}-${nextSeq}`;
    while (await InterestLoanPlanModel.findByCode(candidateCode, null, conn)) {
      nextSeq++;
      candidateCode = `${baseCode}-${nextSeq}`;
    }

    return candidateCode;
  },

  /**
   * Create new interest loan plan
   */
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // Check unique plan name
      const nameExists = await InterestLoanPlanModel.findByName(
        data.plan_name,
        null,
        conn,
      );
      if (nameExists) {
        throw { status: 400, message: "Interest loan plan name already exists" };
      }

      // Handle plan_code
      if (!data.plan_code || !data.plan_code.trim()) {
        data.plan_code = await this.generatePlanCode(
          conn,
          data.interest_frequency,
          data.interest_value,
        );
      } else {
        data.plan_code = data.plan_code.trim().toUpperCase();
        const codeExists = await InterestLoanPlanModel.findByCode(
          data.plan_code,
          null,
          conn,
        );
        if (codeExists) {
          throw { status: 400, message: "Interest loan plan code already exists" };
        }
      }

      data.created_by = user?.id || 1;

      const id = await InterestLoanPlanModel.create(conn, data);
      const newPlan = await InterestLoanPlanModel.findById(id, conn);

      await conn.commit();

      return {
        message: "Interest loan plan created successfully",
        data: newPlan,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Get all plans with filtering and optional pagination
   */
  async getAll(query = {}) {
    const filters = {
      status: query.status,
      interest_type: query.interest_type,
      interest_frequency: query.interest_frequency,
      principal_basis: query.principal_basis,
      search: query.search?.trim(),
      page: query.page,
      limit: query.limit,
    };

    const items = await InterestLoanPlanModel.getAll(filters);

    if (filters.limit) {
      const total = await InterestLoanPlanModel.count(filters);
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10);
      return {
        plans: items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return items;
  },

  /**
   * Get all active plans (quick dropdown usage)
   */
  async getActive() {
    return await InterestLoanPlanModel.getAll({ status: "active" });
  },

  /**
   * Get single plan by ID
   */
  async getById(id) {
    const plan = await InterestLoanPlanModel.findById(id);
    if (!plan) {
      throw { status: 404, message: "Interest loan plan not found" };
    }
    return plan;
  },

  /**
   * Update plan
   */
  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await InterestLoanPlanModel.findById(id, conn);
      if (!existing) {
        throw { status: 404, message: "Interest loan plan not found" };
      }

      // Check uniqueness if updating name
      if (data.plan_name && data.plan_name !== existing.plan_name) {
        const nameExists = await InterestLoanPlanModel.findByName(
          data.plan_name,
          id,
          conn,
        );
        if (nameExists) {
          throw { status: 400, message: "Interest loan plan name already exists" };
        }
      }

      // Check uniqueness if updating code
      if (data.plan_code) {
        data.plan_code = data.plan_code.trim().toUpperCase();
        if (data.plan_code !== existing.plan_code) {
          const codeExists = await InterestLoanPlanModel.findByCode(
            data.plan_code,
            id,
            conn,
          );
          if (codeExists) {
            throw { status: 400, message: "Interest loan plan code already exists" };
          }
        }
      }

      data.updated_by = user?.id || null;

      await InterestLoanPlanModel.update(conn, id, data);
      await conn.commit();

      const updatedPlan = await InterestLoanPlanModel.findById(id);

      return {
        message: "Interest loan plan updated successfully",
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
   * Update status
   */
  async updateStatus(id, status, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await InterestLoanPlanModel.findById(id, conn);
      if (!existing) {
        throw { status: 404, message: "Interest loan plan not found" };
      }

      await InterestLoanPlanModel.updateStatus(conn, id, status, user?.id);
      await conn.commit();

      const updatedPlan = await InterestLoanPlanModel.findById(id);

      return {
        message: `Plan status updated to ${status} successfully`,
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
   * Delete plan
   */
  async delete(id) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await InterestLoanPlanModel.findById(id, conn);
      if (!existing) {
        throw { status: 404, message: "Interest loan plan not found" };
      }

      const inUse = await InterestLoanPlanModel.isPlanInUse(id, conn);
      if (inUse) {
        throw {
          status: 400,
          message: "Cannot delete plan: it is currently linked to one or more interest loans",
        };
      }

      await InterestLoanPlanModel.delete(conn, id);
      await conn.commit();

      return {
        message: "Interest loan plan deleted successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
