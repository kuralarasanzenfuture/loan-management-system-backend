import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string()
    .uppercase()
    .pattern(/^[A-Z_]+$/)
    .min(3)
    .max(50)
    .required(),

  description: Joi.string().max(500).allow("", null),

  status: Joi.string().valid("active", "inactive").default("active"),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string()
    .uppercase()
    .pattern(/^[A-Z_]+$/)
    .min(3)
    .max(50),

  description: Joi.string().max(500).allow("", null),

  status: Joi.string().valid("active", "inactive"),
});
