import { Router } from "express";
import * as authController from "./auth.controller.js";
import { SignInSchema, SignUpSchema } from "./auth.validators.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
const router = Router();

router.post("/sign-in", validateSchema(SignInSchema), authController.signIn);
router.post("/sign-up", validateSchema(SignUpSchema), authController.signUp);
router.post("/refresh-token", authController.refreshToken);
router.post("/sign-out", authenticate, authController.signOut);
export default router;
