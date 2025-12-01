import { Router } from "express";
import * as cartControllers from "./cart.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateCartSchema,
  UpdateCartSchema,
  CartParamsIdSchema,
} from "./cart.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(cartControllers.getCarts)
  .post(
    validateSchema(CreateCartSchema),
    cartControllers.createCart
  );

router.get("/abandoned", cartControllers.getAbandonedCarts);

router
  .route("/:cartId")
  .get(
    validateParams(CartParamsIdSchema),
    cartControllers.getCart
  )
  .patch(
    validateParams(CartParamsIdSchema),
    validateSchema(UpdateCartSchema),
    cartControllers.updateCart
  )
  .delete(
    validateParams(CartParamsIdSchema),
    cartControllers.deleteCart
  );

router.post("/:cartId/abandon", validateParams(CartParamsIdSchema), cartControllers.markCartAbandoned);
router.post("/:cartId/convert", validateParams(CartParamsIdSchema), cartControllers.convertCartToOrder);

export default router;

