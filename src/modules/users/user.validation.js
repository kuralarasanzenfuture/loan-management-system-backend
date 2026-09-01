import Joi from "joi";

/* =========================
   NORMALIZE HELPERS
   ========================= */
// Convert username/email to lowercase so that "John" and "john"
// are always treated as the same value.
const toLower = (value) => (value ? value.toLowerCase() : value);

export const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .custom(toLower, "lowercase username")
    .messages({
      "string.alphanum": "Username must contain only letters and numbers",
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
    // .required()
    .custom(toLower, "lowercase email")
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  mobile: Joi.string()
    .min(10)
    .max(15)
    .pattern(/^[0-9]+$/)
    .messages({
      "string.min": "Mobile number must be at least 10 digits",
      "string.max": "Mobile number must not exceed 15 digits",
      "string.pattern.base": "Mobile number must contain only digits",
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
    .alphanum()
    .min(3)
    .max(30)
    .custom(toLower, "lowercase username")
    .messages({
      "string.alphanum": "Username must contain only letters and numbers",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 30 characters",
    }),
  email: Joi.string().email().custom(toLower, "lowercase email").messages({
    "string.email": "Please provide a valid email address",
  }),
  mobile: Joi.string()
    .min(10)
    .max(15)
    .pattern(/^[0-9]+$/)
    .messages({
      "string.min": "Mobile number must be at least 10 digits",
      "string.max": "Mobile number must not exceed 15 digits",
      "string.pattern.base": "Mobile number must contain only digits",
    }),
  password: Joi.string().min(6).messages({
    "string.min": "Password must be at least 6 characters",
  }),
  role_id: Joi.number().integer().positive().messages({
    "number.base": "Role ID must be a number",
  }),
  status: Joi.string().valid("active", "inactive", "blocked").messages({
    "any.only": "Status must be one of: active, inactive, blocked",
  }),
}).min(1);

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
