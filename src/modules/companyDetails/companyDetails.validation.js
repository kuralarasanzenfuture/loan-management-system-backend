import Joi from "joi";

/* =========================
   COMMON HELPERS
========================= */

const upper = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value).toUpperCase().trim();
};

const lower = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value).toLowerCase().trim();
};

const trim = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
};

const urlSanitizer = (value) => {
  if (value === null || value === undefined || value === "") return null;
  let trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed.toLowerCase();
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

  business_type: Joi.string()
    .valid(
      "proprietorship",
      "partnership",
      "llp",
      "private_limited",
      "public_limited",
      "trust",
      "society",
      "other",
    )
    .default("proprietorship"),

  business_description: Joi.string().allow(null, "").custom(trim),

  establishment_date: Joi.date().allow(null, "").empty(""),

  status: Joi.string().valid("active", "inactive").default("active"),

  // ── Registration ────────────────────────────────
  gst_number: Joi.string()
    .length(15)
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/)
    .allow(null, "")
    .empty("")
    .custom(upper),

  pan_number: Joi.string()
    .length(10)
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .allow(null, "")
    .empty("")
    .custom(upper),

  // ── Contact ──────────────────────────────────────
  phone: Joi.string()
    .pattern(/^(\+?[0-9]{1,4}[\s-]?)?[0-9]{6,14}$/)
    .allow(null, "")
    .empty("")
    .custom(trim),

  alternate_phone: Joi.string()
    .pattern(/^(\+?[0-9]{1,4}[\s-]?)?[0-9]{6,14}$/)
    .allow(null, "")
    .empty("")
    .custom(trim),

  email: Joi.string().email().allow(null, "").empty("").custom(lower),
  alternate_email: Joi.string().email().allow(null, "").empty("").custom(lower),

  website: Joi.string().allow(null, "").empty("").custom(urlSanitizer),

  // ── Address ─────────────────────────────────────
  address_line_1: Joi.string().max(255).allow(null, "").custom(trim),
  address_line_2: Joi.string().max(255).allow(null, "").custom(trim),

  landmark: Joi.string().max(150).allow(null, "").custom(trim),
  city: Joi.string().max(100).allow(null, "").custom(trim),
  taluk: Joi.string().max(100).allow(null, "").custom(trim),
  district: Joi.string().max(100).allow(null, "").custom(trim),
  state: Joi.string().max(100).allow(null, "").custom(trim),
  state_code: Joi.string().max(10).allow(null, "").custom(trim),
  country: Joi.string().max(100).allow(null, "").default("India").custom(trim),

  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .allow(null, "")
    .empty("")
    .custom(trim),

  latitude: Joi.number().allow(null, "").empty(""),
  longitude: Joi.number().allow(null, "").empty(""),

  // ── Business Hours ───────────────────────────────
  business_start_time: Joi.string().allow(null, "").empty(""),
  business_end_time: Joi.string().allow(null, "").empty(""),

  working_days: Joi.string().allow(null, "").custom(trim),
  weekly_off_day: Joi.string().allow(null, "").custom(trim),

  timezone: Joi.string().max(60).allow(null, "").default("Asia/Kolkata").custom(trim),

  // ── Branding (file paths, set by controller from multer) ──
  logo: Joi.string().allow(null, ""),
  favicon: Joi.string().allow(null, ""),
  stamp_image: Joi.string().allow(null, ""),
  signature_image: Joi.string().allow(null, ""),

  remove_logo: Joi.boolean().allow(null, "").empty(""),
  remove_favicon: Joi.boolean().allow(null, "").empty(""),
  remove_stamp_image: Joi.boolean().allow(null, "").empty(""),
  remove_signature_image: Joi.boolean().allow(null, "").empty(""),

  // ── Social ──────────────────────────────────────
  facebook_url: Joi.string().allow(null, "").empty("").custom(urlSanitizer),
  instagram_url: Joi.string().allow(null, "").empty("").custom(urlSanitizer),
  youtube_url: Joi.string().allow(null, "").empty("").custom(urlSanitizer),
  whatsapp_number: Joi.string()
    .pattern(/^(\+?[0-9]{1,4}[\s-]?)?[0-9]{6,14}$/)
    .allow(null, "")
    .empty("")
    .custom(trim),
}).options({ stripUnknown: true });

/* =========================
   UPDATE (all fields optional)
========================= */

export const updateCompanySchema = createCompanySchema.fork(
  ["company_name"],
  (field) => field.optional(),
);
