import Joi from "joi";

export const getInstallmentsSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required(),
});

export const updateInstallmentSchema = Joi.object({
  penalty_amount: Joi.number().min(0).precision(2).optional(),

  paid_amount: Joi.number().min(0).precision(2).optional(),

  paid_date: Joi.date().iso().allow(null).optional(),

  status: Joi.string()
    .valid("pending", "partial", "paid", "overdue")
    .optional(),
}).min(1);
