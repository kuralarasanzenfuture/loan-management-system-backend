import {
  createLoanPlanSchema,
  updateLoanPlanSchema,
} from "./loanPlan.validation.js";
import { LoanPlanService } from "./loanPlan.service.js";

export const createLoanPlan = async (req, res, next) => {
  try {
    const data = await createLoanPlanSchema.validateAsync(req.body);

    const result = await LoanPlanService.create(data, req.user);

    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const updateLoanPlan = async (req, res, next) => {
  try {
    const data = await updateLoanPlanSchema.validateAsync(req.body);

    const result = await LoanPlanService.update(req.params.id, data, req.user);

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getAllLoanPlans = async (req, res, next) => {
  try {
    const data = await LoanPlanService.getAll();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getLoanPlanById = async (req, res, next) => {
  try {
    const data = await LoanPlanService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteLoanPlan = async (req, res, next) => {
  try {
    const result = await LoanPlanService.delete(req.params.id);

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
