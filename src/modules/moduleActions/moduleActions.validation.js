import Joi from "joi";

export const createModuleActionSchema = Joi.object({
  module_id: Joi.number().integer().positive().required(),

  action_code: Joi.string().trim().uppercase().min(1).max(50).required(),

  action_name: Joi.string().trim().min(1).max(100).required(),

  description: Joi.string().trim().max(255).allow("", null),

  is_active: Joi.boolean().default(true),
});

export const updateModuleActionSchema = Joi.object({
  module_id: Joi.number().integer().positive(),
  action_code: Joi.string().trim().uppercase().min(1).max(50),
  action_name: Joi.string().trim().min(1).max(100),
  description: Joi.string().trim().max(255).allow("", null),
  is_active: Joi.boolean(),
}).min(1);

export const moduleActionQuerySchema = Joi.object({
  module_id: Joi.number().integer().positive(),
  is_active: Joi.boolean(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const moduleIdParamSchema = Joi.object({
  module_id: Joi.number().integer().positive().required(),
});
