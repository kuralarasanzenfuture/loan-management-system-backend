import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { checkPermission } from "../../../middlewares/permission.middleware.js";
import {
  getPeriodsByLoanId,
  getPeriodById,
  syncDuePeriods,
} from "./interestLoanPeriod.controller.js";
import {
  validateLoanIdParam,
  validatePeriodIdParam,
} from "./interestLoanPeriod.validation.js";

const router = express.Router();
const MODULE_CODE = "MOD_INTEREST_ONLY_LOANS";

/**
 * ==========================================
 * INTEREST LOAN PERIOD ROUTES (028)
 * ==========================================
 */

// Trigger synchronization of due periods (must be before /:id)
router.post(
  "/sync-due",
  verifyToken,
  checkPermission(MODULE_CODE, "EDIT"),
  syncDuePeriods,
);

// Get all periods for a loan
router.get(
  "/loan/:loan_id",
  verifyToken,
  validateLoanIdParam,
  checkPermission(MODULE_CODE, "VIEW"),
  getPeriodsByLoanId,
);

// Get single period by ID
router.get(
  "/:id",
  verifyToken,
  validatePeriodIdParam,
  checkPermission(MODULE_CODE, "VIEW"),
  getPeriodById,
);

export default router;
