import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  CreateFlashSaleSchemaType,
  UpdateFlashSaleSchemaType,
} from "./flashsale.validators.js";
import { logFlashSaleHistory } from "./flashsale.utils.js";
import { Prisma } from "@prisma/client";

export const getFlashSalesService = async (storeId: string) => {
  const flashSales = await prisma.flashSale.findMany({
    where: { storeId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Flash sales fetched successfully", flashSales);
};

export const getFlashSaleService = async (
  storeId: string,
  flashSaleId: string
) => {
  const flashSale = await prisma.flashSale.findFirst({
    where: { id: flashSaleId, storeId, isActive: true },
  });

  if (!flashSale) {
    throw new ApiError("Flash sale not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Flash sale fetched successfully", flashSale);
};

export const getActiveFlashSalesService = async (storeId: string) => {
  const now = new Date();
  const flashSales = await prisma.flashSale.findMany({
    where: {
      storeId,
      isActive: true,
      status: "ACTIVE",
      startTime: { lte: now },
      endTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
  });

  return apiResponse("Active flash sales fetched successfully", flashSales);
};

export const createFlashSaleService = async (
  userId: string,
  storeId: string,
  data: CreateFlashSaleSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  if (data.endTime <= data.startTime) {
    throw new ApiError(
      "End time must be after start time",
      StatusCodes.BAD_REQUEST
    );
  }

  const existingFlashSale = await prisma.flashSale.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingFlashSale) {
    throw new ApiError("Flash sale already exists", StatusCodes.CONFLICT);
  }

  // Validate products exist
  for (const productId of data.productIds) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId, isActive: true },
    });

    if (!product) {
      throw new ApiError(
        `Product ${productId} not found`,
        StatusCodes.NOT_FOUND
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const status =
      data.startTime > now
        ? "SCHEDULED"
        : data.endTime < now
        ? "ENDED"
        : "ACTIVE";

    const flashSale = await tx.flashSale.create({
      data: {
        name: data.name,
        description: data.description,
        storeId,
        discountType: data.discountType,
        discountValue: new Prisma.Decimal(data.discountValue),
        productIds: data.productIds,
        startTime: data.startTime,
        endTime: data.endTime,
        maxQuantity: data.maxQuantity,
        totalQuantity: data.totalQuantity,
        status,
        isActive: data.isActive ?? true,
      },
    });

    await logFlashSaleHistory(
      tx,
      userId,
      flashSale.id,
      "create",
      status,
      "Flash sale created",
      ipAddress,
      userAgent,
      flashSale
    );

    return flashSale;
  });

  return apiResponse("Flash sale created successfully", result);
};

export const updateFlashSaleService = async (
  userId: string,
  storeId: string,
  flashSaleId: string,
  data: UpdateFlashSaleSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingFlashSale = await prisma.flashSale.findFirst({
    where: { id: flashSaleId, storeId, isActive: true },
  });

  if (!existingFlashSale) {
    throw new ApiError("Flash sale not found", StatusCodes.NOT_FOUND);
  }

  if (data.endTime && data.startTime && data.endTime <= data.startTime) {
    throw new ApiError(
      "End time must be after start time",
      StatusCodes.BAD_REQUEST
    );
  }

  if (data.name && data.name !== existingFlashSale.name) {
    const conflict = await prisma.flashSale.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: flashSaleId },
      },
    });

    if (conflict) {
      throw new ApiError(
        "Flash sale name already exists",
        StatusCodes.CONFLICT
      );
    }
  }

  // Validate products if updating
  if (data.productIds) {
    for (const productId of data.productIds) {
      const product = await prisma.product.findFirst({
        where: { id: productId, storeId, isActive: true },
      });

      if (!product) {
        throw new ApiError(
          `Product ${productId} not found`,
          StatusCodes.NOT_FOUND
        );
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const startTime = data.startTime || existingFlashSale.startTime;
    const endTime = data.endTime || existingFlashSale.endTime;
    const now = new Date();

    let status = data.status || existingFlashSale.status;
    if (!data.status) {
      // Auto-update status based on time
      if (startTime > now) status = "SCHEDULED";
      else if (endTime < now) status = "ENDED";
      else status = "ACTIVE";
    }

    const updateData: any = {
      name: data.name || existingFlashSale.name,
      description: data.description ?? existingFlashSale.description,
      discountType: data.discountType || existingFlashSale.discountType,
      discountValue: data.discountValue
        ? new Prisma.Decimal(data.discountValue)
        : existingFlashSale.discountValue,
      productIds: data.productIds ?? existingFlashSale.productIds,
      startTime,
      endTime,
      status,
      maxQuantity: data.maxQuantity ?? existingFlashSale.maxQuantity,
      totalQuantity: data.totalQuantity ?? existingFlashSale.totalQuantity,
      isActive: data.isActive ?? existingFlashSale.isActive,
    };

    const flashSale = await tx.flashSale.update({
      where: { id: flashSaleId },
      data: updateData,
    });

    await logFlashSaleHistory(
      tx,
      userId,
      flashSale.id,
      "update",
      status,
      "Flash sale updated",
      ipAddress,
      userAgent,
      flashSale
    );

    return flashSale;
  });

  return apiResponse("Flash sale updated successfully", result);
};

export const deleteFlashSaleService = async (
  userId: string,
  storeId: string,
  flashSaleId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingFlashSale = await prisma.flashSale.findFirst({
    where: { id: flashSaleId, storeId, isActive: true },
  });

  if (!existingFlashSale) {
    throw new ApiError("Flash sale not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.flashSale.update({
      where: { id: flashSaleId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: "CANCELLED",
      },
    });

    await logFlashSaleHistory(
      tx,
      userId,
      existingFlashSale.id,
      "delete",
      "CANCELLED",
      reason,
      ipAddress,
      userAgent,
      existingFlashSale
    );
  });

  return apiResponse("Flash sale deleted successfully", null);
};
