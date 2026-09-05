import dayjs from "dayjs";
import { getDB } from "../../../config/db.js";
import { InterestLoanModel } from "./interestLoan.model.js";
import { ScheduleModel } from "../schedule/schedule.model.js";

export const InterestOnlyLoanService = {
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /** 1. VALIDATE CUSTOMER */
      const customer = await InterestLoanModel.getCustomerById(
        data.customer_id,
        conn,
      );
      if (!customer) {
        throw { status: 404, message: "Customer not found" };
      }
      if (customer.status !== "active") {
        throw { status: 400, message: "Customer is inactive" };
      }

      /** 2. VALIDATE PLAN */
      const plan = await InterestLoanModel.getPlanById(
        data.interest_plan_id,
        conn,
      );
      if (!plan) {
        throw { status: 404, message: "Interest-only loan plan not found" };
      }
      if (plan.status !== "active") {
        throw { status: 400, message: "Loan plan is currently inactive" };
      }

      /** 3. MERGE PLAN VALUES WITH OVERRIDES */
      const interest_rate = Number(data.interest_rate ?? plan.interest_value);
      const interest_type = data.interest_type ?? plan.interest_type;
      const frequency = data.interest_frequency ?? plan.interest_frequency;
      const tenure = Number(data.tenure ?? plan.tenure);
      const tenure_type = data.tenure_type ?? plan.tenure_type;
      const principal = Number(data.principal_amount);

      /** 4. COMMISSION CALCULATION */
      let commission_amount = 0;
      if (data.commission_amount !== undefined) {
        commission_amount = Number(data.commission_amount);
      } else if (plan.commission_type === "fixed") {
        commission_amount = Number(plan.commission_value || 0);
      } else if (plan.commission_type === "percentage") {
        commission_amount = Number(
          ((principal * Number(plan.commission_value || 0)) / 100).toFixed(2),
        );
      }
      const net_disbursed_amount = Number(
        (principal - commission_amount).toFixed(2),
      );

      /** 5. CALCULATE TENURE IN MONTHS & FREQUENCY GAPS */
      const totalMonths = tenure_type === "years" ? tenure * 12 : tenure;

      const cycleMap = {
        monthly: 1,
        quarterly: 3,
        half_yearly: 6,
        yearly: 12,
      };
      const gap = cycleMap[frequency] || 1;
      const totalCycles = Math.ceil(totalMonths / gap);

      /** 6. INTEREST CALCULATION PER CYCLE */
      let interestPerCycle = 0;
      if (interest_type === "percentage") {
        interestPerCycle = Number(((principal * interest_rate) / 100).toFixed(2));
      } else {
        interestPerCycle = Number(interest_rate.toFixed(2));
      }

      const totalInterest = Number((interestPerCycle * totalCycles).toFixed(2));
      const totalPayable = Number((principal + totalInterest).toFixed(2));

      /** 7. DATES */
      const startDate = dayjs(data.start_date).format("YYYY-MM-DD");
      const endDate = dayjs(startDate)
        .add(totalMonths, "month")
        .format("YYYY-MM-DD");

      /** 8. GENERATE LOAN NUMBER */
      const loan_no = await InterestLoanModel.generateLoanNo(conn);

      /** 9. INSERT LOAN */
      const loanId = await InterestLoanModel.create(conn, {
        loan_no,
        customer_id: data.customer_id,
        interest_plan_id: data.interest_plan_id,
        principal_amount: principal,
        interest_rate,
        interest_type,
        interest_frequency: frequency,
        tenure,
        tenure_type,
        total_interest: totalInterest,
        total_payable: totalPayable,
        outstanding_interest: totalInterest,
        outstanding_principal: principal,
        start_date: startDate,
        end_date: endDate,
        commission_amount,
        net_disbursed_amount,
        status: data.status || "active",
        created_by: user?.id,
      });

      /** 10. GENERATE SCHEDULES */
      for (let i = 1; i <= totalCycles; i++) {
        const dueDate = dayjs(startDate)
          .add(i * gap, "month")
          .format("YYYY-MM-DD");
        const isLast = i === totalCycles;

        const cycleInterest = interestPerCycle;
        const cyclePrincipal = isLast ? principal : 0;
        const totalDue = Number((cycleInterest + cyclePrincipal).toFixed(2));

        await ScheduleModel.create(conn, {
          loan_id: loanId,
          schedule_no: i,
          due_date: dueDate,
          interest_amount: cycleInterest,
          principal_amount: cyclePrincipal,
          total_due: totalDue,
          paid_amount: 0,
          interest_paid: 0,
          principal_paid: 0,
          balance_amount: totalDue,
          payment_type: isLast ? "interest_and_principal" : "interest",
          status: "pending",
        });
      }

      await conn.commit();

      const createdLoan = await InterestLoanModel.findById(loanId);

      return {
        message: "Interest-only loan created with schedule successfully",
        data: createdLoan,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async regenerateSchedule(loanId, options = {}, user = null) {
    const conn = await getDB().getConnection();
    try {
      await conn.beginTransaction();

      const loan = await InterestLoanModel.findById(loanId, conn);
      if (!loan) {
        throw { status: 404, message: "Interest-only loan not found" };
      }

      if (Number(loan.total_interest_paid || 0) > 0 || Number(loan.total_principal_paid || 0) > 0) {
        throw {
          status: 400,
          message: "Cannot regenerate schedule after payments have been recorded for this loan",
        };
      }

      const frequency = options.interest_frequency || loan.interest_frequency || "monthly";
      const tenure = Number(options.tenure || loan.tenure);
      const tenure_type = options.tenure_type || loan.tenure_type || "months";
      const interest_rate = options.interest_rate !== undefined ? Number(options.interest_rate) : Number(loan.interest_rate);
      const interest_type = options.interest_type || loan.interest_type || "percentage";
      const principal = Number(loan.principal_amount);

      const totalMonths = tenure_type === "years" ? tenure * 12 : tenure;
      const cycleMap = {
        monthly: 1,
        quarterly: 3,
        half_yearly: 6,
        yearly: 12,
      };
      const gap = cycleMap[frequency] || 1;
      const totalCycles = Math.ceil(totalMonths / gap);

      let interestPerCycle = 0;
      if (interest_type === "percentage") {
        interestPerCycle = Number(((principal * interest_rate) / 100).toFixed(2));
      } else {
        interestPerCycle = Number(interest_rate.toFixed(2));
      }

      const totalInterest = Number((interestPerCycle * totalCycles).toFixed(2));
      const totalPayable = Number((principal + totalInterest).toFixed(2));

      const startDate = dayjs(options.start_date || loan.start_date).format("YYYY-MM-DD");
      const endDate = dayjs(startDate).add(totalMonths, "month").format("YYYY-MM-DD");

      // Delete existing schedules
      await ScheduleModel.deleteByLoanId(conn, loanId);

      // Generate new schedules
      for (let i = 1; i <= totalCycles; i++) {
        const dueDate = dayjs(startDate).add(i * gap, "month").format("YYYY-MM-DD");
        const isLast = i === totalCycles;
        const cyclePrincipal = isLast ? principal : 0;
        const totalDue = Number((interestPerCycle + cyclePrincipal).toFixed(2));

        await ScheduleModel.create(conn, {
          loan_id: loanId,
          schedule_no: i,
          due_date: dueDate,
          interest_amount: interestPerCycle,
          principal_amount: cyclePrincipal,
          total_due: totalDue,
          paid_amount: 0,
          interest_paid: 0,
          principal_paid: 0,
          balance_amount: totalDue,
          payment_type: isLast ? "interest_and_principal" : "interest",
          status: "pending",
        });
      }

      // Update loan record
      await conn.query(
        `UPDATE interest_only_loans
         SET interest_frequency = ?,
             tenure = ?,
             tenure_type = ?,
             interest_rate = ?,
             interest_type = ?,
             total_interest = ?,
             total_payable = ?,
             outstanding_interest = ?,
             outstanding_principal = ?,
             end_date = ?,
             updated_by = ?
         WHERE id = ?`,
        [
          frequency,
          tenure,
          tenure_type,
          interest_rate,
          interest_type,
          totalInterest,
          totalPayable,
          totalInterest,
          principal,
          endDate,
          user?.id || null,
          loanId,
        ],
      );

      await conn.commit();

      const updatedLoan = await InterestLoanModel.findById(loanId);
      const schedules = await ScheduleModel.getByLoanId(loanId);

      return {
        message: "Repayment schedule regenerated successfully",
        data: {
          ...updatedLoan,
          schedules,
        },
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll(filters = {}) {
    return await InterestLoanModel.getAll(filters);
  },

  async getById(id) {
    const loan = await InterestLoanModel.findById(id);
    if (!loan) {
      throw { status: 404, message: "Interest-only loan not found" };
    }

    const schedules = await ScheduleModel.getByLoanId(id);
    return {
      ...loan,
      schedules,
    };
  },

  async getByCustomer(customer_id) {
    const customer = await InterestLoanModel.getCustomerById(customer_id);
    if (!customer) {
      throw { status: 404, message: "Customer not found" };
    }
    return await InterestLoanModel.findByCustomerId(customer_id);
  },

  async updateStatus(id, status, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const loan = await InterestLoanModel.findById(id, conn);
      if (!loan) {
        throw { status: 404, message: "Interest-only loan not found" };
      }

      await InterestLoanModel.updateStatus(conn, id, status, user?.id);

      await conn.commit();

      const updated = await InterestLoanModel.findById(id);
      return {
        message: "Loan status updated successfully",
        data: updated,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const loan = await InterestLoanModel.findById(id, conn);
      if (!loan) {
        throw { status: 404, message: "Interest-only loan not found" };
      }

      const paymentsCount = await InterestLoanModel.countPayments(id, conn);
      if (paymentsCount > 0) {
        throw {
          status: 400,
          message:
            "Cannot delete loan with existing payment transactions. Please reverse payments first.",
        };
      }

      await ScheduleModel.deleteByLoanId(conn, id);
      await InterestLoanModel.delete(conn, id);

      await conn.commit();

      return {
        message: "Interest-only loan and its schedules deleted successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
