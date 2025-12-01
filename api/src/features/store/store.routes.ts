import { Router } from "express";
import * as storeControllers from "./store.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "./store.middlewares.js";
import {
  CreateStoreSchema,
  StoreParamsIdSchema,
  UpdateStoreSchema,
} from "./store.validators.js";
import { upload } from "../../utils/multer.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";
import { validateParams } from "../../middlewares/params.middleware.js";

const router = Router({ mergeParams: true });
router.use(authenticate, membershipMiddleware);

router
  .route("/")
  .get(storeControllers.getStores)
  .post(
    upload.single("image"),
    validateSchema(CreateStoreSchema),
    storeControllers.createStore
  );

router
  .route("/store/:storeId")
  .get(
    validateParams(StoreParamsIdSchema),
    storeMembershipMiddleware,
    storeControllers.getStore
  )
  .patch(
    validateParams(StoreParamsIdSchema),
    storeMembershipMiddleware,
    upload.single("image"),
    validateSchema(UpdateStoreSchema),
    storeControllers.updateStore
  )
  .delete(storeMembershipMiddleware, storeControllers.deleteStore);

router
  .route("/store/:storeId/history")
  .get(
    validateParams(StoreParamsIdSchema),
    storeMembershipMiddleware,
    storeControllers.getStoreHistory
  );

// router.route("/store/:storeId/history/:historyId").get(
//   // validateParams(StoreParamsIdSchema),
//   storeMembershipMiddleware,
//   storeControllers.getStoreHistoryById
// );

export default router;
