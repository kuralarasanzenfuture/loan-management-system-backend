import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import {
  getLoanSchedules,
  getPendingSchedules,
  getOverdueSchedules,
  getScheduleById,
  getTodayCollections,
  getOverdueCollectionsGlobal,
} from "./schedule.controller.js";
import { getInterestCollectionReports } from "../reports/interestReport.controller.js";
import {
  validateScheduleLoanIdParam,
  validateScheduleIdParam,
} from "./schedule.validation.js";

const router = express.Router();

/**
 * TODAY COLLECTIONS (all interest-only schedules due on a given date)
 * GET /api/interest-only-schedules/today-collections?date=YYYY-MM-DD&status=all|pending|partial|paid&search=...
 */
router.get("/today-collections", verifyToken, getTodayCollections);

/**
 * INTEREST COLLECTION REPORTS (alias)
 * GET /api/interest-only-schedules/reports/interest-collections
 */
router.get("/reports/interest-collections", verifyToken, getInterestCollectionReports);

/**
 * GLOBAL OVERDUE (all interest-only schedules overdue)
 * GET /api/interest-only-schedules/overdue?search=...
 */
router.get("/overdue", verifyToken, getOverdueCollectionsGlobal);

/**
 * FULL SCHEDULE FOR LOAN
 * GET /api/interest-only-schedules/loan/:loan_id
 */
router.get(
  "/loan/:loan_id",
  verifyToken,
  validateScheduleLoanIdParam,
  getLoanSchedules,
);

/**
 * PENDING SCHEDULES FOR LOAN
 * GET /api/interest-only-schedules/loan/:loan_id/pending
 */
router.get(
  "/loan/:loan_id/pending",
  verifyToken,
  validateScheduleLoanIdParam,
  getPendingSchedules,
);

/**
 * OVERDUE SCHEDULES FOR LOAN
 * GET /api/interest-only-schedules/loan/:loan_id/overdue
 */
router.get(
  "/loan/:loan_id/overdue",
  verifyToken,
  validateScheduleLoanIdParam,
  getOverdueSchedules,
);

/**
 * SINGLE SCHEDULE
 * GET /api/interest-only-schedules/:id
 */
router.get("/:id", verifyToken, validateScheduleIdParam, getScheduleById);

export default router;
