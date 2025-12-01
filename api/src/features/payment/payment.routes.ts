import { Router } from "express";
import * as paymentControllers from "./payment.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreatePaymentSchema,
  UpdatePaymentSchema,
  PaymentParamsIdSchema,
} from "./payment.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(paymentControllers.getPayments)
  .post(
    validateSchema(CreatePaymentSchema),
    paymentControllers.createPayment
  );

router
  .route("/:paymentId")
  .get(
    validateParams(PaymentParamsIdSchema),
    paymentControllers.getPayment
  )
  .patch(
    validateParams(PaymentParamsIdSchema),
    validateSchema(UpdatePaymentSchema),
    paymentControllers.updatePayment
  )
  .delete(
    validateParams(PaymentParamsIdSchema),
    paymentControllers.deletePayment
  );

export default router;

