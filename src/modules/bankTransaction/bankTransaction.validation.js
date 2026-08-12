import Joi from "joi";

const VALID_REFERENCE_TYPES = [
  "loan_collection",
  "loan_disbursement",
  "expense",
  "income",
  "cash_deposit",
  "cash_withdrawal",
  "bank_transfer",
  "other",
];

const VALID_PAYMENT_METHODS = [
  "bank_transfer",
  "upi",
  "neft",
  "rtgs",
  "imps",
  "cheque",
  "cash_deposit",
  "other",
];

export const createTransactionSchema = Joi.object({
  company_bank_id: Joi.number().integer().positive().required().messages({
    "number.base": "company_bank_id must be a number",
    "any.required": "company_bank_id is required",
  }),

  transaction_date: Joi.date().iso().required().messages({
    "date.base": "transaction_date must be a valid date",
    "any.required": "transaction_date is required",
  }),

  transaction_type: Joi.string().valid("credit", "debit").required().messages({
    "any.only": "transaction_type must be 'credit' or 'debit'",
    "any.required": "transaction_type is required",
  }),

  amount: Joi.number().positive().required().messages({
    "number.positive": "amount must be a positive number",
    "any.required": "amount is required",
  }),

  reference_type: Joi.string()
    .valid(...VALID_REFERENCE_TYPES)
    .required()
    .messages({
      "any.only": `reference_type must be one of: ${VALID_REFERENCE_TYPES.join(", ")}`,
      "any.required": "reference_type is required",
    }),

  reference_id: Joi.number().integer().positive().allow(null).default(null),

  payment_method: Joi.string()
    .valid(...VALID_PAYMENT_METHODS)
    .allow(null, "")
    .default(null)
    .messages({
      "any.only": `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`,
    }),

  transaction_reference: Joi.string().max(150).allow(null, "").default(null),

  cheque_number: Joi.string()
    .max(50)
    .allow(null, "")
    .default(null)
    .when("payment_method", {
      is: "cheque",
      then: Joi.string().min(1).required().messages({
        "any.required": "cheque_number is required when payment_method is cheque",
        "string.empty": "cheque_number is required when payment_method is cheque",
      }),
    }),

  description: Joi.string().max(500).allow(null, "").default(null),

  remarks: Joi.string().max(1000).allow(null, "").default(null),
});
