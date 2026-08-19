import Joi from "joi";

/* =====================================================
   CREATE PAYMENT
===================================================== */

export const createPaymentSchema = Joi.object({
  installment_no: Joi.number().integer().positive().required(),

  due_date: Joi.date().required(),

  payment_date: Joi.date().allow("", null).default(null),

  due_amount: Joi.number().positive().required(),

  paid_amount: Joi.number().min(0).default(0),

  pending_amount: Joi.number().min(0).default(0),

  payment_mode: Joi.string()
    .trim()
    .lowercase()
    .valid("cash", "bank", "upi", "cheque", "other")
    .allow(null)
    .default(null),

  transaction_reference: Joi.string()
    .trim()
    .max(150)
    .allow("", null)
    .default(null),

  status: Joi.string()
    .trim()
    .lowercase()
    .valid("pending", "partial", "paid", "overdue")
    .default("pending"),

  remarks: Joi.string().trim().allow("", null).default(null),
});

/* =====================================================
    GENERATE INSTALLMENT
===================================================== */

export const generateInstallmentSchema = Joi.object({
  count: Joi.number().integer().positive().default(1),
});

/* =====================================================
   UPDATE PAYMENT
   Partial update — NO DEFAULTS
===================================================== */

export const updatePaymentSchema = Joi.object({
  installment_no: Joi.number().integer().positive(),

  due_date: Joi.date(),

  payment_date: Joi.date().allow("", null),

  due_amount: Joi.number().positive(),

  paid_amount: Joi.number().min(0),

  pending_amount: Joi.number().min(0),

  payment_mode: Joi.string()
    .trim()
    .lowercase()
    .valid("cash", "bank", "upi", "cheque", "other")
    .allow(null),

  transaction_reference: Joi.string().trim().max(150).allow("", null),

  status: Joi.string()
    .trim()
    .lowercase()
    .valid("pending", "partial", "paid", "overdue"),

  remarks: Joi.string().trim().allow("", null),
});

export const bulkInstallmentSchema = Joi.object({
  installments: Joi.array()
    .items(
      Joi.object({
        installment_no: Joi.number().integer().min(1).required(),

        due_date: Joi.date().required(),

        due_amount: Joi.number().min(0).optional(),
      }),
    )
    .min(1)
    .required(),
});
