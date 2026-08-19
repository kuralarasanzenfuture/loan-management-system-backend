import { getDB } from "../../../config/db.js";
import PersonalChitModel from "./personalChit.model.js";
import PersonalChitPaymentModel from "../personalChitPayments/personalChitPayment.model.js";

const PersonalChitService = {
  /* =====================================================
     CREATE CHIT
  ===================================================== */

  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      /* ---------------------------------------------
         Generate chit number
      --------------------------------------------- */

      const chit_no = await PersonalChitModel.generateChitNo(conn);

      /* ---------------------------------------------
         Initial summary

         IMPORTANT:
         Do not trust client summary values.
      --------------------------------------------- */

      const total_paid_amount = 0;
      const total_pending_amount = 0;

      /* ---------------------------------------------
         Insert chit
      --------------------------------------------- */

      const chitId = await PersonalChitModel.create(conn, {
        ...data,
        chit_no,

        is_taken: false,
        taken_date: null,
        chit_received_amount: 0,

        total_paid_amount,
        total_pending_amount,

        status: "active",

        created_by: user.id,
      });

      await conn.commit();

      return {
        message: "Personal chit created successfully",
        id: chitId,
        chit_no,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     GET ALL
  ===================================================== */

  async getAll(filters = {}) {
    const data = await PersonalChitModel.findAll(filters);

    return {
      count: data.length,
      data,
    };
  },

  /* =====================================================
     GET BY ID
  ===================================================== */

  async getById(id) {
    const chit = await PersonalChitModel.findById(id);

    if (!chit) {
      throw {
        status: 404,
        message: "Personal chit not found",
      };
    }

    const payments = await PersonalChitPaymentModel.findAll(id);

    return {
      ...chit,
      payments,
    };
  },

  /* =====================================================
     UPDATE
  ===================================================== */

  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await PersonalChitModel.findByIdWithConn(conn, id);

      if (!existing) {
        throw {
          status: 404,
          message: "Personal chit not found",
        };
      }

      /* ---------------------------------------------
         Don't allow changing financial summary
      --------------------------------------------- */

      delete data.total_paid_amount;
      delete data.total_pending_amount;

      await PersonalChitModel.update(conn, id, data);

      await conn.commit();

      return {
        message: "Personal chit updated successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  async updateStatus(id, data, user) {
    const existing = await PersonalChitModel.findById(id);

    if (!existing) {
      throw {
        status: 404,
        message: "Personal chit not found",
      };
    }

    if (existing.status === "cancelled" && data.status !== "cancelled") {
      throw {
        status: 400,
        message: "Cancelled chit cannot be reactivated",
      };
    }

    await PersonalChitModel.updateStatus(id, data.status);

    return {
      message: "Chit status updated successfully",
    };
  },

  /* =====================================================
     MARK CHIT TAKEN
  ===================================================== */

  async markTaken(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const chit = await PersonalChitModel.findByIdWithConn(conn, id);

      if (!chit) {
        throw {
          status: 404,
          message: "Personal chit not found",
        };
      }

      if (chit.status === "cancelled") {
        throw {
          status: 400,
          message: "Cancelled chit cannot be marked as taken",
        };
      }

      if (chit.is_taken) {
        throw {
          status: 400,
          message: "Chit is already marked as taken",
        };
      }

      const receivedAmount = Number(data.chit_received_amount);

      if (receivedAmount < 0) {
        throw {
          status: 400,
          message: "Received amount cannot be negative",
        };
      }

      await PersonalChitModel.markTaken(conn, id, {
        taken_date: data.taken_date,
        chit_received_amount: receivedAmount,
      });

      await conn.commit();

      return {
        message: "Chit marked as taken successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     DELETE
  ===================================================== */

  async delete(id, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const chit = await PersonalChitModel.findByIdWithConn(conn, id);

      if (!chit) {
        throw {
          status: 404,
          message: "Personal chit not found",
        };
      }

      /* ---------------------------------------------
         Don't physically delete financial history
      --------------------------------------------- */

      if (chit.total_paid_amount > 0) {
        throw {
          status: 400,
          message: "Cannot delete a chit that has payments",
        };
      }

      await PersonalChitModel.delete(conn, id);

      await conn.commit();

      return {
        message: "Personal chit deleted successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =====================================================
     SUMMARY
  ===================================================== */

  async getSummary(filters = {}) {
    return await PersonalChitModel.getSummary(filters);
  },

  /* =====================================================
     UPCOMING PAYMENTS
  ===================================================== */

  async getUpcomingPayments(filters = {}) {
    const data = await PersonalChitPaymentModel.findUpcoming(filters);

    return {
      count: data.length,
      data,
    };
  },

  /* =====================================================
     OVERDUE PAYMENTS
  ===================================================== */

  async getOverduePayments(filters = {}) {
    await PersonalChitPaymentModel.markOverdue();

    const data = await PersonalChitPaymentModel.findOverdue(filters);

    return {
      count: data.length,
      data,
    };
  },
};

export default PersonalChitService;
