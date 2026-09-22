import express from "express";
import planRoutes from "./plan/interestLoanPlan.routes.js";
import loanRoutes from "./loan/interestLoan.routes.js";
import periodRoutes from "./period/interestLoanPeriod.routes.js";
import paymentRoutes from "./payment/interestLoanPayment.routes.js";
import cronRoutes from "./cron/interestLoanCron.routes.js";

const router = express.Router();

router.use("/plans", planRoutes);
router.use("/periods", periodRoutes);
router.use("/payments", paymentRoutes);
router.use("/cron", cronRoutes);
router.use("/loans", loanRoutes);
router.use("/", loanRoutes);

export { planRoutes, loanRoutes, periodRoutes, paymentRoutes, cronRoutes };
export default router;


