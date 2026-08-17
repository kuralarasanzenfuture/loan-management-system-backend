import {HandLoanService} from "./handLoan.service.js";

import {
  createHandLoanSchema,
  updateHandLoanSchema,
  updateHandLoanStatusSchema,
  createHandLoanTransactionSchema,
} from "./handLoan.validation.js";

/* =====================================================
   CREATE HAND LOAN
   Creates:
   1. hand_loans record
   2. initial hand_loan_transactions record
===================================================== */

export const createHandLoan = async (req, res, next) => {
  try {
    const data = await createHandLoanSchema.validateAsync(req.body);

    const result = await HandLoanService.create(data, req.user);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   GET ALL HAND LOANS
===================================================== */

export const getHandLoans = async (req, res, next) => {
  try {
    const result = await HandLoanService.getAll(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   GET HAND LOAN BY ID
===================================================== */

export const getHandLoanById = async (req, res, next) => {
  try {
    const result = await HandLoanService.getById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   UPDATE HAND LOAN
===================================================== */

export const updateHandLoan = async (req, res, next) => {
  try {
    const data = await updateHandLoanSchema.validateAsync(req.body);

    const result = await HandLoanService.update(req.params.id, data, req.user);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   UPDATE STATUS
===================================================== */

export const updateHandLoanStatus = async (req, res, next) => {
  try {
    const data = await updateHandLoanStatusSchema.validateAsync(req.body);

    const result = await HandLoanService.updateStatus(
      req.params.id,
      data,
      req.user,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   ADD TRANSACTION
   collection = given loan
   repayment  = borrowed loan
===================================================== */

export const addHandLoanTransaction = async (req, res, next) => {
  try {
    const data = await createHandLoanTransactionSchema.validateAsync(req.body);

    const result = await HandLoanService.addTransaction(
      req.params.id,
      data,
      req.user,
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   GET TRANSACTIONS
===================================================== */

export const getHandLoanTransactions = async (req, res, next) => {
  try {
    const result = await HandLoanService.getTransactions(
      req.params.id,
      req.query,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   DELETE
===================================================== */

export const deleteHandLoan = async (req, res, next) => {
  try {
    const result = await HandLoanService.delete(req.params.id, req.user);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};
