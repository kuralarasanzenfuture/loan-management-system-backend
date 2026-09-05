import Joi from "joi";

/**
 * CREATE PAYMENT
 */
export const createPaymentSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required(),

  schedule_id: Joi.number().integer().positive().allow(null),

  payment_date: Joi.date().iso().required(),

  payment_amount: Joi.number().positive().required(),

  payment_mode: Joi.string()
    .valid("cash", "bank", "upi", "cheque", "other")
    .required(),

  transaction_reference: Joi.string().allow("", null),

  cheque_number: Joi.when("payment_mode", {
    is: "cheque",
    then: Joi.string().required(),
    otherwise: Joi.string().allow("", null),
  }),

  remarks: Joi.string().allow("", null),
});

/**
 * PAYMENT ID PARAM
 */
export const paymentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const validatePaymentIdParam = (req, res, next) => {
  const { error } = paymentIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

/**
 * LOAN ID PARAM
 */
export const paymentLoanIdParamSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required(),
});

export const validatePaymentLoanIdParam = (req, res, next) => {
  const { error } = paymentLoanIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};
