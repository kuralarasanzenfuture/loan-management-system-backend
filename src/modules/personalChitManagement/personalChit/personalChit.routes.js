import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware.js";

import {
  createChit,
  getChits,
  getChitById,
  updateChit,
  updateChitStatus,
  deleteChit,
  markChitTaken,
} from "./personalChit.controller.js";

const router = express.Router();

/* ==========================
   CREATE
========================== */
router.post("/", verifyToken, createChit);

/* ==========================
   READ
========================== */
router.get("/", verifyToken, getChits);
router.get("/:id", verifyToken, getChitById);

/* ==========================
   UPDATE
========================== */
router.put("/:id", verifyToken, updateChit);

/* ==========================
   STATUS
========================== */
router.patch("/:id/status", verifyToken, updateChitStatus);

/* ==========================
   MARK AS TAKEN (IMPORTANT BUSINESS ACTION)
========================== */
router.patch("/:id/taken", verifyToken, markChitTaken);

/* ==========================
   DELETE (use carefully)
========================== */
router.delete("/:id", verifyToken, deleteChit);

export default router;
