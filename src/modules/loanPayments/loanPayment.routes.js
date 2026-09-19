import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import {
  payInstallment,
  payLoanAutoAllocate,
  bulkPayInstallments,
  getAllPayments,
  getPaymentSummary,
  getPaymentReceipt,
  getPaymentsByLoan,
  getPaymentsByInstallment,
  getPaymentById,
  revertPayment,
} from "./loanPayment.controller.js";

const router = express.Router();

/**
 * @route   POST /api/loan-payments
 * @desc    Record payment for a single installment (auto-infers loan_id if omitted)
 */
router.post("/", verifyToken, payInstallment);

/**
 * @route   POST /api/loan-payments/pay-loan
 * @desc    Auto-allocate lump sum payment sequentially across earliest unpaid installments of a loan
 */
router.post("/pay-loan", verifyToken, payLoanAutoAllocate);

/**
 * @route   POST /api/loan-payments/bulk
 * @desc    Process bulk/batch payments for multiple installments in an atomic transaction
 */
router.post("/bulk", verifyToken, bulkPayInstallments);

/**
 * @route   GET /api/loan-payments
 * @desc    Get paginated payments with filters (loan_id, installment_id, customer_id, payment_mode, dates, search)
 */
router.get("/", verifyToken, getAllPayments);

/**
 * @route   GET /api/loan-payments/summary
 * @desc    Summary statistics and payment mode breakdown
 */
router.get("/summary", verifyToken, getPaymentSummary);

/**
 * @route   GET /api/loan-payments/receipt/:id
 * @desc    Get printable receipt voucher with customer, loan, and installment details
 */
router.get("/receipt/:id", verifyToken, getPaymentReceipt);

/**
 * @route   GET /api/loan-payments/loan/:loanId
 * @desc    Get payment history for a specific loan
 */
router.get("/loan/:loanId", verifyToken, getPaymentsByLoan);

/**
 * @route   GET /api/loan-payments/installment/:installmentId
 * @desc    Get payment history for a specific installment
 */
router.get("/installment/:installmentId", verifyToken, getPaymentsByInstallment);

/**
 * @route   GET /api/loan-payments/:id
 * @desc    Get single payment by ID
 */
router.get("/:id", verifyToken, getPaymentById);

/**
 * @route   DELETE /api/loan-payments/:id
 * @desc    Revert/cancel a payment, readjusting installment balance and loan status
 */
router.delete("/:id", verifyToken, revertPayment);

export default router;
