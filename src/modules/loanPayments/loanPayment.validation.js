import Joi from "joi";

export const createPaymentSchema = Joi.object({
  installment_id: Joi.number().integer().positive().required().messages({
    "any.required": "Installment ID is required",
    "number.base": "Installment ID must be a valid number",
  }),
  loan_id: Joi.number().integer().positive().optional().messages({
    "number.base": "Loan ID must be a valid number",
  }),
  payment_amount: Joi.number().positive().precision(2).required().messages({
    "any.required": "Payment amount is required",
    "number.positive": "Payment amount must be greater than 0",
  }),
  payment_mode: Joi.string()
    .trim()
    .lowercase()
    .valid("cash", "bank", "upi", "cheque", "other")
    .required()
    .messages({
      "any.required": "Payment mode is required",
      "any.only": "Payment mode must be one of: cash, bank, upi, cheque, other",
    }),
  payment_date: Joi.date().iso().default(() => new Date()),
  transaction_reference: Joi.string().trim().max(150).allow(null, "").optional(),
  cheque_number: Joi.string().trim().max(50).allow(null, "").optional(),
  remarks: Joi.string().trim().allow(null, "").optional(),
});

export const payLoanAutoAllocateSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required().messages({
    "any.required": "Loan ID is required",
    "number.base": "Loan ID must be a valid number",
  }),
  payment_amount: Joi.number().positive().precision(2).required().messages({
    "any.required": "Payment amount is required",
    "number.positive": "Payment amount must be greater than 0",
  }),
  payment_mode: Joi.string()
    .trim()
    .lowercase()
    .valid("cash", "bank", "upi", "cheque", "other")
    .required()
    .messages({
      "any.required": "Payment mode is required",
      "any.only": "Payment mode must be one of: cash, bank, upi, cheque, other",
    }),
  payment_date: Joi.date().iso().default(() => new Date()),
  transaction_reference: Joi.string().trim().max(150).allow(null, "").optional(),
  cheque_number: Joi.string().trim().max(50).allow(null, "").optional(),
  remarks: Joi.string().trim().allow(null, "").optional(),
});

export const bulkPaymentsSchema = Joi.object({
  payments: Joi.array()
    .items(
      Joi.object({
        installment_id: Joi.number().integer().positive().required(),
        loan_id: Joi.number().integer().positive().optional(),
        payment_amount: Joi.number().positive().precision(2).required(),
        payment_mode: Joi.string()
          .trim()
          .lowercase()
          .valid("cash", "bank", "upi", "cheque", "other")
          .required(),
        payment_date: Joi.date().iso().default(() => new Date()),
        transaction_reference: Joi.string().trim().max(150).allow(null, "").optional(),
        cheque_number: Joi.string().trim().max(50).allow(null, "").optional(),
        remarks: Joi.string().trim().allow(null, "").optional(),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one payment item must be provided",
      "any.required": "Payments array is required",
    }),
});

export const paymentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  loan_id: Joi.number().integer().positive().optional(),
  installment_id: Joi.number().integer().positive().optional(),
  customer_id: Joi.number().integer().positive().optional(),
  payment_mode: Joi.string()
    .trim()
    .lowercase()
    .valid("cash", "bank", "upi", "cheque", "other")
    .optional(),
  from_date: Joi.string().trim().optional(),
  to_date: Joi.string().trim().optional(),
  search: Joi.string().trim().allow("").optional(),
});
