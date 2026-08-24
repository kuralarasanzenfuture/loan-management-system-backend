import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import {
  getDashboardOverview,
  getPortfolioTrends,
  getLoanPlanMix,
  getPortfolioHealth,
  getQuickInsights,
  getRecentLoans,
  getTopLoanOfficers,
} from "./dashboard.controller.js";

const router = express.Router();

router.get("/overview", verifyToken, getDashboardOverview);

router.get("/portfolio-trends", verifyToken, getPortfolioTrends);

router.get("/loan-plan-mix", verifyToken, getLoanPlanMix);

router.get("/portfolio-health", verifyToken, getPortfolioHealth);

router.get("/recent-loans", verifyToken, getRecentLoans);
router.get("/quick-insights", verifyToken, getQuickInsights);
router.get("/top-officers", verifyToken, getTopLoanOfficers);

export default router;
