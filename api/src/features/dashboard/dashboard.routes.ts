import { Router } from "express";
import * as dashboardControllers from "./dashboard.controllers.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router.get("/", dashboardControllers.getDashboard);

export default router;

