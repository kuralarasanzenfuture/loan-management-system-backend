import { getDB } from "../../../config/db.js";
import PersonalChitModel from "../personalChit/personalChit.model.js";
import PersonalChitPaymentModel from "./personalChitPayment.model.js";

const PersonalChitPaymentService = {
  /* =====================================================
     CREATE PAYMENT / INSTALLMENT
  ===================================================== */

  async create(chitId, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* ---------------------------------------------
         Lock chit
      --------------------------------------------- */

      const chit = await PersonalChitModel.findByIdWithConn(conn, chitId);

      if (!chit) {
        throw {
          status: 404,
          message: "Personal chit not found",
        };
      }

      if (chit.status === "cancelled") {
        throw {
          status: 400,
          message: "Cannot add payment to cancelled chit",
        };
      }

      if (chit.status === "completed") {
        throw {
          status: 400,
          message: "Cannot add payment to completed chit",
        };
      }

      /* ---------------------------------------------
         Check duplicate installment
      --------------------------------------------- */

      const existing = await PersonalChitPaymentModel.findByInstallment(
        conn,
        chitId,
        data.installment_no,
      );

      if (existing) {
        throw {
          status: 409,
          message: "Installment number already exists",
        };
      }

      const dueAmount = Number(data.due_amount);

      const paidAmount = Number(data.paid_amount || 0);

      /* ---------------------------------------------
         Validate paid amount
      --------------------------------------------- */

      if (paidAmount > dueAmount) {
        throw {
          status: 400,
          message: "Paid amount cannot exceed due amount",
        };
      }

      const pendingAmount = dueAmount - paidAmount;

      /* ---------------------------------------------
         Calculate payment status
      --------------------------------------------- */

      let status = "pending";

      if (pendingAmount === 0) {
        status = "paid";
      } else if (paidAmount > 0) {
        status = "partial";
      }

      /* ---------------------------------------------
         Overdue
      --------------------------------------------- */

      if (
        pendingAmount > 0 &&
        new Date(data.due_date) < new Date() &&
        !data.payment_date
      ) {
        status = "overdue";
      }

      /* ---------------------------------------------
         Create payment
      --------------------------------------------- */

      const paymentId = await PersonalChitPaymentModel.create(conn, {
        ...data,
        chit_id: chitId,

        due_amount: dueAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,

        status,

        created_by: user.id,
      });

      /* ---------------------------------------------
         Recalculate parent totals
      --------------------------------------------- */

      const totals = await PersonalChitPaymentModel.calculateChitTotals(
        conn,
        chitId,
      );

      let chitStatus = "active";

      if (totals.total_pending_amount === 0 && totals.total_paid_amount > 0) {
        chitStatus = "completed";
      }

      await PersonalChitModel.updateSummary(conn, chitId, {
        total_paid_amount: totals.total_paid_amount,

        total_pending_amount: totals.total_pending_amount,

        status: chitStatus,
      });

      await conn.commit();

      return {
        message: "Chit payment created successfully",
        id: paymentId,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  _formatDate(date) {
    return new Date(date).toISOString().split("T")[0];
  },

  _getNextDate(baseDate, frequency, interval) {
    const d = new Date(baseDate);

    switch (frequency) {
      case "weekly":
        d.setDate(d.getDate() + 7 * interval);
        break;

      case "monthly":
        d.setMonth(d.getMonth() + interval);
        break;

      case "quarterly":
        d.setMonth(d.getMonth() + 3 * interval);
        break;

      default:
        d.setMonth(d.getMonth() + 1);
    }

    return d.toISOString().split("T")[0];
  },

  async generateInstallment(chitId, user, options = {}) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* =====================================================
       1. GET CHIT
    ===================================================== */

      const chit = await PersonalChitModel.findByIdWithConn(conn, chitId);

      if (!chit) {
        throw { status: 404, message: "Chit not found" };
      }

      /* =====================================================
       2. BLOCK MANUAL TYPE
    ===================================================== */

      if (chit.payment_schedule_type === "manual") {
        throw {
          status: 400,
          message:
            "Auto installment generation not allowed for manual schedule",
        };
      }

      if (chit.status === "cancelled") {
        throw {
          status: 400,
          message: "Cannot generate installments for a cancelled chit",
        };
      }

      if (chit.status === "completed") {
        throw {
          status: 400,
          message: "Cannot generate installments for a completed chit",
        };
      }

      /* =====================================================
       3. GET LAST INSTALLMENT
    ===================================================== */

      const last = await PersonalChitPaymentModel.findLastPayment(conn, chitId);

      let nextInstallmentNo = 1;
      let lastDueDate = new Date(chit.start_date);

      if (last) {
        nextInstallmentNo = last.installment_no + 1;
        lastDueDate = new Date(last.due_date);
      }

      /* =====================================================
       4. DETERMINE INTERVAL
    ===================================================== */

      const frequency = chit.payment_frequency; // weekly/monthly/etc
      const interval = chit.payment_interval || 1;

      const count = options.count || 1;

      const created = [];

      /* =====================================================
       5. LOOP GENERATION
    ===================================================== */

      for (let i = 0; i < count; i++) {
        const dueDate = this._getNextDate(lastDueDate, frequency, interval);

        const dueAmount = Number(chit.chit_amount);

        const paymentId = await PersonalChitPaymentModel.create(conn, {
          chit_id: chitId,
          installment_no: nextInstallmentNo,
          due_date: dueDate,
          due_amount: dueAmount,
          paid_amount: 0,
          pending_amount: dueAmount,
          status: "pending",
          created_by: user.id,
        });

        created.push({
          id: paymentId,
          installment_no: nextInstallmentNo,
          due_date: dueDate,
        });

        nextInstallmentNo++;
        lastDueDate = dueDate;
      }

      /* =====================================================
       6. RECALCULATE TOTALS
    ===================================================== */

      const totals = await PersonalChitPaymentModel.calculateChitTotals(
        conn,
        chitId,
      );

      /* =====================================================
      /* =====================================================
        7. DETERMINE CHIT STATUS
      ===================================================== */
      let chitStatus = "active";

      if (totals.total_pending_amount === 0 && totals.total_paid_amount > 0) {
        chitStatus = "completed";
      }

      await PersonalChitModel.updateSummary(conn, chitId, {
        total_paid_amount: totals.total_paid_amount,
        total_pending_amount: totals.total_pending_amount,
        status: chitStatus,
      });

      await conn.commit();

      return {
        message: `${created.length} installment(s) generated`,
        data: created,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async generateFullSchedule(chitId, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* =====================================================
       1. GET CHIT
    ===================================================== */

      const chit = await PersonalChitModel.findByIdWithConn(conn, chitId);

      if (!chit) {
        throw { status: 404, message: "Chit not found" };
      }

      /* =====================================================
       2. VALIDATIONS
    ===================================================== */

      if (chit.payment_schedule_type === "manual") {
        throw {
          status: 400,
          message: "Manual schedule cannot auto generate installments",
        };
      }

      if (!chit.total_members || chit.total_members <= 0) {
        throw {
          status: 400,
          message: "total_members must be greater than 0",
        };
      }

      /* =====================================================
       3. PREVENT DUPLICATE
    ===================================================== */

      const existing = await PersonalChitPaymentModel.countByChit(conn, chitId);

      if (existing > 0) {
        throw {
          status: 400,
          message: "Installments already generated",
        };
      }

      /* =====================================================
       4. AMOUNT CALCULATION
    ===================================================== */

      const totalAmount = Number(chit.chit_amount);
      const members = Number(chit.total_members);

      const baseAmount = Math.floor((totalAmount / members) * 100) / 100;

      let accumulated = 0;

      /* =====================================================
       5. GENERATE INSTALLMENTS
    ===================================================== */

      let currentDate = new Date(chit.start_date);

      const frequency = chit.payment_frequency;
      const interval = chit.payment_interval || 1;

      const installments = [];

      for (let i = 1; i <= members; i++) {
        const dueDate =
          i === 1
            ? this._formatDate(currentDate)
            : this._getNextDate(currentDate, frequency, interval);

        let dueAmount;

        if (i === members) {
          // last installment → adjust remainder
          dueAmount = Number((totalAmount - accumulated).toFixed(2));
        } else {
          dueAmount = baseAmount;
          accumulated += baseAmount;
        }

        await PersonalChitPaymentModel.create(conn, {
          chit_id: chitId,
          installment_no: i,
          due_date: dueDate,

          due_amount: dueAmount,
          paid_amount: 0,
          pending_amount: dueAmount,

          status: "pending",
          created_by: user.id,
        });

        installments.push({
          installment_no: i,
          due_date: dueDate,
          due_amount: dueAmount,
        });

        currentDate = new Date(dueDate);
      }

      await conn.commit();

      return {
        message: `${installments.length} installments generated`,
        data: installments,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async bulkCreateInstallments(chitId, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* =====================================================
       1. CHECK CHIT
    ===================================================== */

      const chit = await PersonalChitModel.findByIdWithConn(conn, chitId);

      if (!chit) {
        throw { status: 404, message: "Chit not found" };
      }

      /* =====================================================
       2. BLOCK AUTO CHITS
    ===================================================== */

      if (chit.payment_schedule_type === "auto") {
        throw {
          status: 400,
          message: "Auto schedule chits cannot use manual bulk insert",
        };
      }

      /* =====================================================
       3. EXISTING INSTALLMENTS CHECK
    ===================================================== */

      const existing = await PersonalChitPaymentModel.countByChit(conn, chitId);

      if (existing > 0) {
        throw {
          status: 400,
          message: "Installments already exist",
        };
      }

      /* =====================================================
       4. VALIDATE DUPLICATES INSIDE REQUEST
    ===================================================== */

      const numbers = data.installments.map((i) => i.installment_no);
      const unique = new Set(numbers);

      if (numbers.length !== unique.size) {
        throw {
          status: 400,
          message: "Duplicate installment numbers in request",
        };
      }

      /* =====================================================
       5. SORT INSTALLMENTS (IMPORTANT)
    ===================================================== */

      const sorted = data.installments.sort(
        (a, b) => a.installment_no - b.installment_no,
      );

      /* =====================================================
       6. INSERT LOOP
    ===================================================== */

      let totalDue = 0;

      for (const item of sorted) {
        totalDue += Number(item.due_amount);

        await PersonalChitPaymentModel.create(conn, {
          chit_id: chitId,
          installment_no: item.installment_no,
          due_date: item.due_date,

          due_amount: item.due_amount,
          paid_amount: 0,
          pending_amount: item.due_amount,

          status: "pending",
          created_by: user.id,
        });
      }

      /* =====================================================
       7. OPTIONAL: VALIDATE TOTAL MATCH
    ===================================================== */

      // if (Number(chit.chit_amount) !== Number(totalDue)) {
      //   throw {
      //     status: 400,
      //     message: "Total due_amount does not match chit amount",
      //   };
      // }

      await conn.commit();

      return {
        message: `${sorted.length} installments created`,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     GET ALL PAYMENTS
  ===================================================== */

  async getAll(chitId, filters = {}) {
    const chit = await PersonalChitModel.findById(chitId);

    if (!chit) {
      throw {
        status: 404,
        message: "Personal chit not found",
      };
    }

    const data = await PersonalChitPaymentModel.findAll(chitId, filters);

    return {
      count: data.length,
      data,
    };
  },

  /* =====================================================
     GET PAYMENT BY ID
  ===================================================== */

  async getById(chitId, paymentId) {
    const chit = await PersonalChitModel.findById(chitId);

    if (!chit) {
      throw {
        status: 404,
        message: "Personal chit not found",
      };
    }

    const payment = await PersonalChitPaymentModel.findById(chitId, paymentId);

    if (!payment) {
      throw {
        status: 404,
        message: "Payment not found",
      };
    }

    return payment;
  },

  /* =====================================================
     UPDATE PAYMENT
  ===================================================== */

  async update(chitId, paymentId, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* ---------------------------------------------
         Lock parent chit
      --------------------------------------------- */

      const chit = await PersonalChitModel.findByIdWithConn(conn, chitId);

      if (!chit) {
        throw {
          status: 404,
          message: "Personal chit not found",
        };
      }

      if (chit.status === "cancelled") {
        throw {
          status: 400,
          message: "Cannot update payment of cancelled chit",
        };
      }

      /* ---------------------------------------------
         Lock payment
      --------------------------------------------- */

      const existing = await PersonalChitPaymentModel.findByIdWithConn(
        conn,
        chitId,
        paymentId,
      );

      if (!existing) {
        throw {
          status: 404,
          message: "Payment not found",
        };
      }

      /* ---------------------------------------------
         Calculate final values
      --------------------------------------------- */

      const dueAmount =
        data.due_amount !== undefined
          ? Number(data.due_amount)
          : Number(existing.due_amount);

      const paidAmount =
        data.paid_amount !== undefined
          ? Number(data.paid_amount)
          : Number(existing.paid_amount);

      if (paidAmount < 0) {
        throw {
          status: 400,
          message: "Paid amount cannot be negative",
        };
      }

      if (paidAmount > dueAmount) {
        throw {
          status: 400,
          message: "Paid amount cannot exceed due amount",
        };
      }

      const pendingAmount = dueAmount - paidAmount;

      const dueDate =
        data.due_date !== undefined ? data.due_date : existing.due_date;

      const paymentDate =
        data.payment_date !== undefined
          ? data.payment_date
          : existing.payment_date;

      let status = "pending";

      if (pendingAmount === 0) {
        status = "paid";
      } else if (paidAmount > 0) {
        status = "partial";
      } else if (new Date(dueDate) < new Date() && !paymentDate) {
        status = "overdue";
      }

      /* ---------------------------------------------
         Update payment
      --------------------------------------------- */

      await PersonalChitPaymentModel.update(conn, paymentId, chitId, {
        ...data,

        due_amount: dueAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,

        status,
      });

      /* ---------------------------------------------
         Recalculate parent
      --------------------------------------------- */

      const totals = await PersonalChitPaymentModel.calculateChitTotals(
        conn,
        chitId,
      );

      let chitStatus = "active";

      if (totals.total_pending_amount === 0 && totals.total_paid_amount > 0) {
        chitStatus = "completed";
      }

      await PersonalChitModel.updateSummary(conn, chitId, {
        total_paid_amount: totals.total_paid_amount,

        total_pending_amount: totals.total_pending_amount,

        status: chitStatus,
      });

      await conn.commit();

      return {
        message: "Chit payment updated successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     DELETE PAYMENT
  ===================================================== */

  // async delete(chitId, paymentId, user) {
  //   const db = getDB();
  //   const conn = await db.getConnection();

  //   try {
  //     await conn.beginTransaction();

  //     const chit = await PersonalChitModel.findByIdWithConn(conn, chitId);

  //     if (!chit) {
  //       throw {
  //         status: 404,
  //         message: "Personal chit not found",
  //       };
  //     }

  //     const payment = await PersonalChitPaymentModel.findByIdWithConn(
  //       conn,
  //       chitId,
  //       paymentId,
  //     );

  //     if (!payment) {
  //       throw {
  //         status: 404,
  //         message: "Payment not found",
  //       };
  //     }

  //     await PersonalChitPaymentModel.delete(conn, chitId, paymentId);

  //     /* ---------------------------------------------
  //        Recalculate totals
  //     --------------------------------------------- */

  //     const totals = await PersonalChitPaymentModel.calculateChitTotals(
  //       conn,
  //       chitId,
  //     );

  //     let status = "active";

  //     if (totals.total_pending_amount === 0 && totals.total_paid_amount > 0) {
  //       status = "completed";
  //     }

  //     await PersonalChitModel.updateSummary(conn, chitId, {
  //       total_paid_amount: totals.total_paid_amount,

  //       total_pending_amount: totals.total_pending_amount,

  //       status,
  //     });

  //     await conn.commit();

  //     return {
  //       message: "Chit payment deleted successfully",
  //     };
  //   } catch (err) {
  //     await conn.rollback();
  //     throw err;
  //   } finally {
  //     conn.release();
  //   }
  // },

  async delete(chitId, paymentId, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* =====================================================
       1. CHECK CHIT
    ===================================================== */

      const chit = await PersonalChitModel.findByIdWithConn(conn, chitId);

      if (!chit) {
        throw {
          status: 404,
          message: "Personal chit not found",
        };
      }

      /* =====================================================
       2. CHECK PAYMENT
    ===================================================== */

      const payment = await PersonalChitPaymentModel.findByIdWithConn(
        conn,
        chitId,
        paymentId,
      );

      if (!payment) {
        throw {
          status: 404,
          message: "Payment not found",
        };
      }

      /* =====================================================
       3. GET LAST INSTALLMENT
    ===================================================== */

      const lastPayment = await PersonalChitPaymentModel.findLastPayment(
        conn,
        chitId,
      );

      if (!lastPayment) {
        throw {
          status: 404,
          message: "No payment found",
        };
      }

      /* =====================================================
       4. ONLY LAST INSTALLMENT CAN BE DELETED
    ===================================================== */

      if (Number(payment.id) !== Number(lastPayment.id)) {
        throw {
          status: 400,
          message:
            `Only the last installment can be deleted. ` +
            `Installment ${lastPayment.installment_no} is the latest installment.`,
        };
      }

      /* =====================================================
       5. DELETE LAST PAYMENT
    ===================================================== */

      await PersonalChitPaymentModel.delete(conn, chitId, paymentId);

      /* =====================================================
       6. RECALCULATE TOTALS
    ===================================================== */

      const totals = await PersonalChitPaymentModel.calculateChitTotals(
        conn,
        chitId,
      );

      /* =====================================================
       7. DETERMINE CHIT STATUS
     ===================================================== */

      let status = "active";

      if (
        Number(totals.total_pending_amount) === 0 &&
        Number(totals.total_paid_amount) > 0
      ) {
        status = "completed";
      }

      /* =====================================================
       8. UPDATE CHIT SUMMARY
    ===================================================== */

      await PersonalChitModel.updateSummary(conn, chitId, {
        total_paid_amount: totals.total_paid_amount,

        total_pending_amount: totals.total_pending_amount,

        status,
      });

      await conn.commit();

      return {
        message: `Installment ${payment.installment_no} deleted successfully`,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

export default PersonalChitPaymentService;
