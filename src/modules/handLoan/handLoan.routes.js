import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createHandLoan,           // 🔥 single API (loan + transaction)
  getHandLoans,
  getHandLoanById,
  updateHandLoan,
  updateHandLoanStatus,
  deleteHandLoan,

  addHandLoanTransaction,           // future: collection / repayment
  getHandLoanTransactions,
} from "./handLoan.controller.js";

const router = express.Router();

/* =====================================================
   HAND LOANS
===================================================== */

/* 🔥 CREATE (Loan + First Transaction) */
router.post("/", verifyToken, createHandLoan);

/* READ */
router.get("/", verifyToken, getHandLoans);
router.get("/:id", verifyToken, getHandLoanById);

/* UPDATE */
router.put("/:id", verifyToken, updateHandLoan);
router.patch("/:id/status", verifyToken, updateHandLoanStatus);

/* DELETE */
router.delete("/:id", verifyToken, deleteHandLoan);


/* =====================================================
   TRANSACTIONS
===================================================== */

/* ➕ Add transaction (collection / repayment) */
router.post("/:id/transactions", verifyToken, addHandLoanTransaction);

/* 📄 Get all transactions of a loan */
router.get("/:id/transactions", verifyToken, getHandLoanTransactions);

export default router;