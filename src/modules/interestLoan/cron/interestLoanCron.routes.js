import express from "express";
import rateLimit from "express-rate-limit";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { checkPermission } from "../../../middlewares/permission.middleware.js";
import { requireIdempotency } from "../../../middlewares/idempotency.middleware.js";
import { InterestLoanCronController } from "./interestLoanCron.controller.js";

const router = express.Router();
const MODULE_CODE = "MOD_INTEREST_ONLY_LOANS";

/**
 * Rate Limiter for Manual Financial Execution Endpoints
 * Prevents rapid accidental or malicious repeated triggers
 */
const manualTriggerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Max 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many manual trigger requests from this IP. Please wait before retrying.",
  },
});

/**
 * =========================================================
 * INTEREST LOAN CRON & MONITORING API ROUTES
 * =========================================================
 */

// Health & status check
router.get(
  "/status",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  InterestLoanCronController.getCronStatus
);

// Execution audit log history
router.get(
  "/logs",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  InterestLoanCronController.getCronLogs
);

// Manual accrual trigger (protected with auth, rbac, rate-limiting, and idempotency)
router.post(
  "/run",
  verifyToken,
  checkPermission(MODULE_CODE, "CREATE"),
  manualTriggerLimiter,
  requireIdempotency({ required: false }),
  InterestLoanCronController.triggerCronRun
);

// Manual reconciliation trigger (protected with auth, rbac, rate-limiting, and idempotency)
router.post(
  "/reconcile",
  verifyToken,
  checkPermission(MODULE_CODE, "CREATE"),
  manualTriggerLimiter,
  requireIdempotency({ required: false }),
  InterestLoanCronController.triggerReconciliation
);

// Reconciliation audit reports
router.get(
  "/reconcile/reports",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  InterestLoanCronController.getReconciliationReports
);

// Discrepancies for a specific reconciliation report
router.get(
  "/reconcile/reports/:id/discrepancies",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  InterestLoanCronController.getReportDiscrepancies
);

export default router;
