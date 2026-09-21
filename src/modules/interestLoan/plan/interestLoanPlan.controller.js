import { InterestLoanPlanService } from "./interestLoanPlan.service.js";
import {
  createInterestLoanPlanSchema,
  updateInterestLoanPlanSchema,
  updateStatusSchema,
} from "./interestLoanPlan.validation.js";

/**
 * CREATE PLAN
 */
export const createInterestLoanPlan = async (req, res, next) => {
  try {
    const data = await createInterestLoanPlanSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await InterestLoanPlanService.create(data, req.user);

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
 * GET ALL PLANS (WITH FILTERS & PAGINATION)
 */
export const getAllInterestLoanPlans = async (req, res, next) => {
  try {
    const result = await InterestLoanPlanService.getAll(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ACTIVE PLANS (FOR SELECTION IN LOAN FORMS)
 */
export const getActiveInterestLoanPlans = async (req, res, next) => {
  try {
    const result = await InterestLoanPlanService.getActive();

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PLAN BY ID
 */
export const getInterestLoanPlanById = async (req, res, next) => {
  try {
    const result = await InterestLoanPlanService.getById(req.params.id);

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
export const updateInterestLoanPlan = async (req, res, next) => {
  try {
    const data = await updateInterestLoanPlanSchema.validateAsync(req.body, {
      stripUnknown: true,
    });

    const result = await InterestLoanPlanService.update(
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
export const updateInterestLoanPlanStatus = async (req, res, next) => {
  try {
    const { status } = await updateStatusSchema.validateAsync(req.body);

    const result = await InterestLoanPlanService.updateStatus(
      req.params.id,
      status,
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
 * DELETE PLAN
 */
export const deleteInterestLoanPlan = async (req, res, next) => {
  try {
    const result = await InterestLoanPlanService.delete(req.params.id);

    res.json({
      success: true,
      id: req.params.id,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};
