import express from "express";

import roleRoutes from "../modules/roles/role.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import customerRoutes from "../modules/customers/customer.routes.js";
import loanPlanRoutes from "../modules/loanPlanAndPenalties/loanPlan.routes.js";

const router = express.Router();

router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/loan-plans", loanPlanRoutes);

router.get("/", (req, res) => {
    res.send("API Server Running");
});

export default router;