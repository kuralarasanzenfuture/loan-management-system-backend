import Joi from "joi";

export const installmentIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const loanIdSchema = Joi.object({
  loanId: Joi.number().integer().positive().required(),
});

export const getInstallmentsSchema = loanIdSchema;

export const payInstallmentSchema = Joi.object({
  payment_amount: Joi.number().positive().precision(2).optional(),
  paid_amount: Joi.number().positive().precision(2).optional(),
  paid_date: Joi.date().iso().allow(null, "").optional(),
  payment_mode: Joi.string().trim().allow(null, "").optional(),
  transaction_reference: Joi.string().trim().allow(null, "").optional(),
  remarks: Joi.string().trim().allow(null, "").optional(),
})
  .or("payment_amount", "paid_amount")
  .unknown(true);

export const updateInstallmentSchema = Joi.object({
  penalty_amount: Joi.number().min(0).precision(2).optional(),
  paid_amount: Joi.number().min(0).precision(2).optional(),
  paid_date: Joi.date().iso().allow(null, "").optional(),
  status: Joi.string().valid("pending", "partial", "paid", "overdue").optional(),
})
  .min(1)
  .unknown(true);
