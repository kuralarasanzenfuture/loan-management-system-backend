import express from "express";
import {
  createUser,
  loginUser,
  refreshToken,
  getMyProfile,
  logoutUser,
  logoutAllDevices,
} from "./user.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);

router.get("/me", verifyToken, getMyProfile);

router.post("/logout", verifyToken, logoutUser);

router.post("/logout-all", verifyToken, logoutAllDevices);

export default router;
