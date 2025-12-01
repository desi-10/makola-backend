import { Router } from "express";
import * as newsletterControllers from "./newsletter.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateNewsletterSchema,
  UpdateNewsletterSchema,
  NewsletterParamsIdSchema,
  SubscribeNewsletterSchema,
} from "./newsletter.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(newsletterControllers.getNewsletters)
  .post(
    validateSchema(CreateNewsletterSchema),
    newsletterControllers.createNewsletter
  );

router.get("/subscribers", newsletterControllers.getSubscribers);
router.post("/subscribe", validateSchema(SubscribeNewsletterSchema), newsletterControllers.subscribeNewsletter);
router.post("/unsubscribe/:email", newsletterControllers.unsubscribeNewsletter);

router
  .route("/:newsletterId")
  .get(
    validateParams(NewsletterParamsIdSchema),
    newsletterControllers.getNewsletter
  )
  .patch(
    validateParams(NewsletterParamsIdSchema),
    validateSchema(UpdateNewsletterSchema),
    newsletterControllers.updateNewsletter
  )
  .delete(
    validateParams(NewsletterParamsIdSchema),
    newsletterControllers.deleteNewsletter
  );

export default router;

