import { InterestOnlyLoanPlanService } from "./interestLoanPlan.service.js";
import {
  createInterestOnlyLoanPlanSchema,
  updateInterestOnlyLoanPlanSchema,
  updateStatusSchema,
} from "./interestLoanPlan.validation.js";

/**
 * CREATE PLAN
 */
export const createInterestOnlyLoanPlan = async (req, res, next) => {
  try {
    const data = await createInterestOnlyLoanPlanSchema.validateAsync(
      req.body,
      { stripUnknown: true },
    );

    const result = await InterestOnlyLoanPlanService.create(data, req.user);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL (WITH FILTERS)
 */
export const getAllInterestOnlyLoanPlans = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanPlanService.getAll(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ACTIVE ONLY
 */
export const getActiveInterestOnlyLoanPlans = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanPlanService.getActive();

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET BY ID
 */
export const getInterestOnlyLoanPlanById = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanPlanService.getById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE PLAN
 */
export const updateInterestOnlyLoanPlan = async (req, res, next) => {
  try {
    const data = await updateInterestOnlyLoanPlanSchema.validateAsync(
      req.body,
      { stripUnknown: true },
    );

    const result = await InterestOnlyLoanPlanService.update(
      req.params.id,
      data,
      req.user,
    );

    res.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE STATUS ONLY
 */
export const updateInterestOnlyLoanPlanStatus = async (req, res, next) => {
  try {
    const { status } = await updateStatusSchema.validateAsync(req.body);

    const result = await InterestOnlyLoanPlanService.updateStatus(
      req.params.id,
      status,
      req.user,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE PLAN
 */
export const deleteInterestOnlyLoanPlan = async (req, res, next) => {
  try {
    const result = await InterestOnlyLoanPlanService.delete(req.params.id);

    res.json({
      success: true,
      id: req.params.id,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
