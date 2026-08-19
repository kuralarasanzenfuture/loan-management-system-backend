import Joi from "joi";

/* =====================================================
   CREATE PERSONAL CHIT
===================================================== */

export const createChitSchema = Joi.object({
  /* =====================================================
     CHIT INFORMATION
  ===================================================== */

  chit_name: Joi.string().trim().max(150).required(),

  chit_provider: Joi.string().trim().max(200).required(),

  provider_mobile: Joi.string().trim().max(20).allow("", null).default(null),

  provider_alternate_mobile: Joi.string()
    .trim()
    .max(20)
    .allow("", null)
    .default(null),

  provider_address: Joi.string().trim().max(500).allow("", null).default(null),

  /* =====================================================
     CHIT VALUE
  ===================================================== */

  chit_amount: Joi.number().positive().required(),

  /* =====================================================
     PAYMENT SCHEDULE
  ===================================================== */

  payment_schedule_type: Joi.string()
    .trim()
    .lowercase()
    .valid("auto", "manual")
    .default("manual"),

  payment_frequency: Joi.string()
    .trim()
    .lowercase()
    .valid("weekly", "monthly", "quarterly", "custom")
    .default("monthly"),

  payment_interval: Joi.number().integer().positive().default(1),

  /* =====================================================
     DATES
  ===================================================== */

  start_date: Joi.date().required(),

  expected_end_date: Joi.date().allow("", null).default(null),

  actual_end_date: Joi.date().allow("", null).default(null),

  /* =====================================================
     CHIT TAKEN
  ===================================================== */

  is_taken: Joi.boolean().default(false),

  taken_date: Joi.date().allow("", null).default(null),

  chit_received_amount: Joi.number().min(0).default(0),

  /* =====================================================
     SUMMARY

     These should normally NOT come from frontend.
     Backend calculates them.
  ===================================================== */

  total_paid_amount: Joi.number().min(0).default(0),

  total_pending_amount: Joi.number().min(0).default(0),

  total_members: Joi.number().integer().min(0).default(0),

  /* =====================================================
     STATUS
  ===================================================== */

  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "completed", "cancelled")
    .default("active"),

  /* =====================================================
     REMARKS
  ===================================================== */

  remarks: Joi.string().trim().allow("", null).default(null),
});

/* =====================================================
   UPDATE PERSONAL CHIT
   Partial update — NO DEFAULTS
===================================================== */

export const updateChitSchema = Joi.object({
  /* =====================================================
     CHIT INFORMATION
  ===================================================== */

  chit_name: Joi.string().trim().max(150),

  chit_provider: Joi.string().trim().max(200),

  provider_mobile: Joi.string().trim().max(20).allow("", null),

  provider_alternate_mobile: Joi.string().trim().max(20).allow("", null),

  provider_address: Joi.string().trim().max(500).allow("", null),

  /* =====================================================
     CHIT VALUE
  ===================================================== */

  chit_amount: Joi.number().positive(),

  /* =====================================================
     PAYMENT SCHEDULE
  ===================================================== */

  payment_schedule_type: Joi.string()
    .trim()
    .lowercase()
    .valid("auto", "manual"),

  payment_frequency: Joi.string()
    .trim()
    .lowercase()
    .valid("weekly", "monthly", "quarterly", "custom"),

  payment_interval: Joi.number().integer().positive(),

  /* =====================================================
     DATES
  ===================================================== */

  start_date: Joi.date(),

  expected_end_date: Joi.date().allow("", null),

  actual_end_date: Joi.date().allow("", null),

  /* =====================================================
     CHIT TAKEN
  ===================================================== */

  is_taken: Joi.boolean(),

  taken_date: Joi.date().allow("", null),

  chit_received_amount: Joi.number().min(0),

  /* =====================================================
     SUMMARY

     Prefer NOT allowing these in normal update API.
  ===================================================== */

  total_paid_amount: Joi.number().min(0),

  total_pending_amount: Joi.number().min(0),

  /* =====================================================
     STATUS
  ===================================================== */

  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "completed", "cancelled"),

  /* =====================================================
     REMARKS
  ===================================================== */

  remarks: Joi.string().trim().allow("", null),
});

/* =====================================================
   UPDATE STATUS
===================================================== */

export const updateChitStatusSchema = Joi.object({
  status: Joi.string()
    .trim()
    .lowercase()
    .valid("active", "completed", "cancelled")
    .required(),
});

/* =====================================================
   MARK CHIT AS TAKEN
===================================================== */

export const markChitTakenSchema = Joi.object({
  taken_date: Joi.date().required(),

  chit_received_amount: Joi.number().min(0).required(),

  remarks: Joi.string().trim().allow("", null).default(null),
});
