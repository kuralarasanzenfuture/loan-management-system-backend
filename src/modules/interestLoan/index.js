import express from "express";
import planRoutes from "./plan/interestLoanPlan.routes.js";

const router = express.Router();

router.use("/plans", planRoutes);

export { planRoutes };
export default router;
