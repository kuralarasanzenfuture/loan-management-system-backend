import Joi from "joi";

/* =====================================================
   COMMON
===================================================== */
const emptyToNull = (value, helpers) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
};

/* =====================================================
   CREATE HAND LOAN
===================================================== */
export const createHandLoanSchema = Joi.object({
  loan_direction: Joi.string().valid("given", "borrowed").required(),

  customer_id: Joi.number().integer().positive().allow(null).optional(),

  person_name: Joi.string().trim().min(2).max(200).required(),

  mobile: Joi.string()
    .trim()
    .pattern(/^[0-9]{7,15}$/)
    .custom(emptyToNull)
    .allow(null),

  address: Joi.string().trim().max(500).custom(emptyToNull).allow(null),

  amount: Joi.number()
    .precision(2)
    .min(0.01)
    .max(999999999999.99)
    .required(),

  given_date: Joi.date().required(),

  expected_return_date: Joi.date().when('given_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('given_date')).allow(null),
    otherwise: Joi.date().allow(null)
  }),

  payment_mode: Joi.string()
    .valid("cash", "bank", "upi", "cheque", "other")
    .default("cash"),

  purpose: Joi.string().trim().max(255).custom(emptyToNull).allow(null),

  remarks: Joi.string().trim().max(1000).custom(emptyToNull).allow(null),
});

export const updateHandLoanSchema = Joi.object({
  loan_direction: Joi.string().valid("given", "borrowed").optional(),

  customer_id: Joi.number().integer().positive().allow(null).optional(),

  person_name: Joi.string().trim().min(2).max(200).optional(),

  mobile: Joi.string()
    .trim()
    .pattern(/^[0-9]{7,15}$/)
    .custom(emptyToNull)
    .allow(null),

  address: Joi.string().trim().max(500).custom(emptyToNull).allow(null),

  amount: Joi.number().precision(2).min(0.01).optional(),

  given_date: Joi.date().optional(),

  expected_return_date: Joi.date().when('given_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('given_date')).allow(null),
    otherwise: Joi.date().allow(null)
  }),

  payment_mode: Joi.string()
    .valid("cash", "bank", "upi", "cheque", "other")
    .optional(),

  purpose: Joi.string().trim().max(255).custom(emptyToNull).allow(null),

  remarks: Joi.string().trim().max(1000).custom(emptyToNull).allow(null),
}).min(1); // 🔥 prevent empty update

export const updateHandLoanStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "partial", "completed", "overdue", "cancelled")
    .required(),
});

export const createHandLoanTransactionSchema = Joi.object({
  transaction_type: Joi.string().valid("collection", "repayment").required(),

  amount: Joi.number().precision(2).min(1).required(),

  transaction_date: Joi.date().optional(),

  payment_mode: Joi.string()
    .valid("cash", "bank", "upi", "cheque", "other")
    .default("cash"),

  company_bank_id: Joi.number().integer().positive().allow(null),

  transaction_reference: Joi.string()
    .trim()
    .max(150)
    .custom(emptyToNull)
    .allow(null),

  cheque_number: Joi.string().trim().max(50).custom(emptyToNull).allow(null),

  description: Joi.string().trim().max(1000).custom(emptyToNull).allow(null),

  remarks: Joi.string().trim().max(1000).custom(emptyToNull).allow(null),
});


