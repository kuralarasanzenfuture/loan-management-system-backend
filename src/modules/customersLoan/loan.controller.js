import {
  createLoanSchema,
  updateLoanSchema,
  updateLoanStatusSchema,
  loanIdSchema,
  getAllLoansQuerySchema,
} from "./loan.validation.js";

import { LoanService } from "./loan.service.js";

/* ===============================
   CREATE
================================ */

export const createLoan = async (req, res, next) => {
  try {
    const data = await createLoanSchema.validateAsync(req.body);

    const result = await LoanService.create(data, req.user);

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   UPDATE
================================ */

export const updateLoan = async (req, res, next) => {
  try {
    const { id } = await loanIdSchema.validateAsync(req.params);
    const data = await updateLoanSchema.validateAsync(req.body);

    const result = await LoanService.update(id, data, req.user);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   GET ALL
================================ */

export const getAllLoans = async (req, res, next) => {
  try {
    const query = await getAllLoansQuerySchema.validateAsync(req.query);

    const result = await LoanService.getAll(query);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   GET BY ID
================================ */

export const getLoanById = async (req, res, next) => {
  try {
    const { id } = await loanIdSchema.validateAsync(req.params);

    const result = await LoanService.getById(id);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   UPDATE STATUS
================================ */

export const updateLoanStatus = async (req, res, next) => {
  try {
    const { id } = await loanIdSchema.validateAsync(req.params);
    const data = await updateLoanStatusSchema.validateAsync(req.body);

    const result = await LoanService.updateStatus(id, data.status, req.user);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   DELETE
================================ */

export const deleteLoan = async (req, res, next) => {
  try {
    const { id } = await loanIdSchema.validateAsync(req.params);

    const result = await LoanService.delete(id);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   FULL LOAN REPORT DASHBOARD
========================================================= */
export const getLoanReports = async (req, res, next) => {
  try {
    const result = await LoanService.getLoanReports(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   INSTALLMENT REPORT (TABLE)
========================================================= */
export const getLoanInstallmentsReport = async (req, res, next) => {
  try {
    const result = await LoanService.getInstallmentsReport(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   CUSTOMER SUMMARY
========================================================= */
export const getCustomerLoanReports = async (req, res, next) => {
  try {
    const result = await LoanService.getCustomerReports(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
