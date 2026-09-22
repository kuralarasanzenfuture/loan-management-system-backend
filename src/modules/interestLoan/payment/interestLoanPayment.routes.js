import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { checkPermission } from "../../../middlewares/permission.middleware.js";
import {
  recordPayment,
  previewPaymentAllocation,
  getAllPayments,
  getPaymentSummary,
  getPaymentById,
  getLoanPayments,
  getCustomerPayments,
  reversePayment,
} from "./interestLoanPayment.controller.js";

const router = express.Router();
const MODULE_CODE = "MOD_INTEREST_ONLY_LOANS";

/**
 * =========================================================================
 * INTEREST LOAN PAYMENTS & ALLOCATIONS ROUTES (029 & 030 migrations)
 * =========================================================================
 */

// Preview payment allocation breakdown (FIFO interest vs principal)
router.post(
  "/preview",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  previewPaymentAllocation
);

// Record new loan payment (atomic FIFO allocation & balance reductions)
router.post(
  "/",
  verifyToken,
  checkPermission(MODULE_CODE, "CREATE"),
  recordPayment
);

// Payment summary analytics (must be before /:id)
router.get(
  "/summary",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getPaymentSummary
);

// Get all payments for a specific loan (must be before /:id)
router.get(
  "/loan/:loan_id",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getLoanPayments
);

// Get all payments for a specific customer (must be before /:id)
router.get(
  "/customer/:customer_id",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getCustomerPayments
);

// Get all payments with filters, search, and pagination
router.get(
  "/",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getAllPayments
);

// Get single payment receipt with line-item allocations
router.get(
  "/:id",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getPaymentById
);

// Reversal / voiding of payment (atomic rollback of allocations & balances)
router.delete(
  "/:id",
  verifyToken,
  checkPermission(MODULE_CODE, "DELETE"),
  reversePayment
);

export default router;
