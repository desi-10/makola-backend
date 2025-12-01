import { Router } from "express";
import * as memberControllers from "./member.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateMemberSchema,
  UpdateMemberSchema,
  MemberParamsIdSchema,
} from "./member.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(memberControllers.getMembers)
  .post(
    validateSchema(CreateMemberSchema),
    memberControllers.createMember
  );

router
  .route("/:memberId")
  .get(
    validateParams(MemberParamsIdSchema),
    memberControllers.getMember
  )
  .patch(
    validateParams(MemberParamsIdSchema),
    validateSchema(UpdateMemberSchema),
    memberControllers.updateMember
  )
  .delete(
    validateParams(MemberParamsIdSchema),
    memberControllers.deleteMember
  );

export default router;

