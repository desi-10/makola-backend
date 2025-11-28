import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as userController from "./user.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { UpdateUserSchema } from "./user.validators.js";
import { upload } from "../../utils/multer.js";
const router = Router();

router
  .route("/me")
  .get(authenticate, userController.getMe)
  .patch(
    authenticate,
    upload.single("image"),
    validateSchema(UpdateUserSchema),
    userController.updateMe
  );

export default router;
