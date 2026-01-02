import express from "express";

import authRoutes from "./auth/login.routes";
import userRoutes from "./users/user.routes";

const router = express.Router();

/**
 * Auth routes
 */
router.use("/auth", authRoutes);

/**
 * Admin routes
 */
router.use("/admin", userRoutes);

export default router;
