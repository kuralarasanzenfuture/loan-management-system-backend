import Joi from "joi";

/**
 * CREATE LOAN
 */
export const createInterestLoanSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),

  interest_plan_id: Joi.number().integer().positive().required(),

  principal_amount: Joi.number().positive().required(),

  start_date: Joi.date().iso().required(),

  // Optional overrides (else taken from plan)
  interest_rate: Joi.number().min(0).optional(),
  interest_type: Joi.string().valid("fixed", "percentage").optional(),
  interest_frequency: Joi.string()
    .valid("monthly", "quarterly", "half_yearly", "yearly")
    .optional(),

  tenure: Joi.number().integer().positive().optional(),
  tenure_type: Joi.string().valid("months", "years").optional(),

  commission_amount: Joi.number().min(0).optional(),

  status: Joi.string()
    .valid("active", "completed", "closed", "default", "cancelled")
    .default("active"),
});

/**
 * UPDATE STATUS
 */
export const updateLoanStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "completed", "closed", "default", "cancelled")
    .required(),
});

/**
 * ID PARAM VALIDATION
 */
export const loanIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const validateLoanIdParam = (req, res, next) => {
  const { error } = loanIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

/**
 * CUSTOMER ID PARAM VALIDATION
 */
export const customerIdParamSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
});

export const validateCustomerIdParam = (req, res, next) => {
  const { error } = customerIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};
