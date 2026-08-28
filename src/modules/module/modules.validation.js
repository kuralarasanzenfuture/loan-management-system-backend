import Joi from "joi";

const moduleName = Joi.string().trim().min(1).max(100).required();
const moduleCode = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[A-Z0-9][A-Z0-9_-]*$/)
  .max(100)
  .required();
const parentId = Joi.number().integer().positive().allow(null);

export const createModuleSchema = Joi.object({
  name: moduleName,

  code: moduleCode,

  description: Joi.string().trim().max(255).allow("", null),

  parent_id: parentId,

  sort_order: Joi.number().integer().min(0).default(0),

  is_active: Joi.boolean().default(true),
});

export const updateModuleSchema = Joi.object({
  name: moduleName.optional(),
  code: moduleCode.optional(),
  description: Joi.string().trim().max(255).allow("", null),
  parent_id: parentId,
  sort_order: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
}).min(1);

export const modulesQuerySchema = Joi.object({
  is_active: Joi.boolean(),
});

export const deleteModuleSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
