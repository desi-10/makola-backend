import { Router } from "express";
import * as flashSaleControllers from "./flashsale.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateFlashSaleSchema,
  UpdateFlashSaleSchema,
  FlashSaleParamsIdSchema,
} from "./flashsale.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(flashSaleControllers.getFlashSales)
  .post(
    validateSchema(CreateFlashSaleSchema),
    flashSaleControllers.createFlashSale
  );

router.get("/active", flashSaleControllers.getActiveFlashSales);

router
  .route("/:flashSaleId")
  .get(
    validateParams(FlashSaleParamsIdSchema),
    flashSaleControllers.getFlashSale
  )
  .patch(
    validateParams(FlashSaleParamsIdSchema),
    validateSchema(UpdateFlashSaleSchema),
    flashSaleControllers.updateFlashSale
  )
  .delete(
    validateParams(FlashSaleParamsIdSchema),
    flashSaleControllers.deleteFlashSale
  );

export default router;

