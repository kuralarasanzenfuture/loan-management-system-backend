import express from "express";

import companyDetailsRoutes from "../modules/companyDetails/companyDetails.routes.js";
import companyBankRoutes from "../modules/companyBanks/companyBank.routes.js";
import bankTransactionRoutes from "../modules/bankTransaction/bankTransaction.routes.js";
import roleRoutes from "../modules/roles/role.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import customerRoutes from "../modules/customers/customer.routes.js";
import loanPlanRoutes from "../modules/loanPlanAndPenalties/loanPlan.routes.js";
import loanRoutes from "../modules/customersLoan/loan.routes.js";
import loanInstallmentsRoutes from "../modules/loanInstallments/installment.routes.js";
import assetCategoryRoutes from "../modules/assetCategory/assetCategory.routes.js";
import assetRoutes from "../modules/businessAssert/businessAsset.routes.js";
import handLoanRoutes from "../modules/handLoan/handLoan.routes.js";
import personalChitRoutes from "../modules/personalChitManagement/personalChit/personalChit.routes.js";
import personalChitPaymentRoutes from "../modules/personalChitManagement/personalChitPayments/personalChitPayment.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import modulesRoutes from "../modules/module/modules.routes.js";

const router = express.Router();
router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/loan-plans", loanPlanRoutes);
router.use("/customer-loans", loanRoutes);
router.use("/loan-installments", loanInstallmentsRoutes);
router.use("/company-details", companyDetailsRoutes);
router.use("/company-banks", companyBankRoutes);
router.use("/bank-transactions", bankTransactionRoutes);
router.use("/asset-categories", assetCategoryRoutes);
router.use("/assets", assetRoutes);
router.use("/hand-loans", handLoanRoutes);
router.use("/personal-chits", personalChitRoutes);
router.use("/personal-chit-payments", personalChitPaymentRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/modules", modulesRoutes);

router.use((req, res, next) => {
  res.status(404).send("Route not found");
});

router.get("/", (req, res) => {
  res.send("API Server Running");
});

export default router;
