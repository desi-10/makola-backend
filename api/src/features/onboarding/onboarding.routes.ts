import { Router } from "express";
import * as onboardingControllers from "./onboarding.controllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { OnboardingSchema } from "./onboarding.validators.js";

const router = Router();

router.post(
  "/complete",
  authenticate,
  validateSchema(OnboardingSchema),
  onboardingControllers.completeOnboarding
);

export default router;
