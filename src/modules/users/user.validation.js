import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().min(10).max(15),
  role_id: Joi.number().required(),
});

export const loginSchema = Joi.object({
  // username: Joi.string().required(),
  loginId: Joi.string().required(), // username OR email OR mobile
  password: Joi.string().required(),
});
