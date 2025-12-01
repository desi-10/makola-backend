import { Router } from "express";
import * as analyticsControllers from "./analytics.controllers.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router.get("/sales", analyticsControllers.getSalesAnalytics);
router.get("/products", analyticsControllers.getProductAnalytics);
router.get("/marketing", analyticsControllers.getMarketingAnalytics);
router.get("/inventory", analyticsControllers.getInventoryAnalytics);
router.get("/customers", analyticsControllers.getCustomerAnalytics);

export default router;

