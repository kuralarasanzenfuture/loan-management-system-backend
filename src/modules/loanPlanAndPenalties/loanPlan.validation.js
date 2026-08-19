import Joi from "joi";

export const createLoanPlanSchema = Joi.object({
  plan_name: Joi.string().trim().required(),
  plan_code: Joi.string().trim().uppercase().required(),
  collection_frequency: Joi.string()
    .trim()
    .lowercase()
    .valid("daily", "weekly", "monthly")
    .required(),
  tenure: Joi.number().integer().positive().required(),
  tenure_type: Joi.string()
    .trim()
    .lowercase()
    .valid("days", "weeks", "months")
    .required(),
  commission_type: Joi.string()
    .trim()
    .lowercase()
    .valid("fixed", "percentage")
    .default("fixed"),
  commission_value: Joi.number()
    .min(0)
    .when("commission_type", {
      is: "percentage",
      then: Joi.number().max(100),
    })
    .default(0),
  description: Joi.string().trim().allow("", null),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "inactive")
    .default("active"),

  penalty: Joi.object({
    grace_days: Joi.number().integer().min(0).default(0),
    penalty_type: Joi.string()
      .trim()
      .lowercase()
      .valid("fixed", "percentage")
      .required(),
    penalty_value: Joi.number()
      .min(0)
      .when("penalty_type", {
        is: "percentage",
        then: Joi.number().max(100),
      })
      .required(),
    max_penalty: Joi.number().min(0).allow(null),
    status: Joi.string()
      .trim()
      .lowercase()
      .valid("active", "inactive")
      .default("active"),
  }).optional(),
});

// 🔹 Update schema: all fields optional, no defaults (supports partial updates)
export const updateLoanPlanSchema = Joi.object({
  plan_name: Joi.string().trim(),
  plan_code: Joi.string().trim().uppercase(),
  collection_frequency: Joi.string()
    .trim()
    .lowercase()
    .valid("daily", "weekly", "monthly"),
  tenure: Joi.number().integer().positive(),
  tenure_type: Joi.string()
    .trim()
    .lowercase()
    .valid("days", "weeks", "months"),
  commission_type: Joi.string()
    .trim()
    .lowercase()
    .valid("fixed", "percentage"),
  commission_value: Joi.number()
    .min(0)
    .when("commission_type", {
      is: "percentage",
      then: Joi.number().max(100),
    }),
  description: Joi.string().trim().allow("", null),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "inactive"),

  penalty: Joi.object({
    grace_days: Joi.number().integer().min(0),
    penalty_type: Joi.string()
      .trim()
      .lowercase()
      .valid("fixed", "percentage"),
    penalty_value: Joi.number()
      .min(0)
      .when("penalty_type", {
        is: "percentage",
        then: Joi.number().max(100),
      }),
    max_penalty: Joi.number().min(0).allow(null),
    status: Joi.string()
      .trim()
      .lowercase()
      .valid("active", "inactive"),
  }).optional(),
});
