import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { checkPermission } from "../../../middlewares/permission.middleware.js";
import {
  createInterestLoanPlan,
  getAllInterestLoanPlans,
  getActiveInterestLoanPlans,
  getInterestLoanPlanById,
  updateInterestLoanPlan,
  updateInterestLoanPlanStatus,
  deleteInterestLoanPlan,
} from "./interestLoanPlan.controller.js";
import { validateInterestLoanPlanId } from "./interestLoanPlan.validation.js";

const router = express.Router();

const MODULE_CODE = "MOD_INTEREST_LOAN_PLANS";

/**
 * ==========================================
 * INTEREST LOAN PLAN ROUTES (026)
 * ==========================================
 */

// Create new plan
router.post(
  "/",
  verifyToken,
  checkPermission(MODULE_CODE, "CREATE"),
  createInterestLoanPlan,
);

// Get all plans with filter/pagination
router.get(
  "/",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getAllInterestLoanPlans,
);

// Get active plans only (quick selection dropdown)
router.get(
  "/active",
  verifyToken,
  checkPermission(MODULE_CODE, "VIEW"),
  getActiveInterestLoanPlans,
);

// Get single plan by ID
router.get(
  "/:id",
  verifyToken,
  validateInterestLoanPlanId,
  checkPermission(MODULE_CODE, "VIEW"),
  getInterestLoanPlanById,
);

// Update plan
router.put(
  "/:id",
  verifyToken,
  validateInterestLoanPlanId,
  checkPermission(MODULE_CODE, "EDIT"),
  updateInterestLoanPlan,
);

// Update status
router.patch(
  "/:id/status",
  verifyToken,
  validateInterestLoanPlanId,
  checkPermission(MODULE_CODE, "EDIT"),
  updateInterestLoanPlanStatus,
);

// Delete plan
router.delete(
  "/:id",
  verifyToken,
  validateInterestLoanPlanId,
  checkPermission(MODULE_CODE, "DELETE"),
  deleteInterestLoanPlan,
);

export default router;
