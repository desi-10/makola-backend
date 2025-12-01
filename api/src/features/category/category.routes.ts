import { Router } from "express";
import * as categoryControllers from "./category.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import { upload } from "../../utils/multer.js";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryParamsIdSchema,
} from "./category.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(categoryControllers.getCategories)
  .post(
    upload.single("image"),
    validateSchema(CreateCategorySchema),
    categoryControllers.createCategory
  );

router
  .route("/:categoryId")
  .get(validateParams(CategoryParamsIdSchema), categoryControllers.getCategory)
  .patch(
    validateParams(CategoryParamsIdSchema),
    upload.single("image"),
    validateSchema(UpdateCategorySchema),
    categoryControllers.updateCategory
  )
  .delete(
    validateParams(CategoryParamsIdSchema),
    categoryControllers.deleteCategory
  );

export default router;
