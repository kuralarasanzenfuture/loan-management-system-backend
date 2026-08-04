import express from "express";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "./customer.controller.js";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { customerUpload } from "../../middlewares/customer.upload.js";
import { validateIdParam } from "./customer.validation.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", customerUpload, createCustomer);

router.get("/", getCustomers);

router.get("/:id", validateIdParam, getCustomer);

router.put("/:id", validateIdParam, customerUpload, updateCustomer);

router.delete("/:id", validateIdParam, deleteCustomer);

export default router;
