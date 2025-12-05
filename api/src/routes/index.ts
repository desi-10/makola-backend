import express from "express";
import authRoutes from "../features/auth/auth.routes.js";
import userRoutes from "../features/user/user.routes.js";
import organizationRoutes from "../features/organization/organization.routes.js";
import storeRoutes from "../features/store/store.routes.js";
import categoryRoutes from "../features/category/category.routes.js";
import productRoutes from "../features/product/product.routes.js";
import inventoryRoutes from "../features/inventory/inventory.routes.js";
import orderRoutes from "../features/order/order.routes.js";
import paymentRoutes from "../features/payment/payment.routes.js";
import invoiceRoutes from "../features/invoice/invoice.routes.js";
import discountRoutes from "../features/discount/discount.routes.js";
import couponRoutes from "../features/coupon/coupon.routes.js";
import campaignRoutes from "../features/campaign/campaign.routes.js";
import flashSaleRoutes from "../features/flashsale/flashsale.routes.js";
import newsletterRoutes from "../features/newsletter/newsletter.routes.js";
import expenseRoutes from "../features/expense/expense.routes.js";
import inviteRoutes from "../features/invite/invite.routes.js";
import cartRoutes from "../features/cart/cart.routes.js";
import memberRoutes from "../features/member/member.routes.js";
import roleRoutes from "../features/role/role.routes.js";
import analyticsRoutes from "../features/analytics/analytics.routes.js";
import dashboardRoutes from "../features/dashboard/dashboard.routes.js";
import onboardingRoutes from "../features/onboarding/onboarding.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/organizations/:organizationId/stores", storeRoutes);

// Store-scoped routes
router.use(
  "/organizations/:organizationId/stores/:storeId/categories",
  categoryRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/products",
  productRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/inventory",
  inventoryRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/orders",
  orderRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/payments",
  paymentRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/invoices",
  invoiceRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/discounts",
  discountRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/coupons",
  couponRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/campaigns",
  campaignRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/flash-sales",
  flashSaleRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/newsletters",
  newsletterRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/expenses",
  expenseRoutes
);

router.use("/organizations/:organizationId/stores/:storeId/carts", cartRoutes);

router.use(
  "/organizations/:organizationId/stores/:storeId/members",
  memberRoutes
);

router.use("/organizations/:organizationId/stores/:storeId/roles", roleRoutes);

router.use(
  "/organizations/:organizationId/stores/:storeId/analytics",
  analyticsRoutes
);

router.use(
  "/organizations/:organizationId/stores/:storeId/dashboard",
  dashboardRoutes
);

// Organization and store-level invites
router.use("/organizations/:organizationId/invites", inviteRoutes);
router.use(
  "/organizations/:organizationId/stores/:storeId/invites",
  inviteRoutes
);

export default router;
