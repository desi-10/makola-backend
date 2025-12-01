import { Router } from "express";
import * as expenseControllers from "./expense.controllers.js";
import { validateSchema } from "../../middlewares/validate.middleware.js";
import { storeMembershipMiddleware } from "../store/store.middlewares.js";
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseParamsIdSchema,
} from "./expense.validators.js";
import { validateParams } from "../../middlewares/params.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { membershipMiddleware } from "../../middlewares/memership.middleware.js";
import { upload } from "../../utils/multer.js";

const router = Router({ mergeParams: true });

router.use(authenticate, membershipMiddleware, storeMembershipMiddleware);

router
  .route("/")
  .get(expenseControllers.getExpenses)
  .post(
    upload.single("receipt"),
    validateSchema(CreateExpenseSchema),
    expenseControllers.createExpense
  );

router
  .route("/:expenseId")
  .get(
    validateParams(ExpenseParamsIdSchema),
    expenseControllers.getExpense
  )
  .patch(
    validateParams(ExpenseParamsIdSchema),
    upload.single("receipt"),
    validateSchema(UpdateExpenseSchema),
    expenseControllers.updateExpense
  )
  .delete(
    validateParams(ExpenseParamsIdSchema),
    expenseControllers.deleteExpense
  );

export default router;

