import dayjs from "dayjs";
import { getDB } from "../../../config/db.js";
import { InterestLoanModel } from "../loan/interestLoan.model.js";
import { InterestLoanPeriodModel } from "../period/interestLoanPeriod.model.js";
import { InterestLoanPaymentModel } from "./interestLoanPayment.model.js";

const round = (val) => Math.round((Number(val) + Number.EPSILON) * 100) / 100;

export const InterestLoanPaymentService = {
  /**
   * Record loan payment with atomic FIFO interest allocation and principal reduction
   */
  async recordPayment(data, user = null) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /** 1. LOCK AND VALIDATE LOAN */
      const [loanRows] = await conn.query(
        `SELECT l.*, p.plan_code, p.interest_type, p.principal_basis 
         FROM interest_loans l
         INNER JOIN interest_loan_plans p ON l.interest_plan_id = p.id
         WHERE l.id = ? 
         FOR UPDATE`,
        [data.loan_id]
      );

      if (!loanRows.length) {
        throw { status: 404, message: "Interest loan not found" };
      }

      const loan = loanRows[0];

      if (["completed", "closed", "cancelled"].includes(loan.status)) {
        throw {
          status: 400,
          message: `Cannot record payment for a loan with status '${loan.status}'`,
        };
      }

      /** 2. VALIDATE BALANCES */
      const outstandingInterestBefore = round(loan.outstanding_interest || 0);
      const outstandingPrincipalBefore = round(loan.outstanding_principal || 0);
      const totalOutstanding = round(
        outstandingInterestBefore + outstandingPrincipalBefore
      );

      if (totalOutstanding <= 0) {
        throw {
          status: 400,
          message: "This loan has no outstanding balance to pay",
        };
      }

      const paymentAmount = round(data.payment_amount);
      if (paymentAmount > totalOutstanding) {
        throw {
          status: 400,
          message: `Payment amount (₹${paymentAmount}) exceeds total outstanding balance (₹${totalOutstanding})`,
        };
      }

      /** 3. SYNC AND FETCH PERIODS */
      await InterestLoanPeriodModel.syncDueStatuses(loan.id, conn);

      const [periods] = await conn.query(
        `SELECT * FROM interest_loan_periods 
         WHERE loan_id = ? 
         ORDER BY period_no ASC 
         FOR UPDATE`,
        [loan.id]
      );

      // Re-evaluate accurate outstanding interest from actual billing periods
      const periodOutstandingInterest = round(
        periods.reduce((sum, p) => sum + round(p.outstanding_interest_amount || 0), 0)
      );
      const effectiveOutstandingInterest = Math.max(
        outstandingInterestBefore,
        periodOutstandingInterest
      );

      const targetPeriodId = data.period_id || data.interest_period_id;
      let targetPeriods = [...periods];
      if (targetPeriodId) {
        const idx = targetPeriods.findIndex(
          (p) => p.id === Number(targetPeriodId)
        );
        if (idx !== -1) {
          const [target] = targetPeriods.splice(idx, 1);
          targetPeriods.unshift(target);
        }
      }

      const strategy = data.allocation_strategy || "auto";
      let totalInterestAllocated = 0;
      let totalPrincipalAllocated = 0;
      const periodAllocations = [];

      /** 4. ALLOCATION STRATEGY RESOLUTION */
      if (strategy === "principal_only") {
        if (paymentAmount > outstandingPrincipalBefore) {
          throw {
            status: 400,
            message: `Principal payment (₹${paymentAmount}) cannot exceed outstanding principal (₹${outstandingPrincipalBefore})`,
          };
        }
        totalPrincipalAllocated = paymentAmount;
      } else if (strategy === "interest_only") {
        if (paymentAmount > effectiveOutstandingInterest) {
          throw {
            status: 400,
            message: `Interest payment (₹${paymentAmount}) cannot exceed total interest due (₹${effectiveOutstandingInterest})`,
          };
        }

        let remaining = paymentAmount;
        const unpaidPeriods = targetPeriods.filter(
          (p) => round(p.outstanding_interest_amount) > 0
        );

        for (const p of unpaidPeriods) {
          if (remaining <= 0) break;
          const due = round(p.outstanding_interest_amount);
          const alloc = Math.min(remaining, due);
          periodAllocations.push({ period: p, amount: alloc });
          remaining = round(remaining - alloc);
          totalInterestAllocated = round(totalInterestAllocated + alloc);
        }
      } else if (strategy === "manual") {
        const specInterest = round(data.interest_amount || 0);
        const specPrincipal = round(data.principal_amount || 0);

        if (round(specInterest + specPrincipal) !== paymentAmount) {
          throw {
            status: 400,
            message: `Sum of interest (₹${specInterest}) and principal (₹${specPrincipal}) must equal payment amount (₹${paymentAmount})`,
          };
        }

        if (specInterest > effectiveOutstandingInterest) {
          throw {
            status: 400,
            message: `Specified interest (₹${specInterest}) exceeds total interest due (₹${effectiveOutstandingInterest})`,
          };
        }

        if (specPrincipal > outstandingPrincipalBefore) {
          throw {
            status: 400,
            message: `Specified principal (₹${specPrincipal}) exceeds outstanding principal (₹${outstandingPrincipalBefore})`,
          };
        }

        let remainingInterest = specInterest;
        const unpaidPeriods = targetPeriods.filter(
          (p) => round(p.outstanding_interest_amount) > 0
        );

        for (const p of unpaidPeriods) {
          if (remainingInterest <= 0) break;
          const due = round(p.outstanding_interest_amount);
          const alloc = Math.min(remainingInterest, due);
          periodAllocations.push({ period: p, amount: alloc });
          remainingInterest = round(remainingInterest - alloc);
          totalInterestAllocated = round(totalInterestAllocated + alloc);
        }

        totalPrincipalAllocated = specPrincipal;
      } else {
        // Default: 'auto' (Targeted/FIFO Interest first, remaining to principal)
        let remaining = paymentAmount;
        const unpaidPeriods = targetPeriods.filter(
          (p) => round(p.outstanding_interest_amount) > 0
        );

        for (const p of unpaidPeriods) {
          if (remaining <= 0) break;
          const due = round(p.outstanding_interest_amount);
          const alloc = Math.min(remaining, due);
          periodAllocations.push({ period: p, amount: alloc });
          remaining = round(remaining - alloc);
          totalInterestAllocated = round(totalInterestAllocated + alloc);
        }

        // Remaining funds go directly towards principal
        totalPrincipalAllocated = remaining;
      }

      /** 5. CALCULATE BALANCES AFTER PAYMENT */
      const outstandingInterestAfter = round(
        Math.max(0, outstandingInterestBefore - totalInterestAllocated)
      );
      const outstandingPrincipalAfter = round(
        Math.max(0, outstandingPrincipalBefore - totalPrincipalAllocated)
      );

      const isCompleted =
        outstandingPrincipalAfter === 0 && outstandingInterestAfter === 0;
      const finalStatus = isCompleted ? "completed" : loan.status;
      const finalNextInterestDate = isCompleted ? null : loan.next_interest_date;

      /** 6. GENERATE SEQUENTIAL PAYMENT NUMBER */
      const paymentNo = await InterestLoanPaymentModel.getNextPaymentNo(
        conn,
        loan.id
      );

      const paymentDate = data.payment_date
        ? dayjs(data.payment_date).format("YYYY-MM-DD HH:mm:ss")
        : dayjs().format("YYYY-MM-DD HH:mm:ss");

      /** 7. INSERT PAYMENT RECORD */
      const paymentId = await InterestLoanPaymentModel.createPayment(conn, {
        loan_id: loan.id,
        payment_no: paymentNo,
        payment_date: paymentDate,
        payment_amount: paymentAmount,
        interest_amount: totalInterestAllocated,
        principal_amount: totalPrincipalAllocated,
        outstanding_interest_before: outstandingInterestBefore,
        outstanding_principal_before: outstandingPrincipalBefore,
        outstanding_interest_after: outstandingInterestAfter,
        outstanding_principal_after: outstandingPrincipalAfter,
        payment_mode: data.payment_mode,
        transaction_reference: data.transaction_reference,
        cheque_number: data.cheque_number,
        remarks: data.remarks,
        received_by: user?.id || null,
      });

      /** 8. INSERT ALLOCATIONS AND UPDATE PERIODS */
      for (const item of periodAllocations) {
        const period = item.period;
        const allocAmount = item.amount;

        await InterestLoanPaymentModel.createAllocation(conn, {
          payment_id: paymentId,
          interest_period_id: period.id,
          allocation_type: "interest",
          amount: allocAmount,
        });

        const newPaid = round(
          round(period.paid_interest_amount || 0) + allocAmount
        );
        const newOutstanding = round(
          Math.max(0, round(period.interest_amount) - newPaid)
        );
        const periodStatus = newOutstanding <= 0 ? "paid" : "partial";
        const collectionDate =
          newOutstanding <= 0 ? paymentDate : period.actual_collection_date;

        await conn.query(
          `UPDATE interest_loan_periods 
           SET paid_interest_amount = ?,
               outstanding_interest_amount = ?,
               status = ?,
               actual_collection_date = ?
           WHERE id = ?`,
          [newPaid, newOutstanding, periodStatus, collectionDate, period.id]
        );
      }

      if (totalPrincipalAllocated > 0) {
        await InterestLoanPaymentModel.createAllocation(conn, {
          payment_id: paymentId,
          interest_period_id: null,
          allocation_type: "principal",
          amount: totalPrincipalAllocated,
        });
      }

      /** 9. ADJUST FUTURE PENDING PERIOD IF PRINCIPAL REDUCED */
      if (
        totalPrincipalAllocated > 0 &&
        !isCompleted &&
        loan.principal_basis === "outstanding_principal"
      ) {
        // Check if there is an uncollected future pending period
        const futurePending = periods.find(
          (p) =>
            p.status === "pending" &&
            round(p.paid_interest_amount || 0) === 0 &&
            dayjs(p.scheduled_date).isAfter(dayjs(paymentDate))
        );

        if (futurePending) {
          let newPeriodInterest = round(futurePending.interest_amount);
          if (loan.interest_type === "percentage") {
            const rate = Number(loan.interest_rate);
            newPeriodInterest = round(
              outstandingPrincipalAfter * (rate / 100)
            );
          }

          await conn.query(
            `UPDATE interest_loan_periods 
             SET opening_principal = ?,
                 interest_amount = ?,
                 outstanding_interest_amount = ?
             WHERE id = ?`,
            [
              outstandingPrincipalAfter,
              newPeriodInterest,
              newPeriodInterest,
              futurePending.id,
            ]
          );
        }
      }

      /** 10. UPDATE LOAN BALANCE AND METRICS */
      await conn.query(
        `UPDATE interest_loans 
         SET outstanding_interest = ?,
             outstanding_principal = ?,
             total_interest_paid = total_interest_paid + ?,
             total_principal_paid = total_principal_paid + ?,
             last_payment_date = ?,
             status = ?,
             next_interest_date = ?,
             updated_by = ?
         WHERE id = ?`,
        [
          outstandingInterestAfter,
          outstandingPrincipalAfter,
          totalInterestAllocated,
          totalPrincipalAllocated,
          paymentDate,
          finalStatus,
          finalNextInterestDate,
          user?.id || null,
          loan.id,
        ]
      );

      await conn.commit();

      /** 11. RETURN POPULATED RECEIPT */
      return await this.getPaymentById(paymentId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  /**
   * Preview allocation without committing changes
   */
  async previewAllocation(data) {
    const db = getDB();
    const loan = await InterestLoanModel.findById(data.loan_id);
    if (!loan) {
      throw { status: 404, message: "Interest loan not found" };
    }

    const periods = await InterestLoanPeriodModel.getByLoanId(loan.id);
    const periodOutstandingInterest = round(
      periods.reduce((sum, p) => sum + round(p.outstanding_interest_amount || 0), 0)
    );
    const outstandingInterestBefore = Math.max(
      round(loan.outstanding_interest || 0),
      periodOutstandingInterest
    );
    const outstandingPrincipalBefore = round(loan.outstanding_principal || 0);
    const totalOutstanding = round(
      outstandingInterestBefore + outstandingPrincipalBefore
    );

    const paymentAmount = round(data.payment_amount);
    if (paymentAmount > totalOutstanding) {
      throw {
        status: 400,
        message: `Payment amount (₹${paymentAmount}) exceeds total outstanding balance (₹${totalOutstanding})`,
      };
    }

    const targetPeriodId = data.period_id || data.interest_period_id;
    let targetPeriods = [...periods];
    if (targetPeriodId) {
      const idx = targetPeriods.findIndex((p) => p.id === Number(targetPeriodId));
      if (idx !== -1) {
        const [target] = targetPeriods.splice(idx, 1);
        targetPeriods.unshift(target);
      }
    }

    const strategy = data.allocation_strategy || "auto";
    let totalInterestAllocated = 0;
    let totalPrincipalAllocated = 0;
    const projectedAllocations = [];

    if (strategy === "principal_only") {
      totalPrincipalAllocated = paymentAmount;
    } else if (strategy === "interest_only") {
      let remaining = paymentAmount;
      for (const p of targetPeriods.filter(
        (x) => round(x.outstanding_interest_amount) > 0
      )) {
        if (remaining <= 0) break;
        const due = round(p.outstanding_interest_amount);
        const alloc = Math.min(remaining, due);
        projectedAllocations.push({
          period_no: p.period_no,
          scheduled_date: p.scheduled_date,
          period_interest_due: due,
          allocated_amount: alloc,
          remaining_due: round(due - alloc),
          projected_period_status: alloc === due ? "paid" : "partial",
        });
        remaining = round(remaining - alloc);
        totalInterestAllocated = round(totalInterestAllocated + alloc);
      }
    } else if (strategy === "manual") {
      const specInterest = round(data.interest_amount || 0);
      const specPrincipal = round(data.principal_amount || 0);
      let remaining = specInterest;
      for (const p of targetPeriods.filter(
        (x) => round(x.outstanding_interest_amount) > 0
      )) {
        if (remaining <= 0) break;
        const due = round(p.outstanding_interest_amount);
        const alloc = Math.min(remaining, due);
        projectedAllocations.push({
          period_no: p.period_no,
          scheduled_date: p.scheduled_date,
          period_interest_due: due,
          allocated_amount: alloc,
          remaining_due: round(due - alloc),
          projected_period_status: alloc === due ? "paid" : "partial",
        });
        remaining = round(remaining - alloc);
        totalInterestAllocated = round(totalInterestAllocated + alloc);
      }
      totalPrincipalAllocated = specPrincipal;
    } else {
      let remaining = paymentAmount;
      for (const p of targetPeriods.filter(
        (x) => round(x.outstanding_interest_amount) > 0
      )) {
        if (remaining <= 0) break;
        const due = round(p.outstanding_interest_amount);
        const alloc = Math.min(remaining, due);
        projectedAllocations.push({
          period_no: p.period_no,
          scheduled_date: p.scheduled_date,
          period_interest_due: due,
          allocated_amount: alloc,
          remaining_due: round(due - alloc),
          projected_period_status: alloc === due ? "paid" : "partial",
        });
        remaining = round(remaining - alloc);
        totalInterestAllocated = round(totalInterestAllocated + alloc);
      }
      totalPrincipalAllocated = remaining;
    }

    const outstandingInterestAfter = round(
      Math.max(0, outstandingInterestBefore - totalInterestAllocated)
    );
    const outstandingPrincipalAfter = round(
      Math.max(0, outstandingPrincipalBefore - totalPrincipalAllocated)
    );

    const isCompleted =
      outstandingPrincipalAfter === 0 && outstandingInterestAfter === 0;

    return {
      loan_id: loan.id,
      loan_no: loan.loan_no,
      customer_name: loan.customer_name,
      payment_amount: paymentAmount,
      strategy,
      outstanding_interest_before: outstandingInterestBefore,
      outstanding_principal_before: outstandingPrincipalBefore,
      allocated_interest: totalInterestAllocated,
      allocated_principal: totalPrincipalAllocated,
      outstanding_interest_after: outstandingInterestAfter,
      outstanding_principal_after: outstandingPrincipalAfter,
      projected_loan_status: isCompleted ? "completed" : loan.status,
      period_allocations: projectedAllocations,
    };
  },

  /**
   * List payments with filters & pagination
   */
  async getPayments(filters) {
    return await InterestLoanPaymentModel.getAll(filters);
  },

  /**
   * Get single payment receipt with full line-item allocations
   */
  async getPaymentById(id) {
    const payment = await InterestLoanPaymentModel.getById(id);
    if (!payment) {
      throw { status: 404, message: "Payment receipt not found" };
    }

    const allocations = await InterestLoanPaymentModel.getAllocationsByPaymentId(
      id
    );

    return {
      ...payment,
      allocations,
    };
  },

  /**
   * Get all payments for a loan
   */
  async getLoanPayments(loanId) {
    const loan = await InterestLoanModel.findById(loanId);
    if (!loan) {
      throw { status: 404, message: "Interest loan not found" };
    }

    const payments = await InterestLoanPaymentModel.getByLoanId(loanId);
    return {
      loan: {
        id: loan.id,
        loan_no: loan.loan_no,
        customer_name: loan.customer_name,
        principal_amount: loan.principal_amount,
        outstanding_principal: loan.outstanding_principal,
        outstanding_interest: loan.outstanding_interest,
        status: loan.status,
      },
      payments,
    };
  },

  /**
   * Get all payments for a customer
   */
  async getCustomerPayments(customerId) {
    return await InterestLoanPaymentModel.getByCustomerId(customerId);
  },

  /**
   * Payment portfolio summary
   */
  async getSummary(filters) {
    return await InterestLoanPaymentModel.getSummary(filters);
  },

  /**
   * Atomic Payment Reversal (Restores period and loan balances safely)
   */
  async reversePayment(id, user = null) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /** 1. LOCK PAYMENT */
      const [payments] = await conn.query(
        `SELECT * FROM interest_loan_payments WHERE id = ? FOR UPDATE`,
        [id]
      );
      if (!payments.length) {
        throw { status: 404, message: "Payment record not found" };
      }
      const payment = payments[0];

      /** 2. LOCK LOAN */
      const [loans] = await conn.query(
        `SELECT * FROM interest_loans WHERE id = ? FOR UPDATE`,
        [payment.loan_id]
      );
      if (!loans.length) {
        throw { status: 404, message: "Interest loan not found" };
      }
      const loan = loans[0];

      /** 3. FETCH ALLOCATIONS */
      const allocations = await InterestLoanPaymentModel.getAllocationsByPaymentId(
        id,
        conn
      );

      /** 4. REVERSE PERIOD ALLOCATIONS */
      for (const alloc of allocations) {
        if (alloc.interest_period_id && alloc.allocation_type === "interest") {
          const [periodRows] = await conn.query(
            `SELECT * FROM interest_loan_periods WHERE id = ? FOR UPDATE`,
            [alloc.interest_period_id]
          );

          if (periodRows.length) {
            const period = periodRows[0];
            const allocAmt = round(alloc.amount);
            const restoredPaid = round(
              Math.max(0, round(period.paid_interest_amount || 0) - allocAmt)
            );
            const restoredDue = round(
              Math.max(0, round(period.interest_amount) - restoredPaid)
            );

            // Determine status
            let restoredStatus = "pending";
            if (restoredPaid > 0) {
              restoredStatus = "partial";
            } else if (dayjs(period.scheduled_date).isBefore(dayjs(), "day") || dayjs(period.scheduled_date).isSame(dayjs(), "day")) {
              restoredStatus = "due";
            }

            const restoredCollectionDate =
              restoredPaid > 0 ? period.actual_collection_date : null;

            await conn.query(
              `UPDATE interest_loan_periods
               SET paid_interest_amount = ?,
                   outstanding_interest_amount = ?,
                   status = ?,
                   actual_collection_date = ?
               WHERE id = ?`,
              [
                restoredPaid,
                restoredDue,
                restoredStatus,
                restoredCollectionDate,
                period.id,
              ]
            );
          }
        }
      }

      /** 5. RESTORE LOAN BALANCES */
      const restoredInterestPaid = round(
        Math.max(
          0,
          round(loan.total_interest_paid || 0) - round(payment.interest_amount)
        )
      );
      const restoredPrincipalPaid = round(
        Math.max(
          0,
          round(loan.total_principal_paid || 0) - round(payment.principal_amount)
        )
      );

      const restoredOutstandingInterest = round(
        round(loan.outstanding_interest || 0) + round(payment.interest_amount)
      );
      const restoredOutstandingPrincipal = round(
        round(loan.outstanding_principal || 0) + round(payment.principal_amount)
      );

      const restoredStatus =
        loan.status === "completed" ? "active" : loan.status;

      await conn.query(
        `UPDATE interest_loans
         SET outstanding_interest = ?,
             outstanding_principal = ?,
             total_interest_paid = ?,
             total_principal_paid = ?,
             status = ?,
             updated_by = ?
         WHERE id = ?`,
        [
          restoredOutstandingInterest,
          restoredOutstandingPrincipal,
          restoredInterestPaid,
          restoredPrincipalPaid,
          restoredStatus,
          user?.id || null,
          loan.id,
        ]
      );

      /** 6. DELETE PAYMENT (allocations cascade deleted) */
      await InterestLoanPaymentModel.deletePayment(id, conn);

      await conn.commit();

      return {
        message: `Payment #${payment.payment_no} reversed successfully`,
        reversed_payment_id: id,
        loan_id: loan.id,
        restored_outstanding_interest: restoredOutstandingInterest,
        restored_outstanding_principal: restoredOutstandingPrincipal,
        loan_status: restoredStatus,
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
};
