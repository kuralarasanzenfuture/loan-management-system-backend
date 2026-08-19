import express from "express";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  generateInstallment,
  generateInstallments,
  createBulkInstallments,
} from "./personalChitPayment.controller.js";

import { verifyToken } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/* ==========================
   PAYMENTS
========================== */

// create installment payment
router.post("/:id/payments", verifyToken, createPayment);

router.post("/:id/generate-installment", verifyToken, generateInstallment);
router.post("/:id/generate-installments", verifyToken, generateInstallments);

router.post("/:id/manual-bulk-installments", verifyToken, createBulkInstallments);

// get all payments for chit
router.get("/:id/payments", verifyToken, getPayments);

// get single payment
router.get("/:id/payments/:paymentId", verifyToken, getPaymentById);

// update payment
router.put("/:id/payments/:paymentId", verifyToken, updatePayment);

// delete payment
router.delete("/:id/payments/:paymentId", verifyToken, deletePayment);

export default router;
