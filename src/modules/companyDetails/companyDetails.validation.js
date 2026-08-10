import Joi from "joi";

/* =========================
   COMMON HELPERS
========================= */

const upper = (value) => {
  if (value === null || value === "") return value;
  return value.toUpperCase().trim();
};

const lower = (value) => {
  if (value === null || value === "") return value;
  return value.toLowerCase().trim();
};

const trim = (value) => {
  if (value === null || value === "") return value;
  return value.trim();
};

/* =========================
   SCHEMA
========================= */

export const createCompanySchema = Joi.object({
  // ── Basic Info ──────────────────────────────────
  company_name: Joi.string().max(200).required().custom(trim),

  legal_name: Joi.string().max(250).allow(null, "").custom(trim),
  trade_name: Joi.string().max(200).allow(null, "").custom(trim),

  company_code: Joi.string().max(50).allow(null, "").custom(upper),

  business_type: Joi.string().valid(
    "proprietorship",
    "partnership",
    "llp",
    "private_limited",
    "public_limited",
    "trust",
    "society",
    "other",
  ),

  business_description: Joi.string().allow(null, "").custom(trim),

  establishment_date: Joi.date().allow(null, ""),

  status: Joi.string().valid("active", "inactive"),

  // ── Registration ────────────────────────────────
  /* 🔥 GST: 15-char strict format */
  gst_number: Joi.string()
    .length(15)
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/)
    .allow(null, "")
    .custom(upper),

  /* 🔥 PAN: 10-char strict format */
  pan_number: Joi.string()
    .length(10)
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .allow(null, "")
    .custom(upper),

  // ── Contact ──────────────────────────────────────
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow(null, "")
    .custom(trim),

  alternate_phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow(null, "")
    .custom(trim),

  email: Joi.string().email().allow(null, "").custom(lower),
  alternate_email: Joi.string().email().allow(null, "").custom(lower),

  website: Joi.string().uri().allow(null, "").custom(lower),

  // ── Address ─────────────────────────────────────
  address_line_1: Joi.string().max(255).allow(null, "").custom(trim),
  address_line_2: Joi.string().max(255).allow(null, "").custom(trim),

  landmark: Joi.string().max(150).allow(null, "").custom(trim),
  city: Joi.string().max(100).allow(null, "").custom(trim),
  taluk: Joi.string().max(100).allow(null, "").custom(trim),
  district: Joi.string().max(100).allow(null, "").custom(trim),
  state: Joi.string().max(100).allow(null, "").custom(trim),
  state_code: Joi.string().max(10).allow(null, "").custom(trim),
  country: Joi.string().max(100).allow(null, "").custom(trim),

  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .allow(null, "")
    .custom(trim),

  latitude: Joi.number().allow(null, ""),
  longitude: Joi.number().allow(null, ""),

  // ── Business Hours ───────────────────────────────
  business_start_time: Joi.string().allow(null, ""),
  business_end_time: Joi.string().allow(null, ""),

  working_days: Joi.string().allow(null, "").custom(trim),
  weekly_off_day: Joi.string().allow(null, "").custom(trim),

  timezone: Joi.string().max(60).allow(null, "").custom(trim),

  // ── Branding (file paths, set by controller from multer) ──
  logo: Joi.string().allow(null, ""),
  favicon: Joi.string().allow(null, ""),
  stamp_image: Joi.string().allow(null, ""),
  signature_image: Joi.string().allow(null, ""),

  // ── Social ──────────────────────────────────────
  facebook_url: Joi.string().uri().allow(null, "").custom(lower),
  instagram_url: Joi.string().uri().allow(null, "").custom(lower),
  youtube_url: Joi.string().uri().allow(null, "").custom(lower),
  whatsapp_number: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .allow(null, "")
    .custom(trim),
}).options({ stripUnknown: true });

/* =========================
   UPDATE (all fields optional)
========================= */

export const updateCompanySchema = createCompanySchema.fork(
  ["company_name"],
  (field) => field.optional(),
);
