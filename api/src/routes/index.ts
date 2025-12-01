import express from "express";
import authRoutes from "../features/auth/auth.routes.js";
import userRoutes from "../features/user/user.routes.js";
import organizationRoutes from "../features/organization/organization.routes.js";
import storeRoutes from "../features/store/store.routes.js";
import { membershipMiddleware } from "../middlewares/memership.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/stores/organizations/:organizationId", storeRoutes);

export default router;
