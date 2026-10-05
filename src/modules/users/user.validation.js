import Joi from "joi";

/* =========================
   NORMALIZE HELPERS
   ========================= */
// Convert username/email to lowercase so that "John" and "john"
// are always treated as the same value.
const toLower = (value) => (value ? value.toLowerCase() : value);

export const registerSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .min(3)
    .max(30)
    .required()
    .custom(toLower, "lowercase username")
    .messages({
      "string.pattern.base": "Username can only contain letters, numbers, underscores, dots, or hyphens",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 30 characters",
      "any.required": "Username is required",
    }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  email: Joi.string()
    .email()
    .allow("", null)
    .custom(toLower, "lowercase email")
    .messages({
      "string.email": "Please provide a valid email address",
    }),
  mobile: Joi.string()
    .min(10)
    .max(15)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.min": "Mobile number must be at least 10 digits",
      "string.max": "Mobile number must not exceed 15 digits",
      "string.pattern.base": "Mobile number must contain only digits",
      "any.required": "Mobile number is required",
    }),
  role_id: Joi.number().integer().positive().required().messages({
    "any.required": "Role ID is required",
  }),
  status: Joi.string().valid("active", "inactive", "blocked").default("active"),
});

export const loginSchema = Joi.object({
  loginId: Joi.string().required().custom(toLower, "lowercase loginId"),
  password: Joi.string().required(),
});

/* =========================
   UPDATE SCHEMA
   ========================= */
export const updateUserSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .min(3)
    .max(30)
    .required()
    .custom(toLower, "lowercase username")
    .messages({
      "string.pattern.base": "Username can only contain letters, numbers, underscores, dots, or hyphens",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 30 characters",
      "any.required": "Username is required",
    }),
  email: Joi.string()
    .email()
    .allow("", null)
    .custom(toLower, "lowercase email")
    .messages({
      "string.email": "Please provide a valid email address",
    }),
  mobile: Joi.string()
    .min(10)
    .max(15)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.min": "Mobile number must be at least 10 digits",
      "string.max": "Mobile number must not exceed 15 digits",
      "string.pattern.base": "Mobile number must contain only digits",
      "any.required": "Mobile number is required",
    }),
  password: Joi.string().min(6).allow("", null).messages({
    "string.min": "Password must be at least 6 characters",
  }),
  role_id: Joi.number().integer().positive().required().messages({
    "number.base": "Role ID must be a number",
    "any.required": "Role ID is required",
  }),
  status: Joi.string().valid("active", "inactive", "blocked").messages({
    "any.only": "Status must be one of: active, inactive, blocked",
  }),
});

export const userIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid("active", "inactive", "blocked").required(),
}).required();

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).max(72).required(),
}).required();
