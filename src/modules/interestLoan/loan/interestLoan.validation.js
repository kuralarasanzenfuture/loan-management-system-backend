import Joi from "joi";

/**
 * Validation schema for creating an Interest Loan
 * Status is NOT manually editable - it is automatically set to 'active'.
 */
export const createInterestLoanSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    "number.base": "Customer ID must be a number",
    "number.positive": "Customer ID must be positive",
    "any.required": "Customer ID is required",
  }),

  interest_plan_id: Joi.number().integer().positive().required().messages({
    "number.base": "Interest Plan ID must be a number",
    "number.positive": "Interest Plan ID must be positive",
    "any.required": "Interest Plan ID is required",
  }),

  principal_amount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Principal amount must be a number",
    "number.positive": "Principal amount must be greater than 0",
    "any.required": "Principal amount is required",
  }),

  start_date: Joi.date().iso().required().messages({
    "date.base": "Start date must be a valid date (YYYY-MM-DD)",
    "date.format": "Start date must be in ISO format (YYYY-MM-DD)",
    "any.required": "Start date is required",
  }),

  remarks: Joi.string().trim().allow("", null).default(null),
});

/**
 * Validation schema for updating an Interest Loan
 */
export const updateInterestLoanSchema = Joi.object({
  principal_amount: Joi.number().positive().precision(2).optional().messages({
    "number.base": "Principal amount must be a number",
    "number.positive": "Principal amount must be greater than 0",
  }),

  start_date: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid date (YYYY-MM-DD)",
  }),

  interest_plan_id: Joi.number().integer().positive().optional().messages({
    "number.base": "Interest Plan ID must be a number",
    "number.positive": "Interest Plan ID must be positive",
  }),

  remarks: Joi.string().trim().allow("", null).optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

/**
 * Validate loan ID parameter
 */
export const interestLoanIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Loan ID must be a number",
    "number.positive": "Loan ID must be positive",
    "any.required": "Loan ID is required",
  }),
});

export const validateInterestLoanId = (req, res, next) => {
  const { error } = interestLoanIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

/**
 * Validate customer ID parameter
 */
export const customerIdParamSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    "number.base": "Customer ID must be a number",
    "number.positive": "Customer ID must be positive",
    "any.required": "Customer ID is required",
  }),
});

export const validateCustomerId = (req, res, next) => {
  const { error } = customerIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};
