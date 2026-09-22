import { InterestLoanService } from "./interestLoan.service.js";
import { InterestLoanPeriodCronService } from "../period/interestLoanPeriodCron.service.js";
import {
  createInterestLoanSchema,
  updateInterestLoanSchema,
} from "./interestLoan.validation.js";

/**
 * GET PORTFOLIO SUMMARY METRICS
 */
export const getInterestLoanSummary = async (req, res, next) => {
  try {
    const result = await InterestLoanService.getSummary();
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE INTEREST LOAN
 * Automatically computes loan_no, next_interest_date, and generates Period 1.
 */
export const createInterestLoan = async (req, res, next) => {
  try {
    const data = await createInterestLoanSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await InterestLoanService.create(data, req.user);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL INTEREST LOANS (With filters & pagination)
 */
export const getAllInterestLoans = async (req, res, next) => {
  try {
    const result = await InterestLoanService.getAll(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET INTEREST LOAN BY ID (With complete period schedule)
 */
export const getInterestLoanById = async (req, res, next) => {
  try {
    const result = await InterestLoanService.getById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL INTEREST LOANS BY CUSTOMER
 */
export const getLoansByCustomerId = async (req, res, next) => {
  try {
    const result = await InterestLoanService.getByCustomer(
      req.params.customer_id,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE INTEREST LOAN
 * Guarded: Cannot change financial terms if payments already recorded.
 */
export const updateInterestLoan = async (req, res, next) => {
  try {
    const data = await updateInterestLoanSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await InterestLoanService.update(
      req.params.id,
      data,
      req.user,
    );

    res.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE INTEREST LOAN
 * Guarded: Rejected if payments have already been made.
 */
export const deleteInterestLoan = async (req, res, next) => {
  try {
    const result = await InterestLoanService.delete(req.params.id);

    res.json({
      success: true,
      id: req.params.id,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * MANUALLY GENERATE NEXT PERIOD FOR LOAN (Internal / Admin API)
 * POST /api/interest-loans/:id/generate-period
 */
export const generateLoanPeriod = async (req, res, next) => {
  try {
    const loanId = req.params.loanId || req.params.id;
    const result = await InterestLoanPeriodCronService.generateNextPeriodForLoan(
      loanId,
      req.body || {}
    );

    if (result.already_exists) {
      return res.status(200).json({
        success: true,
        already_exists: true,
        message: result.message,
        data: result,
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

