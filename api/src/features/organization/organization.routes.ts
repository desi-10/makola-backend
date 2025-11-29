import { Router } from "express";
import * as organizationControllers from "./organization.controllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationParmasIdSchema,
} from "./organization.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { upload } from "../../utils/multer.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";
const router = Router();

router
  .route("/")
  .get(authenticate, organizationControllers.getOrganizations)
  .post(
    authenticate,
    validateSchema(CreateOrganizationSchema),
    organizationControllers.createOrganization
  );

router.get(
  "/active",
  authenticate,
  organizationControllers.getActiveOrganizations
);

router
  .route("/history")
  .get(
    authenticate,
    membershipMiddleware,
    organizationControllers.getOrganizationHistory
  );

router.get(
  "/memberships/me",
  authenticate,
  organizationControllers.getOrganizationMembers
);

router
  .route("/:organizationId")
  .get(
    authenticate,
    validateParams(OrganizationParmasIdSchema),
    membershipMiddleware,
    organizationControllers.getOrganization
  )
  .patch(
    authenticate,
    validateParams(OrganizationParmasIdSchema),
    validateSchema(UpdateOrganizationSchema),
    membershipMiddleware,
    upload.single("image"),
    organizationControllers.updateOrganization
  )
  .delete(
    authenticate,
    validateParams(OrganizationParmasIdSchema),
    membershipMiddleware,
    organizationControllers.deleteOrganization
  );

router
  .route("/history/:organizationId")
  .get(
    authenticate,
    validateParams(OrganizationParmasIdSchema),
    membershipMiddleware,
    organizationControllers.getOrganizationHistoryById
  );

export default router;
