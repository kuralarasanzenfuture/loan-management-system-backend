import Joi from "joi";

export const createLoanSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),

  loan_plan_id: Joi.number().integer().positive().required(),

  loan_amount: Joi.number().positive().precision(2).required(),

  start_date: Joi.date().iso().required(),

  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "completed", "closed", "default")
    .default("active"),
});

export const updateLoanSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),

  loan_plan_id: Joi.number().integer().positive().required(),

  loan_amount: Joi.number().positive().precision(2).required(),

  start_date: Joi.date().iso().required(),

  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "completed", "closed", "default")
    .optional(),
});

export const updateLoanStatusSchema = Joi.object({
  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "completed", "closed", "default")
    .required(),
});

/* ==========================================================
   PARAM VALIDATION
========================================================== */

export const loanIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

/* ==========================================================
   QUERY VALIDATION (for getAll)
========================================================== */

export const getAllLoansQuerySchema = Joi.object({
  status: Joi.string()
    .valid("active", "completed", "closed", "default")
    .optional(),
  customer_id: Joi.number().integer().positive().optional(),
  loan_plan_id: Joi.number().integer().positive().optional(),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().default(10),
});
