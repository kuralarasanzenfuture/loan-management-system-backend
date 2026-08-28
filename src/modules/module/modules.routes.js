import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
  toggleModuleStatus,
  getModuleTree,
} from "./modules.controller.js";

const router = express.Router();

/* =========================
   CREATE
========================= */
router.post("/", verifyToken, createModule);

/* =========================
   READ
========================= */
router.get("/", verifyToken, getModules); // flat list
router.get("/tree", verifyToken, getModuleTree); // hierarchy
router.get("/:id", verifyToken, getModuleById);

/* =========================
   UPDATE
========================= */
router.put("/:id", verifyToken, updateModule);
router.patch("/:id/status", verifyToken, toggleModuleStatus);

/* =========================
   DELETE
========================= */
router.delete("/:id", verifyToken, deleteModule);

export default router;
