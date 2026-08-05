import { getDB } from "../../config/db.js";
import { LoanPlanModel, LoanPlanPenaltyModel } from "./loanPlan.model.js";

export const LoanPlanService = {
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 🔹 CRUD check: prevent duplicate plan_code
      const existingCode = await LoanPlanModel.findByCode(conn, data.plan_code);
      if (existingCode) {
        throw { status: 400, message: "Loan plan code already exists" };
      }

      // 🔹 CRUD check: prevent duplicate plan_name
      const existingName = await LoanPlanModel.findByName(conn, data.plan_name);
      if (existingName) {
        throw { status: 400, message: "Loan plan name already exists" };
      }

      const loanPlanId = await LoanPlanModel.create(conn, {
        ...data,
        created_by: user.id,
      });

      if (data.penalty) {
        await LoanPlanPenaltyModel.upsert(conn, loanPlanId, data.penalty);
      }

      await conn.commit();

      return { message: "Loan plan created", id: loanPlanId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 🔹 CRUD check: verify plan exists before updating
      const existing = await LoanPlanModel.findById(id);
      if (!existing) {
        throw { status: 404, message: "Loan plan not found" };
      }

      // 🔹 CRUD check: prevent duplicate plan_code (excluding current record)
      if (data.plan_code) {
        const dupCode = await LoanPlanModel.findByCode(conn, data.plan_code);
        if (dupCode && dupCode.id !== existing.id) {
          throw { status: 400, message: "Loan plan code already exists" };
        }
      }

      // 🔹 CRUD check: prevent duplicate plan_name (excluding current record)
      if (data.plan_name) {
        const dupName = await LoanPlanModel.findByName(conn, data.plan_name);
        if (dupName && dupName.id !== existing.id) {
          throw { status: 400, message: "Loan plan name already exists" };
        }
      }

      await LoanPlanModel.update(conn, id, {
        ...data,
        updated_by: user.id,
      });

      if (data.penalty) {
        await LoanPlanPenaltyModel.upsert(conn, id, data.penalty);
      }

      await conn.commit();

      return { message: "Loan plan updated", id };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll() {
    return LoanPlanModel.findAll();
  },

  async getById(id) {
    const row = await LoanPlanModel.findById(id);
    if (!row) throw { status: 404, message: "Loan plan not found" };
    return row;
  },

  async delete(id) {
    // 🔹 CRUD check: verify plan exists before deleting
    const existing = await LoanPlanModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Loan plan not found" };
    }

    await LoanPlanModel.delete(id);

    return { message: "Loan plan deleted" };
  },
};
