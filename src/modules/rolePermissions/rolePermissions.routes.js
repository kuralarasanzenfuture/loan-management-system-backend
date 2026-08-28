import express from "express";

import {
  setRolePermissions,
  getRolePermissions,
  getTreeRolePermissions,
} from "./rolePermissions.controller.js";

import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/bulk", verifyToken, setRolePermissions);
router.get("/role/:roleId/tree", verifyToken, getTreeRolePermissions);
router.get("/role/:roleId", verifyToken, getRolePermissions);

export default router;
