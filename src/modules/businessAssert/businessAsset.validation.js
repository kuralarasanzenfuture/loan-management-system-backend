import Joi from "joi";

export const createAssetSchema = Joi.object({
  category_id: Joi.number().required(),

  asset_name: Joi.string().trim().max(150).required(),

  brand: Joi.string().trim().empty("").allow(null).default(null),
  model: Joi.string().trim().empty("").allow(null).default(null),
  serial_number: Joi.string().trim().empty("").allow(null).default(null),

  description: Joi.string().trim().empty("").allow(null).default(null),

  purchase_price: Joi.number().min(0).required(),
  purchase_date: Joi.date().empty("").allow(null).default(null),
  
  quantity: Joi.number().min(0).empty("").allow(null).default(1),

  vendor_name: Joi.string().trim().empty("").allow(null).default(null),
  invoice_number: Joi.string().trim().empty("").allow(null).default(null),

//   current_value: Joi.number().min(0).empty("").allow(null).default(0),

  image: Joi.string().trim().empty("").allow(null).default(null),
  location: Joi.string().trim().empty("").allow(null).default(null),

  condition_status: Joi.string()
    .valid("new", "good", "fair", "damaged")
    .default("new"),
  status: Joi.string()
    .valid("active", "inactive", "sold", "disposed")
    .default("active"),

  remarks: Joi.string().trim().empty("").allow(null).default(null),
});

export const updateAssetSchema = createAssetSchema.fork(
  ["category_id", "asset_name", "purchase_price"],
  (field) => field.optional(),
);
