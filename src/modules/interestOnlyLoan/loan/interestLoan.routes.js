import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import {
  createInterestOnlyLoan,
  getAllInterestOnlyLoans,
  getInterestOnlyLoanById,
  getLoansByCustomerId,
  updateInterestOnlyLoanStatus,
  deleteInterestOnlyLoan,
  regenerateInterestLoanSchedule,
  updateInterestOnlyLoan,
} from "./interestLoan.controller.js";
import {
  validateLoanIdParam,
  validateCustomerIdParam,
} from "./interestLoan.validation.js";

const router = express.Router();

/**
 * CREATE LOAN (auto generates repayment schedule)
 * POST /api/interest-only-loans
 */
router.post("/", verifyToken, createInterestOnlyLoan);

/**
 * GET ALL LOANS (with optional filters ?status=&customer_id=&search=&from_date=&to_date=)
 * GET /api/interest-only-loans
 */
router.get("/", verifyToken, getAllInterestOnlyLoans);

/**
 * GET LOANS BY CUSTOMER ID
 * GET /api/interest-only-loans/customer/:customer_id
 */
router.get(
  "/customer/:customer_id",
  verifyToken,
  validateCustomerIdParam,
  getLoansByCustomerId,
);

/**
 * REGENERATE LOAN SCHEDULE
 * POST /api/interest-only-loans/:id/regenerate-schedule
 */
router.post(
  "/:id/regenerate-schedule",
  verifyToken,
  validateLoanIdParam,
  regenerateInterestLoanSchedule,
);

/**
 * UPDATE LOAN (terms and schedule for unpaid loans)
 * PUT /api/interest-only-loans/:id
 */
router.put(
  "/:id",
  verifyToken,
  validateLoanIdParam,
  updateInterestOnlyLoan,
);

/**
 * UPDATE LOAN STATUS
 * PATCH /api/interest-only-loans/:id/status
 */
router.patch(
  "/:id/status",
  verifyToken,
  validateLoanIdParam,
  updateInterestOnlyLoanStatus,
);

/**
 * GET SINGLE LOAN (with schedules)
 * GET /api/interest-only-loans/:id
 */
router.get("/:id", verifyToken, validateLoanIdParam, getInterestOnlyLoanById);

/**
 * DELETE LOAN
 * DELETE /api/interest-only-loans/:id
 */
router.delete("/:id", verifyToken, validateLoanIdParam, deleteInterestOnlyLoan);

export default router;
