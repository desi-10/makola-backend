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

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(productControllers.getProducts)
  .post(
    upload.single("image"),
    validateSchema(CreateProductSchema),
    productControllers.createProduct
  );

router
  .route("/:productId")
  .get(validateParams(ProductParamsIdSchema), productControllers.getProduct)
  .patch(
    validateParams(ProductParamsIdSchema),
    upload.single("image"),
    validateSchema(UpdateProductSchema),
    productControllers.updateProduct
  )
  .delete(
    validateParams(ProductParamsIdSchema),
    productControllers.deleteProduct
  );

export default router;
