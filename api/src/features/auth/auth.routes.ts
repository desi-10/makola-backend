import { Router } from "express";
import * as authController from "./auth.controller.js";
import {
  DisableTwoFactorSchema,
  EnableTwoFactorSchema,
  SignInSchema,
  SignInWithGoogleSchema,
  SignUpSchema,
  VerifyTwoFactorSchema,
} from "./auth.validators.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { GOOGLE_SCOPES, googleOAuthClient } from "../../config/google.js";
import * as authServices from "./auth.services.js";
import { setRefreshToken } from "./auth.utils.js";
const router = Router();

router.post("/sign-in", validateSchema(SignInSchema), authController.signIn);
router.post("/sign-up", validateSchema(SignUpSchema), authController.signUp);
router.post("/refresh-token", authController.refreshToken);
router.post("/sign-out", authenticate, authController.signOut);
router.get("/get-session", authenticate, authController.getSession);
router.get("/get-sessions", authenticate, authController.getSessions);
router.post("/revoke-sessions", authenticate, authController.revokeSessions);

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

export default router;
