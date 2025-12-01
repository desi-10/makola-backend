import { Router } from "express";
import * as couponControllers from "./coupon.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateCouponSchema,
  UpdateCouponSchema,
  CouponParamsIdSchema,
} from "./coupon.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(couponControllers.getCoupons)
  .post(
    validateSchema(CreateCouponSchema),
    couponControllers.createCoupon
  );

router.get("/code/:code", couponControllers.getCouponByCode);

router
  .route("/:couponId")
  .get(
    validateParams(CouponParamsIdSchema),
    couponControllers.getCoupon
  )
  .patch(
    validateParams(CouponParamsIdSchema),
    validateSchema(UpdateCouponSchema),
    couponControllers.updateCoupon
  )
  .delete(
    validateParams(CouponParamsIdSchema),
    couponControllers.deleteCoupon
  );

export default router;

