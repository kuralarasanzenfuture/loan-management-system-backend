import { InterestOnlyLoanService } from "./interestLoan.service.js";
import {
  createInterestLoanSchema,
  updateLoanStatusSchema,
} from "./interestLoan.validation.js";

/**
 * CREATE LOAN (auto generates schedule)
 */
export const createInterestOnlyLoan = async (req, res, next) => {
  try {
    const data = await createInterestLoanSchema.validateAsync(req.body);

    const result = await InterestOnlyLoanService.create(data, req.user);

    res.status(201).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL
 */
export const getAllInterestOnlyLoans = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanService.getAll(req.query);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET BY ID
 */
export const getInterestOnlyLoanById = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanService.getById(req.params.id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET BY CUSTOMER
 */
export const getLoansByCustomerId = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanService.getByCustomer(
      req.params.customer_id,
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE STATUS
 */
export const updateInterestOnlyLoanStatus = async (req, res, next) => {
  try {
    const { status } = await updateLoanStatusSchema.validateAsync(req.body);

    const result = await InterestOnlyLoanService.updateStatus(
      req.params.id,
      status,
      req.user,
    );

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE LOAN (terms and schedule)
 */
export const updateInterestOnlyLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await InterestOnlyLoanService.update(
      Number(id),
      req.body,
      req.user,
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * REGENERATE REPAYMENT SCHEDULE
 */
export const regenerateInterestLoanSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await InterestOnlyLoanService.regenerateSchedule(
      Number(id),
      req.body,
      req.user,
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE
 */
export const deleteInterestOnlyLoan = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanService.delete(req.params.id);

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
