import Joi from "joi";

export const createCustomerSchema = Joi.object({
  first_name: Joi.string().max(100).required(),

  last_name: Joi.string().max(100).allow("", null),

  father_name: Joi.string().max(150).allow("", null),

  mother_name: Joi.string().max(150).allow("", null),

  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),

  alternate_mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("", null),

  aadhaar_no: Joi.string()
    .length(12)
    .pattern(/^[0-9]+$/)
    .allow("", null),

  pan_no: Joi.string().length(10).uppercase().allow("", null),

  dob: Joi.alternatives().try(Joi.date(), Joi.string().allow("", null)),

  gender: Joi.string().valid("male", "female", "other", "").allow("", null),

  occupation: Joi.string().max(100).allow("", null),

  monthly_income: Joi.alternatives()
    .try(Joi.number().min(0), Joi.string().allow("", null))
    .default(0),

  address: Joi.string().allow("", null),

  city: Joi.string().max(100).allow("", null),

  district: Joi.string().max(100).allow("", null),

  state: Joi.string().max(100).allow("", null),

  pincode: Joi.string().max(10).allow("", null),

  reference_name: Joi.string().max(150).allow("", null),

  reference_mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("", null),

  remarks: Joi.string().allow("", null),

  status: Joi.string()
    .valid("active", "inactive", "blocked", "")
    .allow("", null)
    .default("active"),
});

export const updateCustomerSchema = createCustomerSchema.fork(
  Object.keys(createCustomerSchema.describe().keys),
  (field) => field.optional(),
);

// 🔹 Validate that :id is a positive integer
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const validateIdParam = (req, res, next) => {
  const { error } = idParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};
