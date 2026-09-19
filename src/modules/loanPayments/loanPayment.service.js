import dayjs from "dayjs";
import { getDB } from "../../config/db.js";
import { LoanPaymentModel } from "./loanPayment.model.js";

export const LoanPaymentService = {
  /**
   * Pay a single installment.
   * Auto-infers loan_id from the installment if not provided.
   * Updates installment balance, paid amount, paid_date, status, and loan completion.
   * @param {Object} data 
   * @param {Object} user 
   */
  async payInstallment(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Lock and validate installment
      const [[installment]] = await conn.query(
        `SELECT * FROM loan_installments WHERE id = ? FOR UPDATE`,
        [data.installment_id],
      );

      if (!installment) {
        throw {
          status: 404,
          message: `Installment #${data.installment_id} not found`,
        };
      }

      // Auto-populate or verify loan_id
      const loanId = Number(installment.loan_id);
      if (data.loan_id && Number(data.loan_id) !== loanId) {
        throw {
          status: 400,
          message: `Installment #${data.installment_id} does not belong to Loan #${data.loan_id}`,
        };
      }

      // 2. Lock and validate loan
      const [[loan]] = await conn.query(
        `SELECT * FROM loans WHERE id = ? FOR UPDATE`,
        [loanId],
      );

      if (!loan) {
        throw {
          status: 404,
          message: `Loan #${loanId} not found`,
        };
      }

      if (["closed", "default"].includes(loan.status)) {
        throw {
          status: 400,
          message: `Cannot record payment on a loan with status '${loan.status}'`,
        };
      }

      // 3. Validate installment status and remaining balance
      if (installment.status === "paid" || Number(installment.balance_amount) <= 0) {
        throw {
          status: 400,
          message: `Installment #${installment.installment_no} is already fully paid`,
        };
      }

      const balance = Number(Number(installment.balance_amount).toFixed(2));
      const payAmount = Number(Number(data.payment_amount).toFixed(2));

      if (payAmount > balance) {
        throw {
          status: 400,
          message: `Payment amount (${payAmount}) exceeds remaining installment balance (${balance})`,
        };
      }

      // 4. Generate sequential payment_no for this loan
      const paymentNo = await LoanPaymentModel.getNextPaymentNo(conn, loanId);

      const formattedPaymentDate = data.payment_date
        ? dayjs(data.payment_date).format("YYYY-MM-DD HH:mm:ss")
        : dayjs().format("YYYY-MM-DD HH:mm:ss");

      // 5. Create payment record
      const paymentId = await LoanPaymentModel.create(conn, {
        loan_id: loanId,
        installment_id: installment.id,
        payment_no: paymentNo,
        payment_date: formattedPaymentDate,
        payment_amount: payAmount,
        payment_mode: data.payment_mode,
        transaction_reference: data.transaction_reference,
        cheque_number: data.cheque_number,
        remarks: data.remarks,
        received_by: user?.id || null,
      });

      // 6. Update installment amounts & status
      const newPaidAmount = Number(
        (Number(installment.paid_amount || 0) + payAmount).toFixed(2),
      );
      const newBalanceAmount = Number(
        (Number(installment.total_due) - newPaidAmount).toFixed(2),
      );
      const newStatus = newBalanceAmount <= 0 ? "paid" : "partial";
      const paidDate =
        newStatus === "paid"
          ? dayjs(formattedPaymentDate).format("YYYY-MM-DD")
          : installment.paid_date;

      await conn.query(
        `
        UPDATE loan_installments SET
          paid_amount = ?,
          balance_amount = ?,
          paid_date = ?,
          status = ?
        WHERE id = ?
        `,
        [newPaidAmount, newBalanceAmount, paidDate, newStatus, installment.id],
      );

      // 7. Check if all installments for this loan are now settled
      const [[unpaidRow]] = await conn.query(
        `
        SELECT COUNT(*) AS unpaid_count
        FROM loan_installments
        WHERE loan_id = ? AND status != 'paid'
        `,
        [loanId],
      );

      let loanCompleted = false;
      if (Number(unpaidRow.unpaid_count) === 0) {
        await conn.query(
          `UPDATE loans SET status = 'completed', updated_by = ? WHERE id = ?`,
          [user?.id || null, loanId],
        );
        loanCompleted = true;
      }

      await conn.commit();

      const createdPayment = await LoanPaymentModel.findById(db, paymentId);

      return {
        message: "Payment recorded successfully",
        payment: createdPayment,
        installment_status: newStatus,
        remaining_balance: newBalanceAmount,
        loan_completed: loanCompleted,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Lump-sum auto-allocated payment for a loan.
   * Sequentially settles earliest pending/partial installments until amount is exhausted.
   * @param {Object} data 
   * @param {Object} user 
   */
  async payLoanAutoAllocate(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const loanId = Number(data.loan_id);

      // 1. Lock and validate loan
      const [[loan]] = await conn.query(
        `SELECT * FROM loans WHERE id = ? FOR UPDATE`,
        [loanId],
      );

      if (!loan) {
        throw {
          status: 404,
          message: `Loan #${loanId} not found`,
        };
      }

      if (["closed", "default"].includes(loan.status)) {
        throw {
          status: 400,
          message: `Cannot record payment on a loan with status '${loan.status}'`,
        };
      }

      // 2. Fetch pending or partial installments in chronological order
      const [installments] = await conn.query(
        `
        SELECT *
        FROM loan_installments
        WHERE loan_id = ? AND status IN ('pending', 'partial', 'overdue')
        ORDER BY installment_no ASC
        FOR UPDATE
        `,
        [loanId],
      );

      if (!installments.length) {
        throw {
          status: 400,
          message: "All installments for this loan are already fully settled",
        };
      }

      const totalPendingBalance = Number(
        installments
          .reduce((sum, inst) => sum + Number(inst.balance_amount || 0), 0)
          .toFixed(2),
      );

      let remainingPayment = Number(Number(data.payment_amount).toFixed(2));

      if (remainingPayment > totalPendingBalance) {
        throw {
          status: 400,
          message: `Payment amount (${remainingPayment}) exceeds total pending balance across all installments (${totalPendingBalance})`,
        };
      }

      const formattedPaymentDate = data.payment_date
        ? dayjs(data.payment_date).format("YYYY-MM-DD HH:mm:ss")
        : dayjs().format("YYYY-MM-DD HH:mm:ss");

      const createdPayments = [];
      const affectedInstallments = [];

      // 3. Allocate across installments
      for (const inst of installments) {
        if (remainingPayment <= 0) break;

        const instBalance = Number(Number(inst.balance_amount).toFixed(2));
        const amountToPay = Number(
          Math.min(remainingPayment, instBalance).toFixed(2),
        );

        if (amountToPay <= 0) continue;

        const paymentNo = await LoanPaymentModel.getNextPaymentNo(conn, loanId);

        const paymentId = await LoanPaymentModel.create(conn, {
          loan_id: loanId,
          installment_id: inst.id,
          payment_no: paymentNo,
          payment_date: formattedPaymentDate,
          payment_amount: amountToPay,
          payment_mode: data.payment_mode,
          transaction_reference: data.transaction_reference,
          cheque_number: data.cheque_number,
          remarks: data.remarks || `Auto-allocated installment #${inst.installment_no}`,
          received_by: user?.id || null,
        });

        const newPaidAmount = Number(
          (Number(inst.paid_amount || 0) + amountToPay).toFixed(2),
        );
        const newBalanceAmount = Number(
          (Number(inst.total_due) - newPaidAmount).toFixed(2),
        );
        const newStatus = newBalanceAmount <= 0 ? "paid" : "partial";
        const paidDate =
          newStatus === "paid"
            ? dayjs(formattedPaymentDate).format("YYYY-MM-DD")
            : inst.paid_date;

        await conn.query(
          `
          UPDATE loan_installments SET
            paid_amount = ?,
            balance_amount = ?,
            paid_date = ?,
            status = ?
          WHERE id = ?
          `,
          [newPaidAmount, newBalanceAmount, paidDate, newStatus, inst.id],
        );

        createdPayments.push(paymentId);
        affectedInstallments.push({
          installment_id: inst.id,
          installment_no: inst.installment_no,
          allocated_amount: amountToPay,
          remaining_balance: newBalanceAmount,
          status: newStatus,
        });

        remainingPayment = Number((remainingPayment - amountToPay).toFixed(2));
      }

      // 4. Check if all installments are completed
      const [[unpaidRow]] = await conn.query(
        `
        SELECT COUNT(*) AS unpaid_count
        FROM loan_installments
        WHERE loan_id = ? AND status != 'paid'
        `,
        [loanId],
      );

      let loanCompleted = false;
      if (Number(unpaidRow.unpaid_count) === 0) {
        await conn.query(
          `UPDATE loans SET status = 'completed', updated_by = ? WHERE id = ?`,
          [user?.id || null, loanId],
        );
        loanCompleted = true;
      }

      await conn.commit();

      return {
        message: `Successfully allocated payment across ${affectedInstallments.length} installment(s)`,
        total_paid: Number(data.payment_amount),
        loan_completed: loanCompleted,
        allocations: affectedInstallments,
        payment_ids: createdPayments,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Bulk payments for multiple installments in an atomic transaction
   * @param {Array<Object>} paymentsList 
   * @param {Object} user 
   */
  async bulkPayInstallments(paymentsList, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const results = [];

      for (const item of paymentsList) {
        // 1. Lock and validate installment
        const [[installment]] = await conn.query(
          `SELECT * FROM loan_installments WHERE id = ? FOR UPDATE`,
          [item.installment_id],
        );

        if (!installment) {
          throw {
            status: 404,
            message: `Installment #${item.installment_id} not found`,
          };
        }

        const loanId = Number(installment.loan_id);

        // 2. Lock and validate loan
        const [[loan]] = await conn.query(
          `SELECT * FROM loans WHERE id = ? FOR UPDATE`,
          [loanId],
        );

        if (!loan) {
          throw {
            status: 404,
            message: `Loan #${loanId} not found`,
          };
        }

        if (installment.status === "paid" || Number(installment.balance_amount) <= 0) {
          throw {
            status: 400,
            message: `Installment #${installment.installment_no} on Loan #${loanId} is already fully paid`,
          };
        }

        const balance = Number(Number(installment.balance_amount).toFixed(2));
        const payAmount = Number(Number(item.payment_amount).toFixed(2));

        if (payAmount > balance) {
          throw {
            status: 400,
            message: `Payment amount (${payAmount}) exceeds installment #${installment.installment_no} balance (${balance})`,
          };
        }

        const paymentNo = await LoanPaymentModel.getNextPaymentNo(conn, loanId);

        const formattedPaymentDate = item.payment_date
          ? dayjs(item.payment_date).format("YYYY-MM-DD HH:mm:ss")
          : dayjs().format("YYYY-MM-DD HH:mm:ss");

        const paymentId = await LoanPaymentModel.create(conn, {
          loan_id: loanId,
          installment_id: installment.id,
          payment_no: paymentNo,
          payment_date: formattedPaymentDate,
          payment_amount: payAmount,
          payment_mode: item.payment_mode,
          transaction_reference: item.transaction_reference,
          cheque_number: item.cheque_number,
          remarks: item.remarks,
          received_by: user?.id || null,
        });

        const newPaidAmount = Number(
          (Number(installment.paid_amount || 0) + payAmount).toFixed(2),
        );
        const newBalanceAmount = Number(
          (Number(installment.total_due) - newPaidAmount).toFixed(2),
        );
        const newStatus = newBalanceAmount <= 0 ? "paid" : "partial";
        const paidDate =
          newStatus === "paid"
            ? dayjs(formattedPaymentDate).format("YYYY-MM-DD")
            : installment.paid_date;

        await conn.query(
          `
          UPDATE loan_installments SET
            paid_amount = ?,
            balance_amount = ?,
            paid_date = ?,
            status = ?
          WHERE id = ?
          `,
          [newPaidAmount, newBalanceAmount, paidDate, newStatus, installment.id],
        );

        // Check loan completion
        const [[unpaidRow]] = await conn.query(
          `
          SELECT COUNT(*) AS unpaid_count
          FROM loan_installments
          WHERE loan_id = ? AND status != 'paid'
          `,
          [loanId],
        );

        if (Number(unpaidRow.unpaid_count) === 0) {
          await conn.query(
            `UPDATE loans SET status = 'completed', updated_by = ? WHERE id = ?`,
            [user?.id || null, loanId],
          );
        }

        results.push({
          payment_id: paymentId,
          installment_id: installment.id,
          installment_no: installment.installment_no,
          loan_id: loanId,
          payment_amount: payAmount,
          status: newStatus,
        });
      }

      await conn.commit();

      return {
        message: `Successfully processed ${results.length} payments in batch`,
        payments: results,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Reverts/deletes a payment and restores installment balance and loan status
   * @param {number} paymentId 
   * @param {Object} user 
   */
  async revertPayment(paymentId, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Lock and validate payment
      const [[payment]] = await conn.query(
        `SELECT * FROM loan_payments WHERE id = ? FOR UPDATE`,
        [paymentId],
      );

      if (!payment) {
        throw {
          status: 404,
          message: `Payment #${paymentId} not found`,
        };
      }

      const installmentId = Number(payment.installment_id);
      const loanId = Number(payment.loan_id);
      const paymentAmount = Number(payment.payment_amount);

      // 2. Lock and update installment
      const [[installment]] = await conn.query(
        `SELECT * FROM loan_installments WHERE id = ? FOR UPDATE`,
        [installmentId],
      );

      if (installment) {
        const newPaidAmount = Number(
          Math.max(0, Number(installment.paid_amount) - paymentAmount).toFixed(2),
        );
        const newBalanceAmount = Number(
          (Number(installment.total_due) - newPaidAmount).toFixed(2),
        );
        const newStatus = newPaidAmount <= 0 ? "pending" : "partial";
        const newPaidDate = newStatus === "pending" ? null : installment.paid_date;

        await conn.query(
          `
          UPDATE loan_installments SET
            paid_amount = ?,
            balance_amount = ?,
            paid_date = ?,
            status = ?
          WHERE id = ?
          `,
          [newPaidAmount, newBalanceAmount, newPaidDate, newStatus, installmentId],
        );
      }

      // 3. If loan was completed, revert status back to 'active'
      const [[loan]] = await conn.query(
        `SELECT status FROM loans WHERE id = ? FOR UPDATE`,
        [loanId],
      );

      if (loan && loan.status === "completed") {
        await conn.query(
          `UPDATE loans SET status = 'active', updated_by = ? WHERE id = ?`,
          [user?.id || null, loanId],
        );
      }

      // 4. Delete payment record
      await LoanPaymentModel.delete(conn, paymentId);

      await conn.commit();

      return {
        message: `Payment #${paymentId} successfully reverted`,
        reverted_amount: paymentAmount,
        installment_id: installmentId,
        loan_id: loanId,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll(filters) {
    return LoanPaymentModel.findAll(null, filters);
  },

  async getById(id) {
    const payment = await LoanPaymentModel.findById(null, id);
    if (!payment) {
      throw { status: 404, message: `Payment #${id} not found` };
    }
    return payment;
  },

  async getByLoan(loanId) {
    return LoanPaymentModel.findByLoanId(null, loanId);
  },

  async getByInstallment(installmentId) {
    return LoanPaymentModel.findByInstallmentId(null, installmentId);
  },

  async getReceipt(id) {
    const receipt = await LoanPaymentModel.getReceipt(null, id);
    if (!receipt) {
      throw { status: 404, message: `Receipt for payment #${id} not found` };
    }
    return receipt;
  },

  async getSummary(filters) {
    return LoanPaymentModel.getSummary(null, filters);
  },
};
