import { PaymentService } from "./payment.service.js";
import { createPaymentSchema } from "./payment.validation.js";

/**
 * CREATE PAYMENT (auto allocates across pending schedules)
 */
export const createPayment = async (req, res, next) => {
  try {
    const data = await createPaymentSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await PaymentService.create(data, req.user);

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
 * GET BY LOAN
 */
export const getPaymentsByLoan = async (req, res, next) => {
  try {
    const result = await PaymentService.getByLoan(req.params.loan_id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const result = await PaymentService.getById(req.params.id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE (REVERSAL)
 */
export const deletePayment = async (req, res, next) => {
  try {
    const result = await PaymentService.delete(req.params.id);

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
