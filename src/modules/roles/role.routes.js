import express from "express";
import {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
} from "./role.controller.js";

// import { verifyToken } from "../../middlewares/auth.js"; // use your auth

const router = express.Router();

// router.use(verifyToken); // protect routes

router.post("/", createRole);
router.get("/", getRoles);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;
