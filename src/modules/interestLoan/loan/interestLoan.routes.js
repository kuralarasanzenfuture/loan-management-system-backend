import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { checkPermission } from "../../../middlewares/permission.middleware.js";
import {
  createInterestLoan,
  getAllInterestLoans,
  getInterestLoanById,
  getLoansByCustomerId,
  getInterestLoanSummary,
  updateInterestLoan,
  deleteInterestLoan,
} from "./interestLoan.controller.js";
import {
  validateInterestLoanId,
  validateCustomerId,
} from "./interestLoan.validation.js";

const router = express.Router();
const MODULE_CODE = "MOD_INTEREST_ONLY_LOANS";

/**
 * ==========================================
 * INTEREST LOAN ROUTES (027_interest_loans)
 * ==========================================
 */

// Create new interest loan
router.post(
  "/",
  verifyToken,
  checkPermission(MODULE_CODE, "CREATE"),
  createInterestLoan,
);

// Get all interest loans with filters/search/pagination
router.get(
  "/",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getAllInterestLoans,
);

// Get all loans for a specific customer
router.get(
  "/customer/:customer_id",
  verifyToken,
  validateCustomerId,
  checkPermission(MODULE_CODE, "VIEW"),
  getLoansByCustomerId,
);

// Get portfolio summary metrics (MUST be before /:id)
router.get(
  "/summary",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getInterestLoanSummary,
);

// Get single loan by ID with its period schedule
router.get(
  "/:id",
  verifyToken,
  validateInterestLoanId,
  checkPermission(MODULE_CODE, "VIEW"),
  getInterestLoanById,
);

// Update interest loan (guarded if payments have been made)
router.put(
  "/:id",
  verifyToken,
  validateInterestLoanId,
  checkPermission(MODULE_CODE, "EDIT"),
  updateInterestLoan,
);

// Delete interest loan (rejected if payments have been made)
router.delete(
  "/:id",
  verifyToken,
  validateInterestLoanId,
  checkPermission(MODULE_CODE, "DELETE"),
  deleteInterestLoan,
);

export default router;
