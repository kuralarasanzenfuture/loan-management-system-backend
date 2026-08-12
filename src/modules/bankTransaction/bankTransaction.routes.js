import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createBankTransaction,
  getBankTransactions,
  getBankTransactionById,
  getBankTransactionSummary,
  getBankTransactionByNumber,
  reverseBankTransaction,
} from "./bankTransaction.controller.js";

const router = express.Router();

/* ==========================
   CREATE TRANSACTION
========================== */

router.post("/", verifyToken, createBankTransaction);

/* ==========================
   READ
========================== */

// All transactions
router.get("/", verifyToken, getBankTransactions);

// Summary / balance information
router.get("/summary", verifyToken, getBankTransactionSummary);

// Find by transaction number
router.get("/number/:transaction_no", verifyToken, getBankTransactionByNumber);

// Find by ID
router.get("/:id", verifyToken, getBankTransactionById);

/* ==========================
   REVERSAL
========================== */

// Don't physically delete financial transactions.
// Reverse them instead.
router.post("/:id/reverse", verifyToken, reverseBankTransaction);

export default router;
