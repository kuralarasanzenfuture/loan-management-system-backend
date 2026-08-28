import express from "express";

import {
  setUserPermissions,
  getUserPermissions,
  getTreeUserPermissions,
} from "./userPermissions.controller.js";

import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/bulk", verifyToken, setUserPermissions);
router.get("/user/:userId/tree", verifyToken, getTreeUserPermissions);
router.get("/user/:userId", verifyToken, getUserPermissions);

export default router;
