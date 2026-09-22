import { InterestLoanPaymentService } from "./interestLoanPayment.service.js";
import {
  createPaymentSchema,
  previewPaymentSchema,
  queryPaymentSchema,
} from "./interestLoanPayment.validation.js";

/**
 * RECORD PAYMENT
 * Handles FIFO interest allocation and principal balance reductions
 */
export const recordPayment = async (req, res, next) => {
  try {
    const data = await createPaymentSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await InterestLoanPaymentService.recordPayment(
      data,
      req.user
    );

    res.status(201).json({
      success: true,
      message: `Payment #${result.payment_no} recorded successfully`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PREVIEW ALLOCATION
 * Previews interest-first vs principal distribution before recording
 */
export const previewPaymentAllocation = async (req, res, next) => {
  try {
    const data = await previewPaymentSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await InterestLoanPaymentService.previewAllocation(data);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL PAYMENTS (With filters & pagination)
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const filters = await queryPaymentSchema.validateAsync(req.query, {
      stripUnknown: true,
    });

    const result = await InterestLoanPaymentService.getPayments(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PAYMENT SUMMARY
 * Aggregate metrics across collections
 */
export const getPaymentSummary = async (req, res, next) => {
  try {
    const result = await InterestLoanPaymentService.getSummary(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PAYMENT RECEIPT BY ID
 * Full payment record with line-item allocations
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const result = await InterestLoanPaymentService.getPaymentById(
      req.params.id
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
 * GET ALL PAYMENTS FOR A LOAN
 */
export const getLoanPayments = async (req, res, next) => {
  try {
    const result = await InterestLoanPaymentService.getLoanPayments(
      req.params.loan_id
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
 * GET ALL PAYMENTS FOR A CUSTOMER
 */
export const getCustomerPayments = async (req, res, next) => {
  try {
    const result = await InterestLoanPaymentService.getCustomerPayments(
      req.params.customer_id
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
 * REVERSE PAYMENT
 * Undoes payment allocations and restores prior balances atomically
 */
export const reversePayment = async (req, res, next) => {
  try {
    const result = await InterestLoanPaymentService.reversePayment(
      req.params.id,
      req.user
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
