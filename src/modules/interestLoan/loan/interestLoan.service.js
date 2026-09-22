import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import { getDB } from "../../../config/db.js";
import { InterestLoanModel } from "./interestLoan.model.js";
import { InterestLoanPlanModel } from "../plan/interestLoanPlan.model.js";
import { InterestLoanPeriodModel } from "../period/interestLoanPeriod.model.js";

dayjs.extend(isSameOrAfter);

export const InterestLoanService = {
  /**
   * Helper to compute next period end date based on frequency
   */
  computeNextInterestDate(startDate, frequency) {
    const start = dayjs(startDate);
    switch (frequency?.toLowerCase()) {
      case "daily":
        return start.add(1, "day").format("YYYY-MM-DD");
      case "weekly":
        return start.add(1, "week").format("YYYY-MM-DD");
      case "yearly":
        return start.add(1, "year").format("YYYY-MM-DD");
      case "monthly":
      default:
        return start.add(1, "month").format("YYYY-MM-DD");
    }
  },

  /**
   * Helper to calculate period interest amount
   */
  calculateInterestAmount(principal, rate, type) {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    if (type === "percentage") {
      return parseFloat(((p * r) / 100).toFixed(2));
    }
    return parseFloat(r.toFixed(2));
  },

  /**
   * CREATE INTEREST LOAN (Professional & Automated)
   * Automatically:
   * - Generates sequential loan_no (INTL-000001)
   * - Snapshots plan configuration into loan
   * - Computes next_interest_date
   * - Sets status to 'active'
   * - Automatically generates Period 1 in interest_loan_periods
   */
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Verify customer
      const [customerRows] = await conn.query(
        `SELECT id, first_name, last_name, status FROM customers WHERE id = ?`,
        [data.customer_id],
      );
      if (customerRows.length === 0) {
        throw { status: 404, message: "Customer not found" };
      }
      if (customerRows[0].status !== "active") {
        throw {
          status: 400,
          message: `Customer account is ${customerRows[0].status}. Loans can only be opened for active customers.`,
        };
      }

      // 2. Verify interest plan
      const plan = await InterestLoanPlanModel.findById(
        data.interest_plan_id,
        conn,
      );
      if (!plan) {
        throw { status: 404, message: "Interest loan plan not found" };
      }
      if (plan.status !== "active") {
        throw {
          status: 400,
          message: "Selected interest loan plan is inactive and cannot be assigned",
        };
      }

      // 3. Prepare dates and values
      const startDate = dayjs(data.start_date).format("YYYY-MM-DD");
      const nextInterestDate = this.computeNextInterestDate(
        startDate,
        plan.interest_frequency,
      );
      const principal = parseFloat(data.principal_amount);
      const interestAmount = this.calculateInterestAmount(
        principal,
        plan.interest_value,
        plan.interest_type,
      );

      // 4. Generate sequential loan number
      const loanNo = await InterestLoanModel.generateLoanNo(conn);

      // 5. Insert loan record (status is automatically 'active')
      const loanId = await InterestLoanModel.create(conn, {
        loan_no: loanNo,
        customer_id: data.customer_id,
        interest_plan_id: data.interest_plan_id,
        principal_amount: principal,
        outstanding_principal: principal,
        total_interest_accrued: 0.0,
        total_interest_paid: 0.0,
        total_principal_paid: 0.0,
        outstanding_interest: 0.0,
        interest_type: plan.interest_type,
        interest_rate: plan.interest_value,
        interest_frequency: plan.interest_frequency,
        calculation_method: plan.calculation_method,
        principal_basis: plan.principal_basis,
        start_date: startDate,
        last_interest_date: null,
        next_interest_date: nextInterestDate,
        remarks: data.remarks ?? null,
        created_by: user?.id || 1,
      });

      // 6. Open-ended loans generate periods only when due.
      // If the loan is backdated and the first cycle due date has already arrived, generate Period 1 immediately.
      const isDue = dayjs().isSameOrAfter(dayjs(nextInterestDate), "day");
      if (isDue) {
        await InterestLoanPeriodModel.create(conn, {
          loan_id: loanId,
          period_no: 1,
          period_start_date: startDate,
          period_end_date: nextInterestDate,
          scheduled_date: nextInterestDate,
          opening_principal: principal,
          interest_rate: plan.interest_value,
          interest_amount: interestAmount,
          paid_interest_amount: 0.0,
          outstanding_interest_amount: interestAmount,
          status: "due",
        });

        // Update loan total accrued & outstanding interest for backdated due period
        await conn.query(
          `UPDATE interest_loans 
           SET total_interest_accrued = ?, outstanding_interest = ?, last_interest_date = ? 
           WHERE id = ?`,
          [interestAmount, interestAmount, nextInterestDate, loanId]
        );
      }

      await conn.commit();

      // Retrieve full newly created loan with periods
      const newLoan = await this.getById(loanId);

      return {
        message: "Interest loan created successfully",
        data: newLoan,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * GET ALL LOANS (With filters & pagination)
   */
    /**
   * GET PORTFOLIO SUMMARY METRICS
   */
  async getSummary() {
    await InterestLoanPeriodModel.syncDueStatuses();
    return await InterestLoanModel.getSummary();
  },

  async getAll(query = {}) {
    // Automatically synchronize any due periods based on current calendar date
    await InterestLoanPeriodModel.syncDueStatuses();

    const filters = {
      status: query.status,
      customer_id: query.customer_id,
      interest_plan_id: query.interest_plan_id,
      interest_frequency: query.interest_frequency,
      from_date: query.from_date,
      to_date: query.to_date,
      search: query.search?.trim(),
      page: query.page,
      limit: query.limit,
    };

    const loans = await InterestLoanModel.getAll(filters);

    if (filters.limit) {
      const total = await InterestLoanModel.count(filters);
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10);
      return {
        loans,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return loans;
  },

  /**
   * GET LOAN BY ID (Includes schedule & periods)
   */
  async getById(id) {
    // Sync due statuses for this loan
    await InterestLoanPeriodModel.syncDueStatuses(id);

    const loan = await InterestLoanModel.findById(id);
    if (!loan) {
      throw { status: 404, message: "Interest loan not found" };
    }

    const periods = await InterestLoanPeriodModel.getByLoanId(id);
    return {
      ...loan,
      periods,
    };
  },

  /**
   * GET LOANS BY CUSTOMER ID
   */
  async getByCustomer(customer_id) {
    const loans = await InterestLoanModel.findByCustomer(customer_id);
    return loans;
  },

  /**
   * GET PORTFOLIO SUMMARY METRICS
   */
  async getSummary() {
    return await InterestLoanModel.getSummary();
  },

  /**
   * UPDATE INTEREST LOAN
   * Business Rules:
   * - If payments have been made:
   *   - Prohibit editing principal_amount, start_date, interest_plan_id.
   *   - Only non-financial details (remarks) can be updated.
   * - If no payments have been made:
   *   - Allow updating principal_amount, start_date, interest_plan_id, remarks.
   *   - Recompute next_interest_date and Period 1 opening principal, interest amount, and dates.
   */
  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Fetch loan with lock
      const [loanRows] = await conn.query(
        `SELECT * FROM interest_loans WHERE id = ? FOR UPDATE`,
        [id],
      );
      if (loanRows.length === 0) {
        throw { status: 404, message: "Interest loan not found" };
      }
      const existing = loanRows[0];

      if (["completed", "closed", "cancelled"].includes(existing.status)) {
        throw {
          status: 400,
          message: `Cannot update loan with status '${existing.status}'`,
        };
      }

      // 2. Check payments
      const hasPayment = await InterestLoanModel.hasPayments(conn, id);

      if (hasPayment) {
        // Disallow modifying financial terms
        const isPrincipalChanged =
          data.principal_amount !== undefined &&
          parseFloat(data.principal_amount) !==
            parseFloat(existing.principal_amount);

        const isStartDateChanged =
          data.start_date !== undefined &&
          dayjs(data.start_date).format("YYYY-MM-DD") !==
            dayjs(existing.start_date).format("YYYY-MM-DD");

        const isPlanChanged =
          data.interest_plan_id !== undefined &&
          Number(data.interest_plan_id) !== Number(existing.interest_plan_id);

        if (isPrincipalChanged || isStartDateChanged || isPlanChanged) {
          throw {
            status: 400,
            message:
              "Cannot modify principal amount, start date, or loan plan because payments have already been recorded for this loan.",
          };
        }

        // Only remarks can be updated
        if (data.remarks !== undefined) {
          await InterestLoanModel.update(conn, id, {
            remarks: data.remarks,
            updated_by: user?.id || null,
          });
        }
      } else {
        // No payments have been recorded yet -> can update financial parameters and recalculate Period 1
        let plan = null;
        if (
          data.interest_plan_id &&
          Number(data.interest_plan_id) !== Number(existing.interest_plan_id)
        ) {
          plan = await InterestLoanPlanModel.findById(
            data.interest_plan_id,
            conn,
          );
          if (!plan) {
            throw { status: 404, message: "Interest loan plan not found" };
          }
          if (plan.status !== "active") {
            throw {
              status: 400,
              message:
                "Selected interest loan plan is inactive and cannot be assigned",
            };
          }
        }

        const newPrincipal =
          data.principal_amount !== undefined
            ? parseFloat(data.principal_amount)
            : parseFloat(existing.principal_amount);

        const newStartDate =
          data.start_date !== undefined
            ? dayjs(data.start_date).format("YYYY-MM-DD")
            : dayjs(existing.start_date).format("YYYY-MM-DD");

        const newFrequency = plan
          ? plan.interest_frequency
          : existing.interest_frequency;
        const newRate = plan ? plan.interest_value : existing.interest_rate;
        const newType = plan ? plan.interest_type : existing.interest_type;
        const newCalcMethod = plan
          ? plan.calculation_method
          : existing.calculation_method;
        const newBasis = plan ? plan.principal_basis : existing.principal_basis;

        const newNextInterestDate = this.computeNextInterestDate(
          newStartDate,
          newFrequency,
        );
        const newInterestAmount = this.calculateInterestAmount(
          newPrincipal,
          newRate,
          newType,
        );

        const updatePayload = {
          principal_amount: newPrincipal,
          outstanding_principal: newPrincipal,
          start_date: newStartDate,
          next_interest_date: newNextInterestDate,
          remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
          updated_by: user?.id || null,
        };

        if (plan) {
          updatePayload.interest_plan_id = plan.id;
          updatePayload.interest_type = newType;
          updatePayload.interest_rate = newRate;
          updatePayload.interest_frequency = newFrequency;
          updatePayload.calculation_method = newCalcMethod;
          updatePayload.principal_basis = newBasis;
        }

        await InterestLoanModel.update(conn, id, updatePayload);

        // Recalculate Period 1
        const isDue = dayjs().isSameOrAfter(dayjs(newNextInterestDate), "day");
        await InterestLoanPeriodModel.updatePeriod1(conn, id, {
          period_start_date: newStartDate,
          period_end_date: newNextInterestDate,
          scheduled_date: newNextInterestDate,
          opening_principal: newPrincipal,
          interest_rate: newRate,
          interest_amount: newInterestAmount,
          outstanding_interest_amount: newInterestAmount,
          status: isDue ? "due" : "pending",
        });
      }

      await conn.commit();

      const updated = await this.getById(id);
      return {
        message: "Interest loan updated successfully",
        data: updated,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * DELETE INTEREST LOAN
   * Business Rules:
   * - Prohibit deletion if ANY payment has been recorded in interest_loan_payments
   *   or paid amounts / partial / paid periods exist.
   */
  async delete(id) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [loanRows] = await conn.query(
        `SELECT * FROM interest_loans WHERE id = ? FOR UPDATE`,
        [id],
      );
      if (loanRows.length === 0) {
        throw { status: 404, message: "Interest loan not found" };
      }

      // Check payments
      const hasPayment = await InterestLoanModel.hasPayments(conn, id);
      if (hasPayment) {
        throw {
          status: 400,
          message:
            "Cannot delete loan: payments have already been recorded for this loan. Financial accounting history cannot be deleted.",
        };
      }

      // Delete associated uncollected period(s)
      await InterestLoanPeriodModel.deleteByLoanId(id, conn);

      // Delete the loan
      await InterestLoanModel.delete(conn, id);

      await conn.commit();

      return {
        message: "Interest loan deleted successfully",
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
