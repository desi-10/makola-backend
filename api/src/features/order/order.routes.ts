import { Router } from "express";
import * as orderControllers from "./order.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderParamsIdSchema,
} from "./order.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(orderControllers.getOrders)
  .post(validateSchema(CreateOrderSchema), orderControllers.createOrder);

router
  .route("/:orderId")
  .get(validateParams(OrderParamsIdSchema), orderControllers.getOrder)
  .patch(
    validateParams(OrderParamsIdSchema),
    validateSchema(UpdateOrderSchema),
    orderControllers.updateOrder
  )
  .delete(validateParams(OrderParamsIdSchema), orderControllers.deleteOrder);

export default router;
