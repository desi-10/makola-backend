import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as userController from "./user.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { UpdateUserSchema } from "./user.validators.js";
import { upload } from "../../utils/multer.js";
import { UpdatePasswordSchema } from "./user.validators.js";
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

router.patch(
  "/me/update-password",
  authenticate,
  validateSchema(UpdatePasswordSchema),
  userController.updatePassword
);

export default router;
