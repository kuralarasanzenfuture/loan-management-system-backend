import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  getInstallmentsByLoan,
  getInstallmentById,
  updateInstallment,
} from "./installment.controller.js";

const router = express.Router();

/* =========================================================
   GET ALL INSTALLMENTS FOR A LOAN

   GET /api/loan-installments/loan/:loanId
========================================================= */

router.get("/customer-loan/:loanId", verifyToken, getInstallmentsByLoan);

/* =========================================================
   GET SINGLE INSTALLMENT

   GET /api/loan-installments/:id
========================================================= */

router.get("/:id", verifyToken, getInstallmentById);

/* =========================================================
   UPDATE INSTALLMENT / PAYMENT

   PUT /api/loan-installments/:id
========================================================= */

router.put("/:id", verifyToken, updateInstallment);

export default router;
