import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createInterestOnlyLoanPlan,
  getAllInterestOnlyLoanPlans,
  getActiveInterestOnlyLoanPlans,
  getInterestOnlyLoanPlanById,
  updateInterestOnlyLoanPlan,
  updateInterestOnlyLoanPlanStatus,
  deleteInterestOnlyLoanPlan,
} from "./interestLoanPlan.controller.js";
import { validateInterestPlanId } from "./interestLoanPlan.validation.js";

const router = express.Router();

/**
 * ==========================================
 * INTEREST ONLY LOAN PLAN ROUTES
 * ==========================================
 */

/**
 * Create new plan
 * POST /api/interest-only-loan-plans
 */
router.post("/", verifyToken, createInterestOnlyLoanPlan);

/**
 * Get all plans
 *
 * Optional filters:
 * ?status=active
 * ?interest_type=percentage
 * ?interest_frequency=monthly
 * ?tenure_type=months
 * ?search=monthly
 *
 * GET /api/interest-only-loan-plans
 */
router.get("/", verifyToken, getAllInterestOnlyLoanPlans);

/**
 * Get active plans only
 *
 * Useful for dropdown/select while creating a loan.
 *
 * GET /api/interest-only-loan-plans/active
 */
router.get("/active", verifyToken, getActiveInterestOnlyLoanPlans);

/**
 * Update only plan status
 *
 * PATCH /api/interest-only-loan-plans/:id/status
 *
 * Body:
 * {
 *   "status": "inactive"
 * }
 */
router.patch(
  "/:id/status",
  verifyToken,
  validateInterestPlanId,
  updateInterestOnlyLoanPlanStatus,
);

/**
 * Get single plan
 *
 * GET /api/interest-only-loan-plans/:id
 */
router.get(
  "/:id",
  verifyToken,
  validateInterestPlanId,
  getInterestOnlyLoanPlanById,
);

/**
 * Update plan
 *
 * PUT /api/interest-only-loan-plans/:id
 */
router.put(
  "/:id",
  verifyToken,
  validateInterestPlanId,
  updateInterestOnlyLoanPlan,
);

/**
 * Delete plan
 *
 * DELETE /api/interest-only-loan-plans/:id
 */
router.delete(
  "/:id",
  verifyToken,
  validateInterestPlanId,
  deleteInterestOnlyLoanPlan,
);

export default router;
