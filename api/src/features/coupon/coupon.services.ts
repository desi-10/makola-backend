import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateCouponSchemaType, UpdateCouponSchemaType } from "./coupon.validators.js";
import { logCouponHistory } from "./coupon.utils.js";
import { Prisma } from "@prisma/client";

export const getCouponsService = async (storeId: string) => {
  const coupons = await prisma.coupon.findMany({
    where: { storeId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Coupons fetched successfully", coupons);
};

export const getCouponService = async (storeId: string, couponId: string) => {
  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, storeId, isActive: true },
  });

  if (!coupon) {
    throw new ApiError("Coupon not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Coupon fetched successfully", coupon);
};

export const getCouponByCodeService = async (storeId: string, code: string) => {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      storeId,
      isActive: true,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
  });

  if (!coupon) {
    throw new ApiError("Coupon not found or expired", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Coupon fetched successfully", coupon);
};

export const createCouponService = async (
  userId: string,
  storeId: string,
  data: CreateCouponSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const code = data.code.toUpperCase();
  const existingCoupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (existingCoupon) {
    throw new ApiError("Coupon code already exists", StatusCodes.CONFLICT);
  }

  const existingName = await prisma.coupon.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingName) {
    throw new ApiError("Coupon name already exists", StatusCodes.CONFLICT);
  }

  const result = await prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        storeId,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        minPurchase: data.minPurchase ? new Prisma.Decimal(data.minPurchase) : undefined,
        maxDiscount: data.maxDiscount ? new Prisma.Decimal(data.maxDiscount) : undefined,
        maxUses: data.maxUses,
        applicableTo: data.applicableTo,
        productIds: data.productIds || [],
        categoryIds: data.categoryIds || [],
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
      },
    });

    await logCouponHistory(
      tx,
      userId,
      coupon.id,
      "create",
      "Coupon created",
      ipAddress,
      userAgent,
      coupon
    );

    return coupon;
  });

  return apiResponse("Coupon created successfully", result);
};

export const updateCouponService = async (
  userId: string,
  storeId: string,
  couponId: string,
  data: UpdateCouponSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingCoupon = await prisma.coupon.findFirst({
    where: { id: couponId, storeId, isActive: true },
  });

  if (!existingCoupon) {
    throw new ApiError("Coupon not found", StatusCodes.NOT_FOUND);
  }

  if (data.code && data.code.toUpperCase() !== existingCoupon.code) {
    const conflict = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (conflict) {
      throw new ApiError("Coupon code already exists", StatusCodes.CONFLICT);
    }
  }

  if (data.name && data.name !== existingCoupon.name) {
    const conflict = await prisma.coupon.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: couponId },
      },
    });

    if (conflict) {
      throw new ApiError("Coupon name already exists", StatusCodes.CONFLICT);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData: any = {
      code: data.code ? data.code.toUpperCase() : existingCoupon.code,
      name: data.name || existingCoupon.name,
      description: data.description ?? existingCoupon.description,
      type: data.type || existingCoupon.type,
      value: data.value ? new Prisma.Decimal(data.value) : existingCoupon.value,
      minPurchase: data.minPurchase !== undefined
        ? data.minPurchase
          ? new Prisma.Decimal(data.minPurchase)
          : null
        : existingCoupon.minPurchase,
      maxDiscount: data.maxDiscount !== undefined
        ? data.maxDiscount
          ? new Prisma.Decimal(data.maxDiscount)
          : null
        : existingCoupon.maxDiscount,
      maxUses: data.maxUses ?? existingCoupon.maxUses,
      applicableTo: data.applicableTo || existingCoupon.applicableTo,
      productIds: data.productIds ?? existingCoupon.productIds,
      categoryIds: data.categoryIds ?? existingCoupon.categoryIds,
      startDate: data.startDate ?? existingCoupon.startDate,
      endDate: data.endDate ?? existingCoupon.endDate,
      isActive: data.isActive ?? existingCoupon.isActive,
    };

    const coupon = await tx.coupon.update({
      where: { id: couponId },
      data: updateData,
    });

    await logCouponHistory(
      tx,
      userId,
      coupon.id,
      "update",
      "Coupon updated",
      ipAddress,
      userAgent,
      coupon
    );

    return coupon;
  });

  return apiResponse("Coupon updated successfully", result);
};

export const deleteCouponService = async (
  userId: string,
  storeId: string,
  couponId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingCoupon = await prisma.coupon.findFirst({
    where: { id: couponId, storeId, isActive: true },
  });

  if (!existingCoupon) {
    throw new ApiError("Coupon not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.coupon.update({
      where: { id: couponId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await logCouponHistory(
      tx,
      userId,
      existingCoupon.id,
      "delete",
      reason,
      ipAddress,
      userAgent,
      existingCoupon
    );
  });

  return apiResponse("Coupon deleted successfully", null);
};

