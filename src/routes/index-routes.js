import express from "express";

import companyDetailsRoutes from "../modules/companyDetails/companyDetails.routes.js";
import roleRoutes from "../modules/roles/role.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import customerRoutes from "../modules/customers/customer.routes.js";
import loanPlanRoutes from "../modules/loanPlanAndPenalties/loanPlan.routes.js";
import loanRoutes from "../modules/customersLoan/loan.routes.js";
import loanInstallmentsRoutes from "../modules/loanInstallments/installment.routes.js";

const router = express.Router();
router.use("/company-details", companyDetailsRoutes);
router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/loan-plans", loanPlanRoutes);
router.use("/customer-loans", loanRoutes);
router.use("/loan-installments", loanInstallmentsRoutes);


router.get("/", (req, res) => {
    res.send("API Server Running");
});

export default router;