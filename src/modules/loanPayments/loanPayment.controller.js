import {
  createPaymentSchema,
  payLoanAutoAllocateSchema,
  bulkPaymentsSchema,
  paymentQuerySchema,
} from "./loanPayment.validation.js";
import { LoanPaymentService } from "./loanPayment.service.js";

/**
 * Pay single installment (auto infers loan_id if omitted)
 */
export const payInstallment = async (req, res, next) => {
  try {
    const data = await createPaymentSchema.validateAsync(req.body);
    const result = await LoanPaymentService.payInstallment(data, req.user);
    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Auto-allocated lump-sum payment for a loan
 */
export const payLoanAutoAllocate = async (req, res, next) => {
  try {
    const data = await payLoanAutoAllocateSchema.validateAsync(req.body);
    const result = await LoanPaymentService.payLoanAutoAllocate(data, req.user);
    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk / Batch payments across multiple installments
 */
export const bulkPayInstallments = async (req, res, next) => {
  try {
    const data = await bulkPaymentsSchema.validateAsync(req.body);
    const result = await LoanPaymentService.bulkPayInstallments(
      data.payments,
      req.user,
    );
    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get paginated list of payments with filters
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const filters = await paymentQuerySchema.validateAsync(req.query);
    const result = await LoanPaymentService.getAll(filters);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get summary and payment analytics
 */
export const getPaymentSummary = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const result = await LoanPaymentService.getSummary({ from_date, to_date });
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single payment details
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const result = await LoanPaymentService.getById(req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payment history for a specific loan
 */
export const getPaymentsByLoan = async (req, res, next) => {
  try {
    const result = await LoanPaymentService.getByLoan(req.params.loanId);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payment history for a specific installment
 */
export const getPaymentsByInstallment = async (req, res, next) => {
  try {
    const result = await LoanPaymentService.getByInstallment(
      req.params.installmentId,
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
 * Get receipt voucher for a payment
 */
export const getPaymentReceipt = async (req, res, next) => {
  try {
    const result = await LoanPaymentService.getReceipt(req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Revert a payment
 */
export const revertPayment = async (req, res, next) => {
  try {
    const result = await LoanPaymentService.revertPayment(
      req.params.id,
      req.user,
    );
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
