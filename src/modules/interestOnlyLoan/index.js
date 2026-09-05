import express from "express";

import loanRoutes from "./loan/interestLoan.routes.js";
import scheduleRoutes from "./schedule/schedule.routes.js";
import paymentRoutes from "./payment/payment.routes.js";

const router = express.Router();

router.use("/interest-only-loans", loanRoutes);
router.use("/interest-only-schedules", scheduleRoutes);
router.use("/interest-only-payments", paymentRoutes);

export { loanRoutes, scheduleRoutes, paymentRoutes };
export default router;
