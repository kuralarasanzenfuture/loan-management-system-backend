import express from "express";

import roleRoutes from "../modules/roles/role.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router = express.Router();

router.use("/roles", roleRoutes);
router.use("/users", userRoutes);

router.get("/", (req, res) => {
    res.send("API Server Running");
});

export default router;