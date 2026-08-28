import Joi from "joi";

export const bulkUserPermissionSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),

  permissions: Joi.array()
    .items(
      Joi.object({
        action_id: Joi.number().integer().positive().required(),
        is_allowed: Joi.boolean().required(),
      }).unknown(false),
    )
    .min(1)
    .required(),
}).unknown(false);

export const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});
