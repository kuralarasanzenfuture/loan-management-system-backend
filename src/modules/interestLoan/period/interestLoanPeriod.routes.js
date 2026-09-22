import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { checkPermission } from "../../../middlewares/permission.middleware.js";
import {
  getPeriodsByLoanId,
  getPeriodById,
  syncDuePeriods,
  triggerAccrualCron,
  generateLoanPeriodManual,
  getTodayCollections,
  getOverdueCollections,
  getCollectionsOverview,
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

// Dedicated Today's Collections (must be before /:id)
router.get(
  "/collections/today",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getTodayCollections,
);
router.get(
  "/today",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getTodayCollections,
);

// Dedicated Overdue Collections (must be before /:id)
router.get(
  "/collections/overdue",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getOverdueCollections,
);
router.get(
  "/overdue",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getOverdueCollections,
);

// Unified Collections Overview (must be before /:id)
router.get(
  "/collections",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getCollectionsOverview,
);

// Manually trigger daily interest accrual cron job (must be before /:id)
router.post(
  "/cron/run",
  verifyToken,
  checkPermission(MODULE_CODE, "EDIT"),
  triggerAccrualCron,
);

// Manually generate next period for a loan immediately (must be before /:id)
router.post(
  "/generate/:loan_id",
  verifyToken,
  validateLoanIdParam,
  checkPermission(MODULE_CODE, "EDIT"),
  generateLoanPeriodManual,
);

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
