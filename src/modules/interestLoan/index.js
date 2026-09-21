import express from "express";
import planRoutes from "./plan/interestLoanPlan.routes.js";
import loanRoutes from "./loan/interestLoan.routes.js";
import periodRoutes from "./period/interestLoanPeriod.routes.js";

const router = express.Router();

router.use("/plans", planRoutes);
router.use("/periods", periodRoutes);
router.use("/loans", loanRoutes);
router.use("/", loanRoutes);

export { planRoutes, loanRoutes, periodRoutes };
export default router;
