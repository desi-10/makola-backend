import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  CreateDiscountSchemaType,
  UpdateDiscountSchemaType,
} from "./discount.validators.js";
import { logDiscountHistory } from "./discount.utils.js";
import { Prisma } from "@prisma/client";

export const getDiscountsService = async (storeId: string) => {
  const discounts = await prisma.discount.findMany({
    where: { storeId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Discounts fetched successfully", discounts);
};

export const getDiscountService = async (
  storeId: string,
  discountId: string
) => {
  const discount = await prisma.discount.findFirst({
    where: { id: discountId, storeId, isActive: true },
  });

  if (!discount) {
    throw new ApiError("Discount not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Discount fetched successfully", discount);
};

export const createDiscountService = async (
  userId: string,
  storeId: string,
  data: CreateDiscountSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingDiscount = await prisma.discount.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingDiscount) {
    throw new ApiError("Discount already exists", StatusCodes.CONFLICT);
  }

  const result = await prisma.$transaction(async (tx) => {
    const discount = await tx.discount.create({
      data: {
        name: data.name,
        description: data.description,
        storeId,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        minPurchase: data.minPurchase
          ? new Prisma.Decimal(data.minPurchase)
          : undefined,
        maxDiscount: data.maxDiscount
          ? new Prisma.Decimal(data.maxDiscount)
          : undefined,
        applicableTo: data.applicableTo,
        productIds: data.productIds || [],
        categoryIds: data.categoryIds || [],
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
      },
    });

    await logDiscountHistory(
      tx,
      userId,
      discount.id,
      "create",
      "Discount created",
      ipAddress,
      userAgent,
      discount
    );

    return discount;
  });

  return apiResponse("Discount created successfully", result);
};

export const updateDiscountService = async (
  userId: string,
  storeId: string,
  discountId: string,
  data: UpdateDiscountSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingDiscount = await prisma.discount.findFirst({
    where: { id: discountId, storeId, isActive: true },
  });

  if (!existingDiscount) {
    throw new ApiError("Discount not found", StatusCodes.NOT_FOUND);
  }

  if (data.name && data.name !== existingDiscount.name) {
    const conflict = await prisma.discount.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: discountId },
      },
    });

    if (conflict) {
      throw new ApiError("Discount name already exists", StatusCodes.CONFLICT);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData: any = {
      name: data.name || existingDiscount.name,
      description: data.description ?? existingDiscount.description,
      type: data.type || existingDiscount.type,
      value: data.value
        ? new Prisma.Decimal(data.value)
        : existingDiscount.value,
      minPurchase:
        data.minPurchase !== undefined
          ? data.minPurchase
            ? new Prisma.Decimal(data.minPurchase)
            : null
          : existingDiscount.minPurchase,
      maxDiscount:
        data.maxDiscount !== undefined
          ? data.maxDiscount
            ? new Prisma.Decimal(data.maxDiscount)
            : null
          : existingDiscount.maxDiscount,
      applicableTo: data.applicableTo || existingDiscount.applicableTo,
      productIds: data.productIds ?? existingDiscount.productIds,
      categoryIds: data.categoryIds ?? existingDiscount.categoryIds,
      startDate: data.startDate ?? existingDiscount.startDate,
      endDate: data.endDate ?? existingDiscount.endDate,
      isActive: data.isActive ?? existingDiscount.isActive,
    };

    const discount = await tx.discount.update({
      where: { id: discountId },
      data: updateData,
    });

    await logDiscountHistory(
      tx,
      userId,
      discount.id,
      "update",
      "Discount updated",
      ipAddress,
      userAgent,
      discount
    );

    return discount;
  });

  return apiResponse("Discount updated successfully", result);
};

export const deleteDiscountService = async (
  userId: string,
  storeId: string,
  discountId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingDiscount = await prisma.discount.findFirst({
    where: { id: discountId, storeId, isActive: true },
  });

  if (!existingDiscount) {
    throw new ApiError("Discount not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.discount.update({
      where: { id: discountId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await logDiscountHistory(
      tx,
      userId,
      existingDiscount.id,
      "delete",
      reason,
      ipAddress,
      userAgent,
      existingDiscount
    );
  });

  return apiResponse("Discount deleted successfully", null);
};
