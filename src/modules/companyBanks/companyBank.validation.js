import Joi from "joi";

/* =========================
   HELPERS
========================= */

const trim = (v) => (v === "" ? null : typeof v === "string" ? v.trim() : v);
const upper = (v) => (v === "" ? null : typeof v === "string" ? v.toUpperCase().trim() : v);
const lower = (v) => (v === "" ? null : typeof v === "string" ? v.toLowerCase().trim() : v);

const parseBool = (val) => {
  if (val === true || val === "true" || val === "1" || val === 1) return true;
  return false;
};

/* =========================
   CREATE SCHEMA
========================= */

export const createCompanyBankSchema = Joi.object({
  company_id: Joi.any()
    .custom((value) => {
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "null" ||
        value === "undefined"
      ) {
        return null;
      }
      const num = Number(value);
      return isNaN(num) || num <= 0 ? null : num;
    })
    .allow(null)
    .optional(),

  bank_name: Joi.string().max(150).required().custom(trim),

  bank_code: Joi.string().max(50).allow(null, "").custom(upper),

  branch_name: Joi.string().max(150).allow(null, "").custom(trim),
  branch_code: Joi.string().max(50).allow(null, "").custom(upper),

  account_holder_name: Joi.string().max(200).required().custom(trim),

  account_number: Joi.string().max(100).required().custom(trim),

  account_type: Joi.string()
    .valid("savings", "current", "cash_credit", "overdraft", "other")
    .default("current"),

  ifsc_code: Joi.string()
    .length(11)
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .allow(null, "")
    .custom(upper),

  micr_code: Joi.string().max(20).allow(null, "").custom(trim),
  swift_code: Joi.string().max(20).allow(null, "").custom(upper),

  opening_balance: Joi.number().allow(null, "").empty("").default(0),
  current_balance: Joi.number().allow(null, "").empty("").default(0),

  upi_id: Joi.string().allow(null, "").custom(lower),
  upi_qr_code: Joi.string().allow(null, ""),

  account_purpose: Joi.string()
    .valid(
      "business",
      "collection",
      "loan_disbursement",
      "expenses",
      "salary",
      "savings",
      "other",
    )
    .default("business"),

  is_primary: Joi.any().custom(parseBool).default(false),
  is_collection_account: Joi.any().custom(parseBool).default(false),
  is_disbursement_account: Joi.any().custom(parseBool).default(false),

  status: Joi.string().valid("active", "inactive", "closed").default("active"),

  opened_date: Joi.date().allow(null, "").empty(""),
  closed_date: Joi.date().allow(null, "").empty(""),

  remarks: Joi.string().allow(null, ""),
});

/* =========================
   UPDATE SCHEMA
========================= */

export const updateCompanyBankSchema = createCompanyBankSchema.fork(
  ["bank_name", "account_holder_name", "account_number"],
  (field) => field.optional(),
);
