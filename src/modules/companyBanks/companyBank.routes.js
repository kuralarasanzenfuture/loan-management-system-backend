import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createCompanyBank,
  getCompanyBanks,
  getCompanyBankById,
  updateCompanyBank,
  deleteCompanyBank,
  setPrimaryBank,
} from "./companyBank.controller.js";
import { companyBankUpload } from "../../middlewares/companyBank.upload.js";

const router = express.Router();

// 1. Create company bank
router.post("/", verifyToken, companyBankUpload, createCompanyBank);

// 2. Get all company banks
router.get("/", verifyToken, getCompanyBanks);

// 3. Get single company bank by ID
router.get("/:id", verifyToken, getCompanyBankById);

// 4. Set primary company bank (supports PUT and PATCH for flexibility)
router.put("/:id/primary", verifyToken, setPrimaryBank);
router.patch("/:id/primary", verifyToken, setPrimaryBank);
router.patch("/:id", verifyToken, setPrimaryBank);

// 5. Update company bank by ID
router.put("/:id", verifyToken, companyBankUpload, updateCompanyBank);

// 6. Delete company bank by ID
router.delete("/:id", verifyToken, deleteCompanyBank);

export default router;
