import LoanInstallmentService from "./installment.service.js";
import { getDB } from "../../config/db.js";
import { LoanModel } from "../customersLoan/loan.model.js";
import {
  installmentIdSchema,
  loanIdSchema,
  payInstallmentSchema,
  updateInstallmentSchema,
} from "./installment.validation.js";

/* =========================================================
   GET ALL INSTALLMENTS BY LOAN
   GET /api/loan-installments/loan/:loanId
========================================================= */
export const getInstallmentsByLoan = async (req, res, next) => {
  try {
    const { loanId } = await loanIdSchema.validateAsync(req.params);

    const result = await LoanInstallmentService.getByLoan(loanId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET INSTALLMENT BY ID
   GET /api/loan-installments/:id
========================================================= */
export const getInstallmentById = async (req, res, next) => {
  try {
    const { id } = await installmentIdSchema.validateAsync(req.params);

    const result = await LoanInstallmentService.getById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   UPDATE INSTALLMENT (ADMIN / MANUAL)
   PUT /api/loan-installments/:id
========================================================= */
export const updateInstallment = async (req, res, next) => {
  try {
    const { id } = await installmentIdSchema.validateAsync(req.params);
    const data = await updateInstallmentSchema.validateAsync(req.body);

    const result = await LoanInstallmentService.update(id, data, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   PAY INSTALLMENT (MAIN API)
   POST /api/loan-installments/:id/pay
========================================================= */
export const payInstallment = async (req, res, next) => {
  try {
    const { id } = await installmentIdSchema.validateAsync(req.params);
    const data = await payInstallmentSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await LoanInstallmentService.addPayment(id, data, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET CURRENT DUE
   GET /api/loan-installments/loan/:loanId/current-due
========================================================= */
export const getCurrentDue = async (req, res, next) => {
  try {
    const { loanId } = await loanIdSchema.validateAsync(req.params);

    const result = await LoanInstallmentService.getNextInstallment(loanId);

    res.status(200).json({
      success: true,
      data: result,
      message: result ? undefined : "All installments are paid",
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET NEXT DUE
   GET /api/loan-installments/loan/:loanId/next-due
========================================================= */

export const getNextDue = async (req, res, next) => {
  try {
    const { loanId } = await loanIdSchema.validateAsync(req.params);

    const result = await LoanInstallmentService.getNextInstallment(loanId);

    res.status(200).json({
      success: true,
      data: result,
      message: result ? undefined : "All installments are paid",
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET LOAN SUMMARY
   GET /api/loan-installments/loan/:loanId/summary
========================================================= */
export const getLoanSummary = async (req, res, next) => {
  try {
    const { loanId } = await loanIdSchema.validateAsync(req.params);

    const result = await LoanInstallmentService.getLoanSummary(loanId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   CALCULATE PENALTY
   GET /api/loan-installments/:id/penalty
========================================================= */
export const calculatePenalty = async (req, res, next) => {
  try {
    const { id } = await installmentIdSchema.validateAsync(req.params);

    const result = await LoanInstallmentService.calculatePenalty(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("❌ PENALTY ERROR:", err);
    next(err);
  }
};

export const applyPenalty = async (req, res, next) => {
  try {
    const { id } = await installmentIdSchema.validateAsync(req.params);
    const result = await LoanInstallmentService.applyPenalty(id, req.body);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const getOverdueInstallments = async (req, res, next) => {
  try {
    const { loanId } = await loanIdSchema.validateAsync(req.params);
    const result = await LoanInstallmentService.getOverdue(loanId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const regenerateInstallments = async (req, res, next) => {
  try {
    const { loanId } = await loanIdSchema.validateAsync(req.params);
    const db = getDB();
    const loan = await LoanModel.findById(db, loanId);

    if (!loan) {
      return next({ status: 404, message: "Loan not found" });
    }

    const plan = await LoanModel.findLoanPlanById(db, loan.loan_plan_id);

    if (!plan) {
      return next({ status: 404, message: "Loan plan not found" });
    }

    const result = await LoanInstallmentService.regenerateForLoan(
      loanId,
      loan,
      plan,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   TODAY COLLECTIONS
=============================== */
export const getTodayCollections = async (req, res, next) => {
  try {
    const { date, status } = req.query;

    const result = await LoanInstallmentService.getTodayCollections(
      date,
      status,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("TODAY COLLECTION ERROR:", err);
    next(err);
  }
};

/* ===============================
   GLOBAL OVERDUE
=============================== */
export const getOverdueInstallmentsGlobal = async (req, res, next) => {
  try {
    const result = await LoanInstallmentService.getOverdueInstallmentsGlobal(
      req.query,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("OVERDUE ERROR:", err);
    next(err);
  }
};
