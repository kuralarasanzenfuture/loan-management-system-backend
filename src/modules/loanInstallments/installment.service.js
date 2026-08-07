// installment.service.js

import { getDB } from "../../config/db.js";
import LoanInstallmentModel from "./installment.model.js";

const LoanInstallmentService = {
  async generateForLoan(conn, loan, plan) {
    const tenure = Number(plan.tenure);

    if (!Number.isInteger(tenure) || tenure <= 0) {
      throw {
        status: 400,
        message: "Invalid loan plan tenure",
      };
    }

    const totalRepayment = Number(loan.total_repayment);

    if (totalRepayment <= 0) {
      throw {
        status: 400,
        message: "Invalid total repayment",
      };
    }

    /*
     * Determine installment count.
     *
     * Example:
     *
     * daily + 30 days = 30 installments
     * weekly + 12 weeks = 12 installments
     * monthly + 12 months = 12 installments
     */

    let installmentCount = tenure;

    /*
     * Calculate normal installment.
     */

    const normalAmount = Number((totalRepayment / installmentCount).toFixed(2));

    /*
     * Difference caused by decimal rounding.
     *
     * Example:
     * 100 / 3
     *
     * 33.33
     * 33.33
     * 33.34
     */

    let remaining = totalRepayment;

    const installments = [];

    let currentDate = new Date(loan.start_date);

    for (let i = 1; i <= installmentCount; i++) {
      /*
       * Calculate due date
       */

      const dueDate = new Date(currentDate);

      switch (plan.collection_frequency) {
        case "daily":
          dueDate.setDate(dueDate.getDate() + i - 1);
          break;

        case "weekly":
          dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
          break;

        case "monthly":
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          break;

        default:
          throw {
            status: 400,
            message: "Invalid collection frequency",
          };
      }

      const due_date = dueDate.toISOString().split("T")[0];

      /*
       * Last installment gets rounding difference.
       */

      let principal_amount;

      if (i === installmentCount) {
        principal_amount = Number(remaining.toFixed(2));
      } else {
        principal_amount = normalAmount;
      }

      remaining = Number((remaining - principal_amount).toFixed(2));

      installments.push({
        loan_id: loan.id,

        installment_no: i,

        due_date,

        principal_amount,

        penalty_amount: 0,

        total_due: principal_amount,

        paid_amount: 0,

        balance_amount: principal_amount,

        paid_date: null,

        status: "pending",
      });
    }

    await LoanInstallmentModel.createMany(conn, installments);

    return installments;
  },
};

export default LoanInstallmentService;
