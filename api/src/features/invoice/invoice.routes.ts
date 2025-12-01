import { Router } from "express";
import * as invoiceControllers from "./invoice.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceParamsIdSchema,
} from "./invoice.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(invoiceControllers.getInvoices)
  .post(
    validateSchema(CreateInvoiceSchema),
    invoiceControllers.createInvoice
  );

router
  .route("/:invoiceId")
  .get(
    validateParams(InvoiceParamsIdSchema),
    invoiceControllers.getInvoice
  )
  .patch(
    validateParams(InvoiceParamsIdSchema),
    validateSchema(UpdateInvoiceSchema),
    invoiceControllers.updateInvoice
  )
  .delete(
    validateParams(InvoiceParamsIdSchema),
    invoiceControllers.deleteInvoice
  );

export default router;

