import { Router } from "express";
import * as discountControllers from "./discount.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateDiscountSchema,
  UpdateDiscountSchema,
  DiscountParamsIdSchema,
} from "./discount.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(discountControllers.getDiscounts)
  .post(
    validateSchema(CreateDiscountSchema),
    discountControllers.createDiscount
  );

router
  .route("/:discountId")
  .get(validateParams(DiscountParamsIdSchema), discountControllers.getDiscount)
  .patch(
    validateParams(DiscountParamsIdSchema),
    validateSchema(UpdateDiscountSchema),
    discountControllers.updateDiscount
  )
  .delete(
    validateParams(DiscountParamsIdSchema),
    discountControllers.deleteDiscount
  );

export default router;
