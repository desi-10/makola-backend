import { Router } from "express";
import * as inviteControllers from "./invite.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateInviteSchema,
  InviteParamsIdSchema,
} from "./invite.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware);

// Store-level invites
router.use("/stores/:storeId", storeMembershipMiddleware);

router
  .route("/")
  .get(inviteControllers.getInvites)
  .post(
    validateSchema(CreateInviteSchema),
    inviteControllers.createInvite
  );

router.get("/token/:token", inviteControllers.getInviteByToken);

router
  .route("/:inviteId")
  .get(
    validateParams(InviteParamsIdSchema),
    inviteControllers.getInvite
  )
  .delete(
    validateParams(InviteParamsIdSchema),
    inviteControllers.cancelInvite
  );

export default router;

