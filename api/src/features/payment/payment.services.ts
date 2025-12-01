import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreatePaymentSchemaType, UpdatePaymentSchemaType } from "./payment.validators.js";
import { logPaymentHistory } from "./payment.utils.js";
import { Prisma } from "@prisma/client";

export const getPaymentsService = async (storeId: string) => {
  const payments = await prisma.payment.findMany({
    where: { storeId, isActive: true },
    include: { order: true },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Payments fetched successfully", payments);
};

export const getPaymentService = async (storeId: string, paymentId: string) => {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, storeId, isActive: true },
    include: { order: true },
  });

  if (!payment) {
    throw new ApiError("Payment not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Payment fetched successfully", payment);
};

export const createPaymentService = async (
  userId: string,
  storeId: string,
  data: CreatePaymentSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, storeId, isActive: true },
  });

  if (!order) {
    throw new ApiError("Order not found", StatusCodes.NOT_FOUND);
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId: data.orderId,
        storeId,
        amount: new Prisma.Decimal(data.amount),
        method: data.method,
        status: "PENDING",
        transactionId: data.transactionId,
        reference: data.reference,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    await logPaymentHistory(
      tx,
      userId,
      payment.id,
      "create",
      "PENDING",
      "Payment created",
      ipAddress,
      userAgent,
      payment
    );

    return payment;
  });

  return apiResponse("Payment created successfully", result);
};

export const updatePaymentService = async (
  userId: string,
  storeId: string,
  paymentId: string,
  data: UpdatePaymentSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingPayment = await prisma.payment.findFirst({
    where: { id: paymentId, storeId, isActive: true },
  });

  if (!existingPayment) {
    throw new ApiError("Payment not found", StatusCodes.NOT_FOUND);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData: any = {
      transactionId: data.transactionId ?? existingPayment.transactionId,
      reference: data.reference ?? existingPayment.reference,
    };

    if (data.status) {
      updateData.status = data.status;
      if (data.status === "COMPLETED") {
        updateData.paidAt = new Date();
      }
    }

    if (data.metadata) {
      updateData.metadata = JSON.stringify(data.metadata);
    }

    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    await logPaymentHistory(
      tx,
      userId,
      payment.id,
      "update",
      data.status || existingPayment.status,
      "Payment updated",
      ipAddress,
      userAgent,
      payment
    );

    return payment;
  });

  return apiResponse("Payment updated successfully", result);
};

export const deletePaymentService = async (
  userId: string,
  storeId: string,
  paymentId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingPayment = await prisma.payment.findFirst({
    where: { id: paymentId, storeId, isActive: true },
  });

  if (!existingPayment) {
    throw new ApiError("Payment not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await logPaymentHistory(
      tx,
      userId,
      existingPayment.id,
      "delete",
      null,
      reason,
      ipAddress,
      userAgent,
      existingPayment
    );
  });

  return apiResponse("Payment deleted successfully", null);
};

