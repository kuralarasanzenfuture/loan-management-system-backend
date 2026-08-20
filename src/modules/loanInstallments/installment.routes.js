import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  getInstallmentsByLoan,
  getInstallmentById,
  updateInstallment,

  // 🔥 NEW APIs
  getCurrentDue,
  getNextDue,
  getLoanSummary,
  calculatePenalty,
  payInstallment,
   applyPenalty,
   regenerateInstallments,
   getOverdueInstallments,
} from "./installment.controller.js";

const router = express.Router();

/* =========================================================
   BASIC INSTALLMENTS
========================================================= */

// Get all installments of a loan
router.get("/loan/:loanId", verifyToken, getInstallmentsByLoan);

// Get single installment
router.get("/:id", verifyToken, getInstallmentById);

// Update installment manually
router.put("/:id", verifyToken, updateInstallment);

/* =========================================================
   PAYMENT ACTION
========================================================= */

// 🔥 Pay installment (important API)
router.post("/:id/pay", verifyToken, payInstallment);

router.post("/:id/apply-penalty", verifyToken, applyPenalty);

router.post("/loan/:loanId/regenerate", verifyToken, regenerateInstallments);

/* =========================================================
   CURRENT DUE & SUMMARY
========================================================= */

// 🔥 Get current due (next unpaid + penalty)
router.get("/loan/:loanId/current-due", verifyToken, getCurrentDue);

router.get("/loan/:loanId/overdue", verifyToken, getOverdueInstallments);

router.get("/loan/:loanId/next-due", verifyToken, getNextDue);

// 🔥 Loan summary (total paid, balance, overdue)
router.get("/loan/:loanId/summary", verifyToken, getLoanSummary);

/* =========================================================
   PENALTY
========================================================= */

// 🔥 Calculate penalty for installment
router.get("/:id/penalty", verifyToken, calculatePenalty);

export default router;
