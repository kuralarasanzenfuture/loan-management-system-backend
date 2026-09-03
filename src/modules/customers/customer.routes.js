import express from "express";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  deleteCustomerPhoto,
  deleteCustomerDocument,
  deleteCustomerDocumentByType,
} from "./customer.controller.js";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { customerUpload } from "../../middlewares/customer.upload.js";
import {
  validateIdParam,
  validateDocumentIdParam,
  validateDocumentTypeParam,
} from "./customer.validation.js";

const router = express.Router();

router.use(verifyToken);

// ── CRUD Customer ──
router.post("/", customerUpload, createCustomer);
router.get("/", getCustomers);
router.get("/:id", validateIdParam, getCustomer);
router.put("/:id", validateIdParam, customerUpload, updateCustomer);
router.delete("/:id", validateIdParam, deleteCustomer);

// ── Delete Image / Photo Only ──
router.delete("/:id/photo", validateIdParam, deleteCustomerPhoto);
router.delete("/:id/image", validateIdParam, deleteCustomerPhoto);

// ── Delete Customer Document Only ──
router.delete(
  "/:id/documents/:documentId",
  validateDocumentIdParam,
  deleteCustomerDocument,
);
router.delete(
  "/:id/documents/type/:documentType",
  validateDocumentTypeParam,
  deleteCustomerDocumentByType,
);

export default router;
