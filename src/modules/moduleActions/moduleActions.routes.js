import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createModuleAction,
  getAllModuleActions,
  getModuleActionById,
  updateModuleAction,
  deleteModuleAction,
  toggleModuleActionStatus,
  getActionsByModule,
  getModuleActionsTree,
  getModuleActionsFlat,
} from "./moduleActions.controller.js";

const router = express.Router();

/* =========================
   CREATE
========================= */
router.post("/", verifyToken, createModuleAction);

/* =========================
   TREE & FLAT (keep TOP)
========================= */
router.get("/tree", verifyToken, getModuleActionsTree);
router.get("/flat", verifyToken, getModuleActionsFlat);

/* =========================
   FILTERED
========================= */
router.get("/module/:module_id", verifyToken, getActionsByModule);

/* =========================
   READ
========================= */
router.get("/", verifyToken, getAllModuleActions);
router.get("/:id", verifyToken, getModuleActionById);

/* =========================
   UPDATE
========================= */
router.put("/:id", verifyToken, updateModuleAction);
router.patch("/:id/status", verifyToken, toggleModuleActionStatus);

/* =========================
   DELETE
========================= */
router.delete("/:id", verifyToken, deleteModuleAction);

export default router;
