import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  updateAssetStatus,
  deleteAsset,
} from "./businessAsset.controller.js";
import { assetUpload } from "../../middlewares/multer.asset.js";

const router = express.Router();

/* ==========================
   CREATE
========================== */
router.post("/", verifyToken, assetUpload.single("image"), createAsset);

/* ==========================
   READ
========================== */
router.get("/", verifyToken, getAssets);
router.get("/:id", verifyToken, getAssetById);

/* ==========================
   UPDATE
========================== */
router.put("/:id", verifyToken, assetUpload.single("image"), updateAsset);
router.patch("/:id/status", verifyToken, updateAssetStatus);

/* ==========================
   DELETE
========================== */
router.delete("/:id", verifyToken, deleteAsset);

export default router;
