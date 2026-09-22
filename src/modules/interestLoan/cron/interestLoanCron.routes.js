import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { checkPermission } from "../../../middlewares/permission.middleware.js";
import { InterestLoanCronController } from "./interestLoanCron.controller.js";

const router = express.Router();
const MODULE_CODE = "MOD_INTEREST_ONLY_LOANS";

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

// Manual trigger
router.post(
  "/run",
  verifyToken,
  checkPermission(MODULE_CODE, "CREATE"),
  InterestLoanCronController.triggerCronRun
);

export default router;
