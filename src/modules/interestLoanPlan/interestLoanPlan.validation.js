import Joi from "joi";

/**
 * CREATE SCHEMA
 */
export const createInterestOnlyLoanPlanSchema = Joi.object({
  plan_name: Joi.string().trim().max(100).required(),

  plan_code: Joi.string().trim().max(50).optional(),

  interest_type: Joi.string()
    .valid("fixed", "percentage")
    .default("percentage"),

  interest_value: Joi.number().min(0).required(),

  interest_frequency: Joi.string()
    .valid("monthly", "quarterly", "half_yearly", "yearly")
    .default("monthly"),

  tenure: Joi.number().integer().positive().required(),

  tenure_type: Joi.string().valid("months", "years").default("months"),

  principal_repayment: Joi.string().valid("end_of_term").default("end_of_term"),

  penalty_enabled: Joi.boolean().default(false),

  commission_type: Joi.string()
    .valid("none", "fixed", "percentage")
    .default("none"),

  commission_value: Joi.number().min(0).default(0),

  description: Joi.string().allow("", null).default(null),

  status: Joi.string().valid("active", "inactive").default("active"),
});

/**
 * UPDATE SCHEMA (all optional, no unwanted defaults, at least 1 field required)
 */
export const updateInterestOnlyLoanPlanSchema = Joi.object({
  plan_name: Joi.string().trim().max(100).optional(),

  plan_code: Joi.string().trim().max(50).optional(),

  interest_type: Joi.string().valid("fixed", "percentage").optional(),

  interest_value: Joi.number().min(0).optional(),

  interest_frequency: Joi.string()
    .valid("monthly", "quarterly", "half_yearly", "yearly")
    .optional(),

  tenure: Joi.number().integer().positive().optional(),

  tenure_type: Joi.string().valid("months", "years").optional(),

  principal_repayment: Joi.string().valid("end_of_term").optional(),

  penalty_enabled: Joi.boolean().optional(),

  commission_type: Joi.string()
    .valid("none", "fixed", "percentage")
    .optional(),

  commission_value: Joi.number().min(0).optional(),

  description: Joi.string().allow("", null).optional(),

  status: Joi.string().valid("active", "inactive").optional(),
}).min(1);

/**
 * ID PARAM VALIDATION
 */
export const interestPlanIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const validateInterestPlanId = (req, res, next) => {
  const { error } = interestPlanIdParamSchema.validate(req.params);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

/**
 * STATUS UPDATE VALIDATION
 */
export const updateStatusSchema = Joi.object({
  status: Joi.string().valid("active", "inactive").required(),
});
