import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import {
  createPayment,
  getPaymentsByLoan,
  getPaymentById,
  deletePayment,
} from "./payment.controller.js";
import { getInterestCollectionReports } from "../reports/interestReport.controller.js";
import {
  validatePaymentIdParam,
  validatePaymentLoanIdParam,
} from "./payment.validation.js";

const router = express.Router();

/**
 * INTEREST COLLECTION REPORTS
 * GET /api/interest-only-payments/reports/interest-collections
 * GET /api/interest-only-payments/reports
 */
router.get("/reports/interest-collections", verifyToken, getInterestCollectionReports);
router.get("/reports", verifyToken, getInterestCollectionReports);

/**
 * CREATE PAYMENT (auto allocates across schedules)
 * POST /api/interest-only-payments
 */
router.post("/", verifyToken, createPayment);

/**
 * PAYMENT HISTORY FOR LOAN
 * GET /api/interest-only-payments/loan/:loan_id
 */
router.get(
  "/loan/:loan_id",
  verifyToken,
  validatePaymentLoanIdParam,
  getPaymentsByLoan,
);

/**
 * SINGLE PAYMENT
 * GET /api/interest-only-payments/:id
 */
router.get("/:id", verifyToken, validatePaymentIdParam, getPaymentById);

/**
 * DELETE PAYMENT (reversal of allocation and loan balance)
 * DELETE /api/interest-only-payments/:id
 */
router.delete("/:id", verifyToken, validatePaymentIdParam, deletePayment);

export default router;
