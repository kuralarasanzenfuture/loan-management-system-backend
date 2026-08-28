import Joi from "joi";

export const bulkRolePermissionSchema = Joi.object({
  role_id: Joi.number().integer().positive().required(),

  permissions: Joi.array()
    .items(
      Joi.object({
        action_id: Joi.number().integer().positive().required(),
        is_allowed: Joi.boolean().required(),
      }),
    )
    .min(1)
    .unique("action_id")
    .required(),
});

export const roleIdParamSchema = Joi.object({
  roleId: Joi.number().integer().positive().required(),
});
