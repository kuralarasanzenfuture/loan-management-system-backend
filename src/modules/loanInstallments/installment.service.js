import { getDB } from "../../config/db.js";
import LoanInstallmentModel from "./installment.model.js";
import { LoanModel } from "../customersLoan/loan.model.js";

const LoanInstallmentService = {
  /* =========================================================
     GENERATE INSTALLMENTS FOR A NEW LOAN
  ========================================================= */

  async generateForLoan(conn, loan, plan) {
    const tenure = Number(plan.tenure);

    if (!Number.isInteger(tenure) || tenure <= 0) {
      throw {
        status: 400,
        message: "Invalid loan plan tenure",
      };
    }

    const totalRepayment = Number(loan.total_repayment);

    if (!Number.isFinite(totalRepayment) || totalRepayment <= 0) {
      throw {
        status: 400,
        message: "Invalid total repayment",
      };
    }

    if (!loan.start_date) {
      throw {
        status: 400,
        message: "Loan start date is required",
      };
    }

    if (!["daily", "weekly", "monthly"].includes(plan.collection_frequency)) {
      throw {
        status: 400,
        message: "Invalid collection frequency",
      };
    }

    const installmentCount = tenure;

    const normalAmount = Number((totalRepayment / installmentCount).toFixed(2));

    let remaining = totalRepayment;

    const installments = [];

    for (let i = 1; i <= installmentCount; i++) {
      const dueDate = new Date(loan.start_date);

      switch (plan.collection_frequency) {
        case "daily":
          dueDate.setDate(dueDate.getDate() + (i - 1));
          break;

        case "weekly":
          dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
          break;

        case "monthly":
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          break;
      }

      const due_date = dueDate.toISOString().split("T")[0];

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

  /* =========================================================
     GET ALL INSTALLMENTS BY LOAN
  ========================================================= */

  async getByLoan(loanId) {
    const db = getDB();

    const [loanRows] = await db.query(
      `
      SELECT
        id,
        loan_no,
        customer_id,
        loan_plan_id,
        loan_amount,
        total_repayment,
        installment_amount,
        start_date,
        end_date,
        status
      FROM loans
      WHERE id = ?
      `,
      [loanId],
    );

    const loan = loanRows[0];

    if (!loan) {
      throw {
        status: 404,
        message: "Loan not found",
      };
    }

    const installments = await LoanInstallmentModel.findByLoanId(loanId);

    return {
      loan,
      summary: this.calculateSummary(installments),
      installments,
    };
  },

  /* =========================================================
     GET SINGLE INSTALLMENT
  ========================================================= */

  async getById(id) {
    const installment = await LoanInstallmentModel.findById(id);

    if (!installment) {
      throw {
        status: 404,
        message: "Installment not found",
      };
    }

    return installment;
  },

  /* =========================================================
     UPDATE INSTALLMENT / PAYMENT
  ========================================================= */

  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /*
       * Find installment
       */

      const installment = await LoanInstallmentModel.findById(conn, id);

      if (!installment) {
        throw {
          status: 404,
          message: "Installment not found",
        };
      }

      /*
       * Current values
       */

      const currentPaid = Number(installment.paid_amount || 0);

      const currentPenalty = Number(installment.penalty_amount || 0);

      /*
       * New paid amount
       */

      const paidAmount =
        data.paid_amount !== undefined ? Number(data.paid_amount) : currentPaid;

      /*
       * New penalty
       */

      const penaltyAmount =
        data.penalty_amount !== undefined
          ? Number(data.penalty_amount)
          : currentPenalty;

      if (!Number.isFinite(paidAmount) || paidAmount < 0) {
        throw {
          status: 400,
          message: "Invalid paid amount",
        };
      }

      if (!Number.isFinite(penaltyAmount) || penaltyAmount < 0) {
        throw {
          status: 400,
          message: "Invalid penalty amount",
        };
      }

      /*
       * Principal should NEVER change here.
       */

      const principalAmount = Number(installment.principal_amount);

      /*
       * Calculate total due
       */

      const totalDue = Number((principalAmount + penaltyAmount).toFixed(2));

      /*
       * Prevent overpayment
       */

      if (paidAmount > totalDue) {
        throw {
          status: 400,
          message: "Paid amount cannot exceed total due",
        };
      }

      /*
       * Calculate balance
       */

      const balanceAmount = Number((totalDue - paidAmount).toFixed(2));

      /*
       * Calculate status automatically
       */

      let status;

      if (paidAmount === 0) {
        status = "pending";
      } else if (paidAmount < totalDue) {
        status = "partial";
      } else {
        status = "paid";
      }

      /*
       * Paid date
       */

      let paidDate = null;

      if (status === "paid") {
        paidDate = data.paid_date || new Date().toISOString().split("T")[0];
      }

      /*
       * Partial payment should not have paid_date
       */

      if (status !== "paid") {
        paidDate = null;
      }

      /*
       * Update
       */

      await LoanInstallmentModel.update(conn, id, {
        penalty_amount: penaltyAmount,
        total_due: totalDue,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        paid_date: paidDate,
        status,
      });

      await conn.commit();

      /*
       * Return latest record
       */

      const updated = await LoanInstallmentModel.findById(db, id);

      return {
        message: "Installment updated successfully",

        installment: updated,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =========================================================
     ADD PAYMENT
     Recommended endpoint for payment
  ========================================================= */

  async addPayment(id, paymentData, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const installment = await LoanInstallmentModel.findById(conn, id);

      if (!installment) {
        throw {
          status: 404,
          message: "Installment not found",
        };
      }

      const amount =
        typeof paymentData === "object"
          ? Number(paymentData.payment_amount || paymentData.paid_amount || 0)
          : Number(paymentData);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw {
          status: 400,
          message: "Payment amount must be greater than 0",
        };
      }

      const currentPaid = Number(installment.paid_amount || 0);
      const totalDue = Number(installment.total_due);
      const newPaidAmount = Number((currentPaid + amount).toFixed(2));

      if (newPaidAmount > totalDue) {
        throw {
          status: 400,
          message: "Payment exceeds installment balance",
        };
      }

      const balanceAmount = Number((totalDue - newPaidAmount).toFixed(2));

      let status;
      if (newPaidAmount === totalDue) {
        status = "paid";
      } else {
        status = "partial";
      }

      let paidDate = null;
      if (typeof paymentData === "object" && paymentData.paid_date) {
        paidDate = paymentData.paid_date;
      } else if (status === "paid") {
        paidDate = new Date().toISOString().split("T")[0];
      }

      await LoanInstallmentModel.update(conn, id, {
        penalty_amount: installment.penalty_amount,
        total_due: totalDue,
        paid_amount: newPaidAmount,
        balance_amount: balanceAmount,
        paid_date: paidDate,
        status,
      });

      // If all installments for this loan are now paid, update loan status
      const [allInsts] = await conn.query(
        "SELECT id, status FROM loan_installments WHERE loan_id = ?",
        [installment.loan_id],
      );
      const allPaid =
        allInsts.length > 0 &&
        allInsts.every(
          (i) => i.status === "paid" || (i.id === id && status === "paid"),
        );
      if (allPaid) {
        await conn.query("UPDATE loans SET status = 'completed' WHERE id = ?", [
          installment.loan_id,
        ]);
      }

      await conn.commit();

      const updated = await LoanInstallmentModel.findById(db, id);

      return {
        message: "Payment recorded successfully",
        installment: updated,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =========================================================
     DELETE / REGENERATE PROTECTION
  ========================================================= */

  async canRegenerate(loanId) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      return !(await LoanInstallmentModel.hasPayments(conn, loanId));
    } finally {
      conn.release();
    }
  },

  /* =========================================================
     REGENERATE INSTALLMENTS
     
     ONLY ALLOWED BEFORE ANY PAYMENT
  ========================================================= */

  async regenerateForLoan(loanId, loan, plan) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const hasPayments = await LoanInstallmentModel.hasPayments(conn, loanId);

      if (hasPayments) {
        throw {
          status: 400,
          message: "Cannot regenerate installments after payment has been made",
        };
      }

      /*
       * Delete old schedule
       */

      await LoanInstallmentModel.deleteByLoanId(conn, loanId);

      /*
       * Generate new schedule
       */

      const installments = await this.generateForLoan(conn, loan, plan);

      await conn.commit();

      return {
        message: "Installments regenerated successfully",

        installments,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =========================================================
     CALCULATE SUMMARY
  ========================================================= */

  calculateSummary(installments) {
    let totalDue = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let totalPenalty = 0;

    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;
    let overdueCount = 0;
    const today = new Date().toISOString().split("T")[0];

    for (const item of installments) {
      totalDue += Number(item.total_due || 0);

      totalPaid += Number(item.paid_amount || 0);

      totalBalance += Number(item.balance_amount || 0);

      totalPenalty += Number(item.penalty_amount || 0);

      if (item.status !== "paid" && item.due_date < today) {
        overdueCount++;
      }

      switch (item.status) {
        case "pending":
          pendingCount++;
          break;

        case "partial":
          partialCount++;
          break;

        case "paid":
          paidCount++;
          break;

        case "overdue":
          break;
      }
    }

    return {
      installment_count: installments.length,

      total_due: Number(totalDue.toFixed(2)),

      total_paid: Number(totalPaid.toFixed(2)),

      total_balance: Number(totalBalance.toFixed(2)),

      total_penalty: Number(totalPenalty.toFixed(2)),

      pending_count: pendingCount,

      partial_count: partialCount,

      paid_count: paidCount,

      overdue_count: overdueCount,
    };
  },

  async getLoanSummary(loanId) {
    const db = getDB();

    const installments = await LoanInstallmentModel.findByLoanId(loanId);

    const today = new Date().toISOString().split("T")[0];

    let current_due = 0;
    let overdue_amount = 0;

    for (const item of installments) {
      if (item.status !== "paid") {
        if (item.due_date <= today) {
          current_due += Number(item.balance_amount);

          if (item.due_date < today) {
            overdue_amount += Number(item.balance_amount);
          }
        }
      }
    }

    return {
      ...this.calculateSummary(installments),
      current_due: Number(current_due.toFixed(2)),
      overdue_amount: Number(overdue_amount.toFixed(2)),
    };
  },

  async getNextInstallment(loanId) {
    const installments = await LoanInstallmentModel.findByLoanId(loanId);

    const next = installments.find((i) => i.status !== "paid");

    if (!next) {
      return null;
    }

    return next;
  },

  async getOverdue(loanId) {
    const installments = await LoanInstallmentModel.findByLoanId(loanId);

    const today = new Date().toISOString().split("T")[0];

    return installments.filter(
      (i) => i.status !== "paid" && i.due_date < today,
    );
  },

  /*only once penelties are calculated */
  // async calculatePenalty(id) {
  //   const db = getDB();
  //   const installment = await LoanInstallmentModel.findById(id);

  //   if (!installment) {
  //     throw { status: 404, message: "Installment not found" };
  //   }

  //   if (installment.status === "paid") {
  //     return {
  //       installment_id: id,
  //       days_overdue: 0,
  //       penalty_amount: 0,
  //       message: "Installment is already paid",
  //     };
  //   }

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const dueDate = new Date(installment.due_date);
  //   dueDate.setHours(0, 0, 0, 0);

  //   const diffTime = today.getTime() - dueDate.getTime();
  //   const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  //   if (daysOverdue <= 0) {
  //     return {
  //       installment_id: id,
  //       days_overdue: 0,
  //       penalty_amount: 0,
  //       message: "Installment is not overdue",
  //     };
  //   }

  //   // Fetch loan & penalty rule for plan
  //   const [loanRows] = await db.query(
  //     `SELECT loan_plan_id FROM loans WHERE id = ?`,
  //     [installment.loan_id],
  //   );
  //   const loan = loanRows[0];

  //   let penaltyAmount = 0;

  //   if (loan?.loan_plan_id) {
  //     const [penaltyRows] = await db.query(
  //       `SELECT * FROM loan_plan_penalties WHERE loan_plan_id = ? AND status = 'active'`,
  //       [loan.loan_plan_id],
  //     );
  //     const rule = penaltyRows[0];

  //     if (rule) {
  //       const graceDays = Number(rule.grace_days || 0);
  //       if (daysOverdue > graceDays) {
  //         if (rule.penalty_type === "fixed") {
  //           penaltyAmount = Number(rule.penalty_value || 0);
  //         } else if (rule.penalty_type === "percentage") {
  //           const principal = Number(installment.principal_amount || 0);
  //           penaltyAmount = (principal * Number(rule.penalty_value || 0)) / 100;
  //         }
  //         if (rule.max_penalty !== null && rule.max_penalty !== undefined) {
  //           penaltyAmount = Math.min(penaltyAmount, Number(rule.max_penalty));
  //         }
  //       }
  //     }
  //   }

  //   return {
  //     installment_id: id,
  //     days_overdue: daysOverdue,
  //     penalty_amount: Number(penaltyAmount.toFixed(2)),
  //   };
  // },

  /*add every time penelties are calculated */
  async calculatePenalty(id) {
    const db = getDB();

    const installment = await LoanInstallmentModel.findById(id);

    if (!installment) {
      throw { status: 404, message: "Installment not found" };
    }

    if (installment.status === "paid") {
      return {
        installment_id: id,
        days_overdue: 0,
        penalty_days: 0,
        penalty_amount: 0,
        message: "Installment already paid",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(installment.due_date);
    dueDate.setHours(0, 0, 0, 0);

    const diff = today - dueDate;
    const daysOverdue = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

    if (daysOverdue === 0) {
      return {
        installment_id: id,
        days_overdue: 0,
        penalty_days: 0,
        penalty_amount: 0,
        message: "Not overdue",
      };
    }

    // 🔎 Get loan
    const [[loan]] = await db.query(
      `SELECT loan_plan_id FROM loans WHERE id = ?`,
      [installment.loan_id],
    );

    let penaltyAmount = 0;
    let graceDays = 0; // ✅ FIX
    let penaltyDays = 0;

    if (loan?.loan_plan_id) {
      const [[rule]] = await db.query(
        `SELECT * FROM loan_plan_penalties 
       WHERE loan_plan_id = ? AND status='active'`,
        [loan.loan_plan_id],
      );

      if (rule) {
        graceDays = Number(rule.grace_days || 0);

        penaltyDays = Math.max(0, daysOverdue - graceDays);

        if (penaltyDays > 0) {
          if (rule.penalty_type === "fixed") {
            penaltyAmount = penaltyDays * Number(rule.penalty_value || 0);
          }

          if (rule.penalty_type === "percentage") {
            const base = Number(installment.balance_amount || 0);

            const perDay = (base * Number(rule.penalty_value || 0)) / 100;

            penaltyAmount = penaltyDays * perDay;
          }

          // cap
          if (rule.max_penalty != null) {
            penaltyAmount = Math.min(penaltyAmount, Number(rule.max_penalty));
          }
        }
      }
    }

    return {
      installment_id: id,
      days_overdue: daysOverdue,
      penalty_days: penaltyDays,
      penalty_amount: Number(penaltyAmount.toFixed(2)),
    };
  },

  async applyPenalty(id, data = {}) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const installment = await LoanInstallmentModel.findById(id);

      if (!installment) {
        throw { status: 404, message: "Installment not found" };
      }

      if (installment.status === "paid") {
        throw {
          status: 400,
          message: "Cannot apply penalty to paid installment",
        };
      }

      let penalty =
        data.penalty_amount !== undefined ? Number(data.penalty_amount) : null;

      if (penalty === null || Number.isNaN(penalty)) {
        const calculated = await this.calculatePenalty(id);
        penalty = calculated.penalty_amount;
      }

      if (penalty <= 0) {
        await conn.rollback();
        return {
          message: "No penalty to apply",
          installment,
        };
      }

      const total_due = Number(
        (Number(installment.principal_amount) + penalty).toFixed(2),
      );

      const paidAmount = Number(installment.paid_amount || 0);
      const balance = Number((total_due - paidAmount).toFixed(2));

      await LoanInstallmentModel.update(conn, id, {
        penalty_amount: penalty,
        total_due,
        balance_amount: balance,
      });

      await conn.commit();

      const updated = await LoanInstallmentModel.findById(id);

      return {
        message: "Penalty applied successfully",
        installment: updated,
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async getTodayCollections(date) {
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const data = await LoanInstallmentModel.findTodayCollections(targetDate);

    const total = data.reduce((sum, row) => {
      return sum + Number(row.paid_amount || 0);
    }, 0);

    return {
      date: targetDate,
      count: data.length,
      total_collection: total,
      data,
    };
  },

  async getOverdueInstallmentsGlobal(filters = {}) {
    const data =
      await LoanInstallmentModel.findOverdueInstallmentsGlobal(filters);

    const totalOverdue = data.reduce((sum, row) => {
      return sum + Number(row.balance_amount || 0);
    }, 0);

    return {
      count: data.length,
      total_overdue_amount: totalOverdue,
      data,
    };
  },
};

export default LoanInstallmentService;
