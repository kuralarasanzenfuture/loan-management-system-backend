import Joi from "joi";

/**
 * Validation schema for creating an Interest Loan Plan
 */
export const createInterestLoanPlanSchema = Joi.object({
  plan_name: Joi.string().trim().max(100).required().messages({
    "string.empty": "Plan name is required",
    "string.max": "Plan name must not exceed 100 characters",
    "any.required": "Plan name is required",
  }),

  plan_code: Joi.string().trim().max(50).uppercase().optional().allow("", null),

  interest_type: Joi.string()
    .valid("percentage", "fixed")
    .default("percentage"),

  interest_value: Joi.number().min(0).precision(4).required().messages({
    "number.base": "Interest value must be a number",
    "number.min": "Interest value cannot be negative",
    "any.required": "Interest value is required",
  }),

  interest_frequency: Joi.string()
    .valid("daily", "weekly", "monthly", "yearly")
    .default("monthly"),

  calculation_method: Joi.string().valid("simple").default("simple"),

  principal_basis: Joi.string()
    .valid("original_principal", "outstanding_principal")
    .default("outstanding_principal"),

  payment_type: Joi.string().valid("anytime").default("anytime"),

  status: Joi.string().valid("active", "inactive").default("active"),

  description: Joi.string().trim().allow("", null).default(null),
});

/**
 * Validation schema for updating an Interest Loan Plan
 */
export const updateInterestLoanPlanSchema = Joi.object({
  plan_name: Joi.string().trim().max(100).optional().messages({
    "string.max": "Plan name must not exceed 100 characters",
  }),

  plan_code: Joi.string().trim().max(50).uppercase().optional().allow("", null),

  interest_type: Joi.string().valid("percentage", "fixed").optional(),

  interest_value: Joi.number().min(0).precision(4).optional().messages({
    "number.base": "Interest value must be a number",
    "number.min": "Interest value cannot be negative",
  }),

  interest_frequency: Joi.string()
    .valid("daily", "weekly", "monthly", "yearly")
    .optional(),

  calculation_method: Joi.string().valid("simple").optional(),

  principal_basis: Joi.string()
    .valid("original_principal", "outstanding_principal")
    .optional(),

  payment_type: Joi.string().valid("anytime").optional(),

  status: Joi.string().valid("active", "inactive").optional(),

  description: Joi.string().trim().allow("", null).optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

/**
 * Status update schema
 */
export const updateStatusSchema = Joi.object({
  status: Joi.string().valid("active", "inactive").required().messages({
    "any.only": "Status must be either 'active' or 'inactive'",
    "any.required": "Status is required",
  }),
});

/**
 * ID param validation
 */
export const interestLoanPlanIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Plan ID must be a number",
    "number.integer": "Plan ID must be an integer",
    "number.positive": "Plan ID must be positive",
    "any.required": "Plan ID is required",
  }),
});

export const validateInterestLoanPlanId = (req, res, next) => {
  const { error } = interestLoanPlanIdParamSchema.validate(req.params);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};
