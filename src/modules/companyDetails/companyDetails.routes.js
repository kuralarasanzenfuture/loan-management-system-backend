import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createCompany,
  getCompany,
  updateCompany,
  deleteCompany,
  getCompanyById,
} from "./companyDetails.controller.js";
import { companyUpload } from "../../middlewares/companyDetails.upload.js";

const router = express.Router();

// CREATE
router.post("/", verifyToken, companyUpload, createCompany);

// READ (single company)
router.get("/", verifyToken, getCompany);

// READ (single company)
router.get("/:id", verifyToken, getCompanyById);

// UPDATE
router.put("/:id", verifyToken, companyUpload, updateCompany);

// DELETE
router.delete("/:id", verifyToken, deleteCompany);

export default router;
