import express from "express";
import {
  createUser,
  loginUser,
  refreshToken,
  getMyProfile,
  logoutUser,
  logoutAllDevices,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  changeOwnPassword,
  deleteUser,
  checkUsername,
  checkEmail,
  checkMobile,
} from "./user.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);

router.get("/me", verifyToken, getMyProfile);

router.get("/", verifyToken, getAllUsers);

router.get("/check-username/:username", checkUsername);
router.get("/check-email/:email", checkEmail);
router.get("/check-mobile/:mobile", checkMobile);

router.patch("/change-password", verifyToken, changeOwnPassword);

router.get("/:id", verifyToken, getUserById);

router.put("/:id", verifyToken, updateUser);
router.patch("/:id/status", verifyToken, updateUserStatus);

router.delete("/:id", verifyToken, deleteUser);

router.post("/logout", verifyToken, logoutUser);

router.post("/logout-all", verifyToken, logoutAllDevices);

export default router;
