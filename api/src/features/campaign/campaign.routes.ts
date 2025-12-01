import { Router } from "express";
import * as campaignControllers from "./campaign.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  CampaignParamsIdSchema,
} from "./campaign.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(campaignControllers.getCampaigns)
  .post(
    validateSchema(CreateCampaignSchema),
    campaignControllers.createCampaign
  );

router
  .route("/:campaignId")
  .get(
    validateParams(CampaignParamsIdSchema),
    campaignControllers.getCampaign
  )
  .patch(
    validateParams(CampaignParamsIdSchema),
    validateSchema(UpdateCampaignSchema),
    campaignControllers.updateCampaign
  )
  .delete(
    validateParams(CampaignParamsIdSchema),
    campaignControllers.deleteCampaign
  );

export default router;

