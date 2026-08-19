import PersonalChitService from "./personalChit.service.js";

import {
  createChitSchema,
  updateChitSchema,
  updateChitStatusSchema,
  markChitTakenSchema,
} from "./personalChit.validation.js";

/* =====================================================
   CREATE CHIT
===================================================== */

export const createChit = async (req, res, next) => {
  try {
    const data = await createChitSchema.validateAsync(req.body);

    const result = await PersonalChitService.create(data, req.user);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   GET ALL CHITS
   Supports filters through req.query
===================================================== */

export const getChits = async (req, res, next) => {
  try {
    const result = await PersonalChitService.getAll(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   GET CHIT BY ID
===================================================== */

export const getChitById = async (req, res, next) => {
  try {
    const result = await PersonalChitService.getById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   UPDATE CHIT
===================================================== */

export const updateChit = async (req, res, next) => {
  try {
    const data = await updateChitSchema.validateAsync(req.body);

    const result = await PersonalChitService.update(
      req.params.id,
      data,
      req.user,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   UPDATE CHIT STATUS
===================================================== */

export const updateChitStatus = async (req, res, next) => {
  try {
    const data = await updateChitStatusSchema.validateAsync(req.body);

    const result = await PersonalChitService.updateStatus(
      req.params.id,
      data,
      req.user,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   MARK CHIT AS TAKEN
===================================================== */

export const markChitTaken = async (req, res, next) => {
  try {
    const data = await markChitTakenSchema.validateAsync(req.body);

    const result = await PersonalChitService.markTaken(
      req.params.id,
      data,
      req.user,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   DELETE CHIT
===================================================== */

export const deleteChit = async (req, res, next) => {
  try {
    const result = await PersonalChitService.delete(req.params.id, req.user);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   SUMMARY
===================================================== */

export const getChitSummary = async (req, res, next) => {
  try {
    const result = await PersonalChitService.getSummary(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   UPCOMING PAYMENTS
===================================================== */

export const getUpcomingPayments = async (req, res, next) => {
  try {
    const result = await PersonalChitService.getUpcomingPayments(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   OVERDUE PAYMENTS
===================================================== */

export const getOverduePayments = async (req, res, next) => {
  try {
    const result = await PersonalChitService.getOverduePayments(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};
