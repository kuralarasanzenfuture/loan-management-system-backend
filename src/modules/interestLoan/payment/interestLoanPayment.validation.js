import Joi from "joi";

/**
 * Validation schemas for Interest Loan Payments & Allocations
 * Migrations: 029_interest_loan_payments & 030_interest_loan_payment_allocations
 */

export const createPaymentSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required().messages({
    "any.required": "Loan ID is required",
    "number.base": "Loan ID must be a valid number",
    "number.positive": "Loan ID must be greater than 0",
  }),

  payment_amount: Joi.number().positive().precision(2).required().messages({
    "any.required": "Payment amount is required",
    "number.base": "Payment amount must be a number",
    "number.positive": "Payment amount must be greater than zero",
  }),

  payment_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/)
    .optional()
    .allow("", null)
    .messages({
      "string.pattern.base": "Payment date must be in YYYY-MM-DD or YYYY-MM-DD HH:mm:ss format",
    }),

  payment_mode: Joi.string()
    .valid("cash", "bank", "upi", "cheque", "other")
    .required()
    .messages({
      "any.required": "Payment mode is required",
      "any.only": "Payment mode must be one of: cash, bank, upi, cheque, other",
    }),

  transaction_reference: Joi.string()
    .trim()
    .max(150)
    .optional()
    .allow("", null)
    .messages({
      "string.max": "Transaction reference cannot exceed 150 characters",
    }),

  cheque_number: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow("", null)
    .messages({
      "string.max": "Cheque number cannot exceed 50 characters",
    }),

  remarks: Joi.string().trim().max(1000).optional().allow("", null).messages({
    "string.max": "Remarks cannot exceed 1000 characters",
  }),

  allocation_strategy: Joi.string()
    .valid("auto", "manual", "interest_only", "principal_only")
    .default("auto")
    .optional(),

  // For manual allocation breakdown
  interest_amount: Joi.number().min(0).precision(2).optional().allow(null),
  principal_amount: Joi.number().min(0).precision(2).optional().allow(null),

  // Optional targeted period
  interest_period_id: Joi.number().integer().positive().optional().allow(null),
  period_id: Joi.number().integer().positive().optional().allow(null),
});

export const previewPaymentSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required().messages({
    "any.required": "Loan ID is required",
  }),
  payment_amount: Joi.number().positive().precision(2).required().messages({
    "any.required": "Payment amount is required",
    "number.positive": "Payment amount must be greater than zero",
  }),
  allocation_strategy: Joi.string()
    .valid("auto", "manual", "interest_only", "principal_only")
    .default("auto")
    .optional(),
  interest_amount: Joi.number().min(0).precision(2).optional().allow(null),
  principal_amount: Joi.number().min(0).precision(2).optional().allow(null),
  interest_period_id: Joi.number().integer().positive().optional().allow(null),
  period_id: Joi.number().integer().positive().optional().allow(null),
});

export const queryPaymentSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow("").optional(),
  loan_id: Joi.number().integer().positive().optional(),
  customer_id: Joi.number().integer().positive().optional(),
  payment_mode: Joi.string()
    .valid("cash", "bank", "upi", "cheque", "other")
    .optional(),
  from_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sort_by: Joi.string()
    .valid(
      "id",
      "payment_no",
      "payment_date",
      "payment_amount",
      "created_at"
    )
    .default("id"),
  sort_order: Joi.string().valid("asc", "desc", "ASC", "DESC").default("desc"),
});
