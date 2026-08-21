import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { getDashboard } from "./analytics.controller.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getDashboard);

export default router;
