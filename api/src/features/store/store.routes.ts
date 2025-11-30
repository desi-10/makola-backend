import { Router } from "express";
import * as storeControllers from "./store.controllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "./store.middlewares.js";
import { CreateStoreSchema, UpdateStoreSchema } from "./store.validators.js";

const router = Router({ mergeParams: true });

router
  .route("/")
  .get(authenticate, storeMembershipMiddleware, storeControllers.getStores)
  .post(
    authenticate,
    storeMembershipMiddleware,
    validateSchema(CreateStoreSchema),
    storeControllers.createStore
  );

router
  .route("/:storeId")
  .get(authenticate, storeMembershipMiddleware, storeControllers.getStore)
  .patch(
    authenticate,
    storeMembershipMiddleware,
    validateSchema(UpdateStoreSchema),
    storeControllers.updateStore
  )
  .delete(
    authenticate,
    storeMembershipMiddleware,
    storeControllers.deleteStore
  );

router
  .route("/:storeId/history")
  .get(
    authenticate,
    storeMembershipMiddleware,
    storeControllers.getStoreHistory
  );

export default router;
