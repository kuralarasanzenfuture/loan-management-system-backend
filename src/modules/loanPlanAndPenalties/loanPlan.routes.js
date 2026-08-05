import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import {
  createLoanPlan,
  updateLoanPlan,
  getAllLoanPlans,
  getLoanPlanById,
  deleteLoanPlan,
} from "./loanPlan.controller.js";

const router = express.Router();

router.post("/", verifyToken, createLoanPlan);
router.put("/:id", verifyToken, updateLoanPlan);

router.get("/", verifyToken, getAllLoanPlans);
router.get("/:id", verifyToken, getLoanPlanById);

router.delete("/:id", verifyToken, deleteLoanPlan);

export default router;
