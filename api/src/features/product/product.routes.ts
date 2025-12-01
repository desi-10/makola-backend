import { Router } from "express";
import * as productControllers from "./product.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import { upload } from "../../utils/multer.js";
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductParamsIdSchema,
} from "./product.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware);

router
  .route("/stores/:storeId/products")
  .get(storeMembershipMiddleware, productControllers.getProducts)
  .post(
    storeMembershipMiddleware,
    upload.single("image"),
    validateSchema(CreateProductSchema),
    productControllers.createProduct
  );

router
  .route("/stores/:storeId/products/:productId")
  .get(
    validateParams(ProductParamsIdSchema),
    storeMembershipMiddleware,
    productControllers.getProduct
  )
  .patch(
    validateParams(ProductParamsIdSchema),
    storeMembershipMiddleware,
    upload.single("image"),
    validateSchema(UpdateProductSchema),
    productControllers.updateProduct
  )
  .delete(
    validateParams(ProductParamsIdSchema),
    storeMembershipMiddleware,
    productControllers.deleteProduct
  );

export default router;


