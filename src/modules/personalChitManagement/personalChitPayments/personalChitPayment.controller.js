import PersonalChitPaymentService from "./personalChitPayment.service.js";

import {
  createPaymentSchema,
  updatePaymentSchema,
  generateInstallmentSchema,
  bulkInstallmentSchema,
} from "./personalChitPayment.validation.js";

/* =====================================================
   CREATE PAYMENT
===================================================== */

export const createPayment = async (req, res, next) => {
  try {
    const data = await createPaymentSchema.validateAsync(req.body, { stripUnknown: true });

    const result = await PersonalChitPaymentService.create(
      req.params.id,
      data,
      req.user,
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const generateInstallment = async (req, res, next) => {
  try {
    const data = await generateInstallmentSchema.validateAsync(req.body);

    const result = await PersonalChitPaymentService.generateInstallment(
      req.params.id,
      req.user,
      data,
    );
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   GENERATE INSTALLMENTS (AUTO)
===================================================== */

export const generateInstallments = async (req, res, next) => {
  try {
    const chitId = req.params.id;

    if (!chitId) {
      throw { status: 400, message: "Chit ID is required" };
    }

    const result = await PersonalChitPaymentService.generateFullSchedule(
      chitId,
      req.user,
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   CREATE BULK INSTALLMENTS
===================================================== */

export const createBulkInstallments = async (req, res, next) => {
  try {
    const chitId = req.params.id;

    const data = await bulkInstallmentSchema.validateAsync(req.body);

    const result = await PersonalChitPaymentService.bulkCreateInstallments(
      chitId,
      data,
      req.user,
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   GET ALL PAYMENTS FOR CHIT
===================================================== */

export const getPayments = async (req, res, next) => {
  try {
    const result = await PersonalChitPaymentService.getAll(
      req.params.id,
      req.query,
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
   GET PAYMENT BY ID
===================================================== */

export const getPaymentById = async (req, res, next) => {
  try {
    const result = await PersonalChitPaymentService.getById(
      req.params.id,
      req.params.paymentId,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

/* =====================================================
   UPDATE PAYMENT
===================================================== */

export const updatePayment = async (req, res, next) => {
  try {
    const data = await updatePaymentSchema.validateAsync(req.body, { stripUnknown: true });

    const result = await PersonalChitPaymentService.update(
      req.params.id,
      req.params.paymentId,
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
   DELETE PAYMENT
===================================================== */

export const deletePayment = async (req, res, next) => {
  try {
    const result = await PersonalChitPaymentService.delete(
      req.params.id,
      req.params.paymentId,
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
