import { Router } from "express";
import * as roleControllers from "./role.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateRoleSchema,
  UpdateRoleSchema,
  RoleParamsIdSchema,
  AssignPermissionSchema,
} from "./role.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router.get("/permissions", roleControllers.getPermissions);

router
  .route("/")
  .get(roleControllers.getRoles)
  .post(
    validateSchema(CreateRoleSchema),
    roleControllers.createRole
  );

router
  .route("/:roleId")
  .get(
    validateParams(RoleParamsIdSchema),
    roleControllers.getRole
  )
  .patch(
    validateParams(RoleParamsIdSchema),
    validateSchema(UpdateRoleSchema),
    roleControllers.updateRole
  )
  .delete(
    validateParams(RoleParamsIdSchema),
    roleControllers.deleteRole
  );

router.post(
  "/:roleId/permissions",
  validateParams(RoleParamsIdSchema),
  validateSchema(AssignPermissionSchema),
  roleControllers.assignPermission
);

router.delete(
  "/:roleId/permissions/:permissionId",
  validateParams(RoleParamsIdSchema),
  roleControllers.removePermission
);

export default router;

