// loanPlan.validation.js
import Joi from "joi";

export const createLoanPlanSchema = Joi.object({
  plan_name: Joi.string().required(),
  plan_code: Joi.string().required(),
  collection_frequency: Joi.string()
    .valid("daily", "weekly", "monthly")
    .required(),
  tenure: Joi.number().positive().required(),
  tenure_type: Joi.string().valid("days", "weeks", "months").required(),
  commission_type: Joi.string().valid("fixed", "percentage").default("fixed"),
  commission_value: Joi.number().min(0).default(0),
  description: Joi.string().allow("", null),
  status: Joi.string().valid("active", "inactive").default("active"),

  penalty: Joi.object({
    grace_days: Joi.number().min(0).default(0),
    penalty_type: Joi.string().valid("fixed", "percentage").required(),
    penalty_value: Joi.number().min(0).required(),
    max_penalty: Joi.number().allow(null),
    status: Joi.string().valid("active", "inactive").default("active"),
  }).optional(),
});

// 🔹 Update schema: all fields optional, no defaults (supports partial updates)
export const updateLoanPlanSchema = Joi.object({
  plan_name: Joi.string(),
  plan_code: Joi.string(),
  collection_frequency: Joi.string().valid("daily", "weekly", "monthly"),
  tenure: Joi.number().positive(),
  tenure_type: Joi.string().valid("days", "weeks", "months"),
  commission_type: Joi.string().valid("fixed", "percentage"),
  commission_value: Joi.number().min(0),
  description: Joi.string().allow("", null),
  status: Joi.string().valid("active", "inactive"),

  penalty: Joi.object({
    grace_days: Joi.number().min(0),
    penalty_type: Joi.string().valid("fixed", "percentage"),
    penalty_value: Joi.number().min(0),
    max_penalty: Joi.number().allow(null),
    status: Joi.string().valid("active", "inactive"),
  }).optional(),
});
