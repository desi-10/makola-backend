import { Router } from "express";
import * as inventoryControllers from "./inventory.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateInventorySchema,
  UpdateInventorySchema,
  AdjustInventorySchema,
  RestockInventorySchema,
  InventoryParamsIdSchema,
} from "./inventory.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(inventoryControllers.getInventories)
  .post(
    validateSchema(CreateInventorySchema),
    inventoryControllers.createInventory
  );

router
  .route("/:inventoryId")
  .get(
    validateParams(InventoryParamsIdSchema),
    inventoryControllers.getInventory
  )
  .patch(
    validateParams(InventoryParamsIdSchema),
    validateSchema(UpdateInventorySchema),
    inventoryControllers.updateInventory
  )
  .delete(
    validateParams(InventoryParamsIdSchema),
    inventoryControllers.deleteInventory
  );

router
  .route("/:inventoryId/adjust")
  .post(
    validateParams(InventoryParamsIdSchema),
    validateSchema(AdjustInventorySchema),
    inventoryControllers.adjustInventory
  );

router
  .route("/:inventoryId/restock")
  .post(
    validateParams(InventoryParamsIdSchema),
    validateSchema(RestockInventorySchema),
    inventoryControllers.restockInventory
  );

export default router;
