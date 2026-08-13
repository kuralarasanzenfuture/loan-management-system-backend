import Joi from "joi";

const clean = (value) => {
  if (typeof value === "string") {
    value = value.trim();
    return value === "" ? null : value;
  }
  return value;
};

export const createCategorySchema = Joi.object({
  category_name: Joi.string().max(100).required().custom(clean).uppercase(),

  description: Joi.string().max(255).allow(null, "").custom(clean),

  status: Joi.string().valid("active", "inactive"),
});

export const updateCategorySchema = createCategorySchema.fork(
  ["category_name"],
  (f) => f.optional(),
);
