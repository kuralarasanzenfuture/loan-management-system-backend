import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "./assetCategory.controller.js";

const router = express.Router();

router.post("/", verifyToken, createCategory);

router.get("/", verifyToken, getCategories);

router.get("/:id", verifyToken, getCategoryById);

router.put("/:id", verifyToken, updateCategory);

router.delete("/:id", verifyToken, deleteCategory);

export default router;
