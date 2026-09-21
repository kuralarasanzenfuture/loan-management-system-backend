import Joi from "joi";

/**
 * Validate loan_id param
 */
export const loanIdParamSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required().messages({
    "number.base": "Loan ID must be a number",
    "number.positive": "Loan ID must be positive",
    "any.required": "Loan ID is required",
  }),
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
 * Validate period ID param
 */
export const periodIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Period ID must be a number",
    "number.positive": "Period ID must be positive",
    "any.required": "Period ID is required",
  }),
});

export const validatePeriodIdParam = (req, res, next) => {
  const { error } = periodIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};
