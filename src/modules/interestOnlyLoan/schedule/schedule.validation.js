import Joi from "joi";

export const scheduleLoanIdParamSchema = Joi.object({
  loan_id: Joi.number().integer().positive().required(),
});

export const validateScheduleLoanIdParam = (req, res, next) => {
  const { error } = scheduleLoanIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

export const scheduleIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const validateScheduleIdParam = (req, res, next) => {
  const { error } = scheduleIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};
