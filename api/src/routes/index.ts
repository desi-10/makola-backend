import express from "express";
import authRoutes from "../features/auth/auth.routes.js";
import userRoutes from "../features/user/user.routes.js";
import organizationRoutes from "../features/organization/organization.routes.js";
import storeRoutes from "../features/store/store.routes.js";
import categoryRoutes from "../features/category/category.routes.js";
import productRoutes from "../features/product/product.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/organizations/:organizationId/stores", storeRoutes);
router.use(
  "/organizations/:organizationId/stores/:storeId/categories",
  categoryRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/products",
  productRoutes
);

export default router;
