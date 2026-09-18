import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createLoan,
  updateLoan,
  getAllLoans,
  getLoanById,
  updateLoanStatus,
  deleteLoan,
  getLoanReports,
  getLoanInstallmentsReport,
  getCustomerLoanReports,
} from "./loan.controller.js";

const router = express.Router();

/* ==========================
   CREATE
========================== */

router.post("/", verifyToken, createLoan);

/* ==========================
   READ
========================== */

router.get("/", verifyToken, getAllLoans);

/* ==========================
   LOAN REPORTS
========================== */

// 🔥 Full loan dashboard report
router.get("/loan-reports", verifyToken, getLoanReports);

// 🔥 Installment-level report (table view)
router.get("/installments-report", verifyToken, getLoanInstallmentsReport);

// 🔥 Customer-wise summary
router.get("/customer-loan-reports", verifyToken, getCustomerLoanReports);

router.get("/:id", verifyToken, getLoanById);

/* ==========================
   UPDATE
========================== */

router.put("/:id", verifyToken, updateLoan);

router.patch("/:id/status", verifyToken, updateLoanStatus);
router.put("/:id/status", verifyToken, updateLoanStatus);

/* ==========================
   DELETE
========================== */

router.delete("/:id", verifyToken, deleteLoan);

export default router;
