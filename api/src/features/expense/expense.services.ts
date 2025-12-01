import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateExpenseSchemaType, UpdateExpenseSchemaType } from "./expense.validators.js";
import { logExpenseHistory } from "./expense.utils.js";
import { Prisma } from "@prisma/client";

export const getExpensesService = async (storeId: string) => {
  const expenses = await prisma.expense.findMany({
    where: { storeId, isActive: true },
    orderBy: { date: "desc" },
  });

  return apiResponse("Expenses fetched successfully", expenses);
};

export const getExpenseService = async (storeId: string, expenseId: string) => {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, storeId, isActive: true },
  });

  if (!expense) {
    throw new ApiError("Expense not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Expense fetched successfully", expense);
};

export const createExpenseService = async (
  userId: string,
  storeId: string,
  data: CreateExpenseSchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  let receiptUrl = data.receiptUrl;
  if (file) {
    const { uploadToCloudinary } = await import("../../utils/cloudinary.js");
    const uploadedImage = await uploadToCloudinary("expenses", file.buffer);
    receiptUrl = uploadedImage.secure_url;
  }

  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        title: data.title,
        description: data.description,
        storeId,
        category: data.category,
        amount: new Prisma.Decimal(data.amount),
        date: data.date,
        receiptUrl,
        paidBy: data.paidBy,
        approvedBy: data.approvedBy,
        status: data.status || "PENDING",
        tags: data.tags || [],
        isActive: data.isActive ?? true,
      },
    });

    await logExpenseHistory(
      tx,
      userId,
      expense.id,
      "create",
      data.status || "PENDING",
      "Expense created",
      ipAddress,
      userAgent,
      expense
    );

    return expense;
  });

  return apiResponse("Expense created successfully", result);
};

export const updateExpenseService = async (
  userId: string,
  storeId: string,
  expenseId: string,
  data: UpdateExpenseSchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, storeId, isActive: true },
  });

  if (!existingExpense) {
    throw new ApiError("Expense not found", StatusCodes.NOT_FOUND);
  }

  let receiptUrl = existingExpense.receiptUrl;
  if (file) {
    const { uploadToCloudinary, deleteFromCloudinary } = await import("../../utils/cloudinary.js");
    const uploadedImage = await uploadToCloudinary("expenses", file.buffer);
    receiptUrl = uploadedImage.secure_url;
    if (existingExpense.receiptUrl) {
      await deleteFromCloudinary(existingExpense.receiptUrl);
    }
  } else if (data.receiptUrl !== undefined) {
    receiptUrl = data.receiptUrl;
  }

  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.update({
      where: { id: expenseId },
      data: {
        title: data.title || existingExpense.title,
        description: data.description ?? existingExpense.description,
        category: data.category || existingExpense.category,
        amount: data.amount ? new Prisma.Decimal(data.amount) : existingExpense.amount,
        date: data.date || existingExpense.date,
        receiptUrl,
        paidBy: data.paidBy ?? existingExpense.paidBy,
        approvedBy: data.approvedBy ?? existingExpense.approvedBy,
        status: data.status || existingExpense.status,
        tags: data.tags ?? existingExpense.tags,
        isActive: data.isActive ?? existingExpense.isActive,
      },
    });

    await logExpenseHistory(
      tx,
      userId,
      expense.id,
      "update",
      data.status || existingExpense.status,
      "Expense updated",
      ipAddress,
      userAgent,
      expense
    );

    return expense;
  });

  return apiResponse("Expense updated successfully", result);
};

export const deleteExpenseService = async (
  userId: string,
  storeId: string,
  expenseId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, storeId, isActive: true },
  });

  if (!existingExpense) {
    throw new ApiError("Expense not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id: expenseId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await logExpenseHistory(
      tx,
      userId,
      existingExpense.id,
      "delete",
      null,
      reason,
      ipAddress,
      userAgent,
      existingExpense
    );
  });

  return apiResponse("Expense deleted successfully", null);
};

