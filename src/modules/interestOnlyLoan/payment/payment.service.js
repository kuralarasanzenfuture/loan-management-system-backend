import dayjs from "dayjs";
import { getDB } from "../../../config/db.js";
import { ScheduleModel } from "../schedule/schedule.model.js";
import { InterestLoanModel } from "../loan/interestLoan.model.js";
import { PaymentModel } from "./payment.model.js";

export const PaymentService = {
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /** 1. VALIDATE LOAN */
      const loan = await InterestLoanModel.findById(data.loan_id, conn);
      if (!loan) {
        throw { status: 404, message: "Interest-only loan not found" };
      }

      if (["completed", "closed", "cancelled"].includes(loan.status)) {
        throw {
          status: 400,
          message: `Cannot record payment for a loan with status '${loan.status}'`,
        };
      }

      /** 2. VALIDATE OUTSTANDING BALANCE */
      const outstandingInterest = Number(loan.outstanding_interest);
      const outstandingPrincipal = Number(loan.outstanding_principal);
      const totalOutstanding = Number(
        (outstandingInterest + outstandingPrincipal).toFixed(2),
      );

      if (totalOutstanding <= 0) {
        throw { status: 400, message: "This loan has no outstanding dues" };
      }

      const paymentAmount = Number(data.payment_amount);
      if (paymentAmount > totalOutstanding) {
        throw {
          status: 400,
          message: `Payment amount (${paymentAmount}) exceeds total outstanding balance (${totalOutstanding})`,
        };
      }

      /** 3. LOCK PENDING/PARTIAL SCHEDULES */
      const schedules = await ScheduleModel.getPendingSchedules(
        conn,
        data.loan_id,
      );

      if (!schedules.length) {
        throw {
          status: 400,
          message: "No pending or partial schedules found for this loan",
        };
      }

      /** 4. GENERATE SEQUENTIAL PAYMENT NUMBER */
      const payment_no = await PaymentModel.getNextPaymentNo(
        conn,
        data.loan_id,
      );

      const paymentDate = dayjs(data.payment_date).format(
        "YYYY-MM-DD HH:mm:ss",
      );

      const paymentId = await PaymentModel.create(conn, {
        ...data,
        payment_date: paymentDate,
        payment_no,
        received_by: user?.id,
      });

      /** 5. ALLOCATION LOOP */
      let remaining = paymentAmount;
      let totalAllocatedInterest = 0;
      let totalAllocatedPrincipal = 0;
      const allocations = [];

      for (const sch of schedules) {
        if (remaining <= 0) break;

        const interestDue = Number(
          (
            Number(sch.interest_amount) - Number(sch.interest_paid || 0)
          ).toFixed(2),
        );
        const principalDue = Number(
          (
            Number(sch.principal_amount) - Number(sch.principal_paid || 0)
          ).toFixed(2),
        );

        let payInterest = 0;
        let payPrincipal = 0;

        // Priority 1: Pay accrued interest on this cycle
        if (interestDue > 0 && remaining > 0) {
          payInterest = Number(Math.min(remaining, interestDue).toFixed(2));
          remaining = Number((remaining - payInterest).toFixed(2));
        }

        // Priority 2: Pay principal if due on this cycle (e.g. final schedule)
        if (principalDue > 0 && remaining > 0) {
          payPrincipal = Number(Math.min(remaining, principalDue).toFixed(2));
          remaining = Number((remaining - payPrincipal).toFixed(2));
        }

        const totalPaidThisCycle = Number(
          (payInterest + payPrincipal).toFixed(2),
        );
        if (totalPaidThisCycle > 0) {
          const newInterestPaid = Number(
            (Number(sch.interest_paid || 0) + payInterest).toFixed(2),
          );
          const newPrincipalPaid = Number(
            (Number(sch.principal_paid || 0) + payPrincipal).toFixed(2),
          );
          const newPaidAmount = Number(
            (Number(sch.paid_amount) + totalPaidThisCycle).toFixed(2),
          );
          const newBalance = Number(
            Math.max(0, Number(sch.total_due) - newPaidAmount).toFixed(2),
          );

          let status = "pending";
          if (newBalance === 0) {
            status = "paid";
          } else if (newPaidAmount > 0) {
            status = "partial";
          }

          await ScheduleModel.updateSchedule(conn, sch.id, {
            interest_paid: newInterestPaid,
            principal_paid: newPrincipalPaid,
            paid_amount: newPaidAmount,
            balance_amount: newBalance,
            status,
            paid_date: newBalance === 0 ? paymentDate : sch.paid_date,
          });

          if (payInterest > 0) {
            await PaymentModel.insertAllocation(conn, {
              payment_id: paymentId,
              schedule_id: sch.id,
              allocation_type: "interest",
              amount: payInterest,
            });
            totalAllocatedInterest = Number(
              (totalAllocatedInterest + payInterest).toFixed(2),
            );
            allocations.push({
              schedule_id: sch.id,
              schedule_no: sch.schedule_no,
              type: "interest",
              amount: payInterest,
            });
          }

          if (payPrincipal > 0) {
            await PaymentModel.insertAllocation(conn, {
              payment_id: paymentId,
              schedule_id: sch.id,
              allocation_type: "principal",
              amount: payPrincipal,
            });
            totalAllocatedPrincipal = Number(
              (totalAllocatedPrincipal + payPrincipal).toFixed(2),
            );
            allocations.push({
              schedule_id: sch.id,
              schedule_no: sch.schedule_no,
              type: "principal",
              amount: payPrincipal,
            });
          }
        }
      }

      /** 6. UPDATE LOAN TOTALS */
      const newTotalInterestPaid = Number(
        (Number(loan.total_interest_paid) + totalAllocatedInterest).toFixed(2),
      );
      const newTotalPrincipalPaid = Number(
        (Number(loan.total_principal_paid) + totalAllocatedPrincipal).toFixed(2),
      );
      const newOutstandingInterest = Number(
        Math.max(
          0,
          Number(loan.outstanding_interest) - totalAllocatedInterest,
        ).toFixed(2),
      );
      const newOutstandingPrincipal = Number(
        Math.max(
          0,
          Number(loan.outstanding_principal) - totalAllocatedPrincipal,
        ).toFixed(2),
      );

      const isFullyRepaid =
        newOutstandingInterest === 0 && newOutstandingPrincipal === 0;
      const loanStatus = isFullyRepaid ? "completed" : loan.status;

      await InterestLoanModel.updateBalances(conn, data.loan_id, {
        total_interest_paid: newTotalInterestPaid,
        total_principal_paid: newTotalPrincipalPaid,
        outstanding_interest: newOutstandingInterest,
        outstanding_principal: newOutstandingPrincipal,
        status: loanStatus,
        updated_by: user?.id,
      });

      await conn.commit();

      const createdPayment = await PaymentModel.getById(paymentId);

      return {
        message: "Payment processed and allocated successfully",
        data: {
          ...createdPayment,
          allocations,
          loan_status: loanStatus,
          remaining_outstanding: Number(
            (newOutstandingInterest + newOutstandingPrincipal).toFixed(2),
          ),
        },
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getByLoan(loan_id) {
    const loan = await InterestLoanModel.findById(loan_id);
    if (!loan) {
      throw { status: 404, message: "Interest-only loan not found" };
    }

    const payments = await PaymentModel.getByLoanId(loan_id);
    for (const p of payments) {
      p.allocations = await PaymentModel.getAllocationsByPaymentId(p.id);
    }
    return payments;
  },

  async getById(id) {
    const payment = await PaymentModel.getById(id);
    if (!payment) {
      throw { status: 404, message: "Payment record not found" };
    }

    payment.allocations = await PaymentModel.getAllocationsByPaymentId(id);
    return payment;
  },

  async delete(id) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /** 1. FETCH PAYMENT & LOAN */
      const payment = await PaymentModel.getById(id, conn);
      if (!payment) {
        throw { status: 404, message: "Payment record not found" };
      }

      const loan = await InterestLoanModel.findById(payment.loan_id, conn);
      if (!loan) {
        throw { status: 404, message: "Interest-only loan not found" };
      }

      /** 2. FETCH ALLOCATIONS TO REVERSE */
      const allocations = await PaymentModel.getAllocationsByPaymentId(
        id,
        conn,
      );

      let reversedInterest = 0;
      let reversedPrincipal = 0;

      for (const alloc of allocations) {
        if (alloc.schedule_id) {
          const schedule = await ScheduleModel.getById(
            alloc.schedule_id,
            conn,
          );
          if (schedule) {
            let currentInterestPaid = Number(schedule.interest_paid);
            let currentPrincipalPaid = Number(schedule.principal_paid);

            if (alloc.allocation_type === "interest") {
              currentInterestPaid = Number(
                Math.max(0, currentInterestPaid - Number(alloc.amount)).toFixed(
                  2,
                ),
              );
              reversedInterest = Number(
                (reversedInterest + Number(alloc.amount)).toFixed(2),
              );
            } else if (alloc.allocation_type === "principal") {
              currentPrincipalPaid = Number(
                Math.max(
                  0,
                  currentPrincipalPaid - Number(alloc.amount),
                ).toFixed(2),
              );
              reversedPrincipal = Number(
                (reversedPrincipal + Number(alloc.amount)).toFixed(2),
              );
            }

            const newPaidAmount = Number(
              (currentInterestPaid + currentPrincipalPaid).toFixed(2),
            );
            const newBalance = Number(
              Math.max(0, Number(schedule.total_due) - newPaidAmount).toFixed(
                2,
              ),
            );
            const status = newPaidAmount === 0 ? "pending" : "partial";

            await ScheduleModel.updateSchedule(conn, schedule.id, {
              interest_paid: currentInterestPaid,
              principal_paid: currentPrincipalPaid,
              paid_amount: newPaidAmount,
              balance_amount: newBalance,
              status,
              paid_date: newPaidAmount === 0 ? null : schedule.paid_date,
            });
          }
        }
      }

      /** 3. REVERSE LOAN BALANCES */
      const restoredInterestPaid = Number(
        Math.max(
          0,
          Number(loan.total_interest_paid) - reversedInterest,
        ).toFixed(2),
      );
      const restoredPrincipalPaid = Number(
        Math.max(
          0,
          Number(loan.total_principal_paid) - reversedPrincipal,
        ).toFixed(2),
      );
      const restoredOutstandingInterest = Number(
        (Number(loan.outstanding_interest) + reversedInterest).toFixed(2),
      );
      const restoredOutstandingPrincipal = Number(
        (Number(loan.outstanding_principal) + reversedPrincipal).toFixed(2),
      );

      // If loan was completed, restore status back to active
      const restoredStatus =
        loan.status === "completed" ? "active" : loan.status;

      await InterestLoanModel.updateBalances(conn, payment.loan_id, {
        total_interest_paid: restoredInterestPaid,
        total_principal_paid: restoredPrincipalPaid,
        outstanding_interest: restoredOutstandingInterest,
        outstanding_principal: restoredOutstandingPrincipal,
        status: restoredStatus,
      });

      /** 4. DELETE PAYMENT (allocations cascade delete) */
      await PaymentModel.delete(conn, id);

      await conn.commit();

      return {
        message: "Payment reversed and deleted successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
