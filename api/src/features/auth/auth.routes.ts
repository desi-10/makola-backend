import { Router } from "express";
import * as authController from "./auth.controller.js";
import {
  DisableTwoFactorSchema,
  EnableTwoFactorSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignUpSchema,
  VerifyTwoFactorSchema,
} from "./auth.validators.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
const router = Router();

router.post("/sign-in", validateSchema(SignInSchema), authController.signIn);
router.post("/sign-up", validateSchema(SignUpSchema), authController.signUp);
router.post("/refresh-token", authController.refreshToken);
router.post("/sign-out", authenticate, authController.signOut);
router.get("/get-session", authController.getSession);
router.get("/get-sessions", authController.getSessions);
router.post("/revoke-sessions", authenticate, authController.revokeSessions);
router.post(
  "/forgot-password",
  validateSchema(ForgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  validateSchema(ResetPasswordSchema),
  authController.resetPassword
);

router.post(
  "/revoke-other-sessions",
  authenticate,
  authController.revokeOtherSessions
);

router.post(
  "/enable-two-factor",
  authenticate,
  validateSchema(EnableTwoFactorSchema),
  authController.enableTwoFactor
);

router.post(
  "/disable-two-factor",
  authenticate,
  validateSchema(DisableTwoFactorSchema),
  authController.disableTwoFactor
);

router.post(
  "/verify-two-factor",
  authenticate,
  validateSchema(VerifyTwoFactorSchema),
  authController.verifyTwoFactor
);

router.get("/google/auth-url", authController.getGoogleAuthUrl);
router.get("/google/callback", authController.signInWithGoogle);

router.post(
  "/google/refresh-access-token",
  authenticate,
  authController.refreshGoogleAccessToken
);

export default router;
