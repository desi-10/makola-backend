import express from "express";
import authRoutes from "../features/auth/auth.routes.js";
import userRoutes from "../features/user/user.routes.js";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
