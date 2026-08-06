import { getDB } from "../../config/db.js";
import { LoanModel } from "./loan.model.js";

export const LoanService = {
  /* ==========================================================
      CREATE LOAN
  ========================================================== */

  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* -----------------------------------------
         CUSTOMER VALIDATION
      ----------------------------------------- */

      const customer = await LoanModel.findCustomerById(conn, data.customer_id);

      if (!customer) {
        throw {
          status: 404,
          message: "Customer not found",
        };
      }

      if (customer.status !== "active") {
        throw {
          status: 400,
          message: "Customer is inactive",
        };
      }

      /* -----------------------------------------
         LOAN PLAN VALIDATION
      ----------------------------------------- */

      const plan = await LoanModel.findLoanPlanById(conn, data.loan_plan_id);

      if (!plan) {
        throw {
          status: 404,
          message: "Loan plan not found",
        };
      }

      /* -----------------------------------------
         LOAN NUMBER
      ----------------------------------------- */

      const loan_no = await LoanModel.generateLoanNo(conn);

      /* -----------------------------------------
         COMMISSION
      ----------------------------------------- */

      let commission_amount = 0;

      if (plan.commission_type === "fixed") {
        commission_amount = Number(plan.commission_value);
      } else {
        commission_amount =
          (Number(data.loan_amount) * Number(plan.commission_value)) / 100;
      }

      commission_amount = Number(commission_amount.toFixed(2));

      /* -----------------------------------------
         NET DISBURSED
      ----------------------------------------- */

      const net_disbursed_amount = Number(
        (Number(data.loan_amount) - commission_amount).toFixed(2),
      );

      /* -----------------------------------------
         TOTAL REPAYMENT

         (Current table has only commission.
         No interest column exists.)
      ----------------------------------------- */

      const total_repayment = Number(data.loan_amount);

      /* -----------------------------------------
         INSTALLMENT
      ----------------------------------------- */

      const installment_amount = Number(
        (total_repayment / Number(plan.tenure)).toFixed(2),
      );

      /* -----------------------------------------
         END DATE
      ----------------------------------------- */

      const endDate = new Date(data.start_date);

      switch (plan.tenure_type) {
        case "days":
          endDate.setDate(endDate.getDate() + Number(plan.tenure));
          break;

        case "weeks":
          endDate.setDate(endDate.getDate() + Number(plan.tenure) * 7);
          break;

        case "months":
          endDate.setMonth(endDate.getMonth() + Number(plan.tenure));
          break;

        default:
          throw {
            status: 400,
            message: "Invalid tenure type",
          };
      }

      const end_date = endDate.toISOString().split("T")[0];

      /* -----------------------------------------
         INSERT
      ----------------------------------------- */

      const loanId = await LoanModel.create(conn, {
        loan_no,

        customer_id: data.customer_id,
        loan_plan_id: data.loan_plan_id,

        loan_amount: Number(data.loan_amount),

        commission_amount,

        net_disbursed_amount,

        installment_amount,

        total_repayment,

        start_date: data.start_date,

        end_date,

        created_by: user.id,

        updated_by: user.id,

        status: data.status || "active",
      });

      await conn.commit();

      return {
        message: "Loan created successfully",
        id: loanId,
        loan_no,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* ==========================================================
    UPDATE LOAN
========================================================== */

  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* -----------------------------------------
       CHECK LOAN EXISTS
    ----------------------------------------- */

      const loan = await LoanModel.findById(conn, id);

      if (!loan) {
        throw {
          status: 404,
          message: "Loan not found",
        };
      }

      /* -----------------------------------------
       CUSTOMER VALIDATION
    ----------------------------------------- */

      const customer = await LoanModel.findCustomerById(conn, data.customer_id);

      if (!customer) {
        throw {
          status: 404,
          message: "Customer not found",
        };
      }

      if (customer.status !== "active") {
        throw {
          status: 400,
          message: "Customer is inactive",
        };
      }

      /* -----------------------------------------
       LOAN PLAN VALIDATION
    ----------------------------------------- */

      const plan = await LoanModel.findLoanPlanById(conn, data.loan_plan_id);

      if (!plan) {
        throw {
          status: 404,
          message: "Loan plan not found",
        };
      }

      /* -----------------------------------------
       COMMISSION CALCULATION
    ----------------------------------------- */

      let commission_amount = 0;

      if (plan.commission_type === "fixed") {
        commission_amount = Number(plan.commission_value);
      } else {
        commission_amount =
          (Number(data.loan_amount) * Number(plan.commission_value)) / 100;
      }

      commission_amount = Number(commission_amount.toFixed(2));

      /* -----------------------------------------
       NET DISBURSED
    ----------------------------------------- */

      const net_disbursed_amount = Number(
        (Number(data.loan_amount) - commission_amount).toFixed(2),
      );

      /* -----------------------------------------
       TOTAL REPAYMENT
    ----------------------------------------- */

      const total_repayment = Number(data.loan_amount);

      /* -----------------------------------------
       INSTALLMENT
    ----------------------------------------- */

      const installment_amount = Number(
        (total_repayment / Number(plan.tenure)).toFixed(2),
      );

      /* -----------------------------------------
       END DATE
    ----------------------------------------- */

      const endDate = new Date(data.start_date);

      switch (plan.tenure_type) {
        case "days":
          endDate.setDate(endDate.getDate() + Number(plan.tenure));
          break;

        case "weeks":
          endDate.setDate(endDate.getDate() + Number(plan.tenure * 7));
          break;

        case "months":
          endDate.setMonth(endDate.getMonth() + Number(plan.tenure));
          break;

        default:
          throw {
            status: 400,
            message: "Invalid tenure type",
          };
      }

      const end_date = endDate.toISOString().split("T")[0];

      /* -----------------------------------------
       UPDATE
    ----------------------------------------- */

      const affected = await LoanModel.update(conn, id, {
        customer_id: data.customer_id,

        loan_plan_id: data.loan_plan_id,

        loan_amount: Number(data.loan_amount),

        commission_amount,

        net_disbursed_amount,

        installment_amount,

        total_repayment,

        start_date: data.start_date,

        end_date,

        updated_by: user.id,

        status: data.status || "active",
      });

      if (!affected) {
        throw {
          status: 400,
          message: "Loan update failed",
        };
      }

      await conn.commit();

      return {
        message: "Loan updated successfully",
        id,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* ==========================================================
      GET ALL
  ========================================================== */

  async getAll(query) {
    const db = getDB();
    const loans = await LoanModel.findAll(db, query);

    return loans;
  },

  /* ==========================================================
      GET BY ID
  ========================================================== */

  async getById(id) {
    const loan = await LoanModel.findById(getDB(), id);

    if (!loan) {
      throw {
        status: 404,
        message: "Loan not found",
      };
    }

    return loan;
  },

  /* ==========================================================
      UPDATE STATUS
  ========================================================== */

  async updateStatus(id, status, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const loan = await LoanModel.findById(conn, id);

      if (!loan) {
        throw {
          status: 404,
          message: "Loan not found",
        };
      }

      const affected = await LoanModel.updateStatus(conn, id, status, user.id);

      if (!affected) {
        throw {
          status: 400,
          message: "Loan status update failed",
        };
      }

      await conn.commit();

      return {
        message: "Loan status updated successfully",
        id,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* ==========================================================
      DELETE
  ========================================================== */

  async delete(id) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const loan = await LoanModel.findById(conn, id);

      if (!loan) {
        throw {
          status: 404,
          message: "Loan not found",
        };
      }

      const affected = await LoanModel.delete(conn, id);

      if (!affected) {
        throw {
          status: 400,
          message: "Loan deletion failed",
        };
      }

      await conn.commit();

      return {
        message: "Loan deleted successfully",
        id,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
