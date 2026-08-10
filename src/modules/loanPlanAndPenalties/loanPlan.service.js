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

      const plan = await LoanPlanModel.findById(loanPlanId);
      return { message: "Loan plan created", data: plan };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // async update(id, data, user) {
  //   const db = getDB();
  //   const conn = await db.getConnection();

  //   try {
  //     await conn.beginTransaction();

  //     // 🔹 CRUD check: verify plan exists before updating
  //     const existing = await LoanPlanModel.findById(id);
  //     if (!existing) {
  //       throw { status: 404, message: "Loan plan not found" };
  //     }

  //     // 🔹 CRUD check: prevent duplicate plan_code (excluding current record)
  //     if (data.plan_code) {
  //       const dupCode = await LoanPlanModel.findByCode(conn, data.plan_code);
  //       if (dupCode && Number(dupCode.id) !== Number(existing.id)) {
  //         throw { status: 400, message: "Loan plan code already exists" };
  //       }
  //     }

  //     // 🔹 CRUD check: prevent duplicate plan_name (excluding current record)
  //     if (data.plan_name) {
  //       const dupName = await LoanPlanModel.findByName(conn, data.plan_name);
  //       if (dupName && Number(dupName.id) !== Number(existing.id)) {
  //         throw { status: 400, message: "Loan plan name already exists" };
  //       }
  //     }

  //     await LoanPlanModel.update(conn, id, {
  //       ...data,
  //       updated_by: user.id,
  //     });

  //     if (data.penalty) {
  //       await LoanPlanPenaltyModel.upsert(conn, id, data.penalty);
  //     }

  //     await conn.commit();

  //     const updatedPlan = await LoanPlanModel.findById(id);
  //     return { message: "Loan plan updated", data: updatedPlan };
  //   } catch (err) {
  //     await conn.rollback();
  //     throw err;
  //   } finally {
  //     conn.release();
  //   }
  // },

  /* -----------------------------------*/

  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* -----------------------------------------
       1. CHECK PLAN EXISTS
    ----------------------------------------- */
      const existing = await LoanPlanModel.findById(id);

      if (!existing) {
        throw { status: 404, message: "Loan plan not found" };
      }

      /* -----------------------------------------
       2. CHECK IF PLAN IS USED
    ----------------------------------------- */
      const [[usage]] = await conn.query(
        `SELECT COUNT(*) AS count FROM loans WHERE loan_plan_id = ?`,
        [id],
      );

      const isUsed = usage.count > 0;

      /* -----------------------------------------
       3. DUPLICATE CHECKS
    ----------------------------------------- */
      if (data.plan_code) {
        const dupCode = await LoanPlanModel.findByCode(conn, data.plan_code);
        if (dupCode && Number(dupCode.id) !== Number(existing.id)) {
          throw { status: 400, message: "Loan plan code already exists" };
        }
      }

      if (data.plan_name) {
        const dupName = await LoanPlanModel.findByName(conn, data.plan_name);
        if (dupName && Number(dupName.id) !== Number(existing.id)) {
          throw { status: 400, message: "Loan plan name already exists" };
        }
      }

      /* -----------------------------------------
       4. BLOCK CRITICAL CHANGES IF USED
    ----------------------------------------- */
      if (isUsed) {
        const restrictedFields = [
          "collection_frequency",
          "tenure",
          "tenure_type",
          "commission_type",
          "commission_value",
        ];

        const penaltyChange = data.penalty ? true : false;

        const attemptedRestricted = restrictedFields.some(
          (field) => data[field] !== undefined,
        );

        if (attemptedRestricted || penaltyChange) {
          throw {
            status: 400,
            message:
              "This loan plan is already used. Core fields cannot be modified",
          };
        }
      }

      /* -----------------------------------------
       5. UPDATE PLAN
    ----------------------------------------- */
      await LoanPlanModel.update(conn, id, {
        ...data,
        updated_by: user.id,
      });

      /* -----------------------------------------
       6. UPDATE PENALTY (ONLY IF NOT USED)
    ----------------------------------------- */
      if (data.penalty && !isUsed) {
        await LoanPlanPenaltyModel.upsert(conn, id, data.penalty);
      }

      await conn.commit();

      const updatedPlan = await LoanPlanModel.findById(id);

      return {
        message: isUsed
          ? "Loan plan updated (limited fields only)"
          : "Loan plan updated",
        data: updatedPlan,
      };
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

  // async delete(id) {
  //   // 🔹 CRUD check: verify plan exists before deleting
  //   const existing = await LoanPlanModel.findById(id);
  //   if (!existing) {
  //     throw { status: 404, message: "Loan plan not found" };
  //   }

  //   await LoanPlanModel.delete(id);

  //   return { message: "Loan plan deleted" };
  // },

  async delete(id) {
    const db = getDB();

    /* --------------------------------------------------
     1. CHECK PLAN EXISTS
  -------------------------------------------------- */
    const existing = await LoanPlanModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Loan plan not found" };
    }

    /* --------------------------------------------------
     2. CHECK IF USED IN LOANS
  -------------------------------------------------- */
    const [[loanUsage]] = await db.query(
      `
    SELECT COUNT(*) AS count
    FROM loans
    WHERE loan_plan_id = ?
    `,
      [id],
    );

    if (loanUsage.count > 0) {

      /* ❗ DO NOT DELETE — in-use plan: soft-deactivate instead */
      await LoanPlanModel.update(db, id, {
        status: "inactive",
        updated_by: null, // no user context in delete path
      });

      return {
        message:
          "Loan plan is in use. Status set to inactive instead of deleting",
        deactivated: true,
      };
    }

    /* --------------------------------------------------
     3. SAFE TO DELETE
  -------------------------------------------------- */

    await LoanPlanModel.delete(id);

    return {
      message: "Loan plan deleted successfully",
    };
  },
};
