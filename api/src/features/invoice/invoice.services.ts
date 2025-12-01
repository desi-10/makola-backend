import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateInvoiceSchemaType, UpdateInvoiceSchemaType } from "./invoice.validators.js";
import { logInvoiceHistory } from "./invoice.utils.js";
import { generateInvoiceNumber } from "../../utils/generate-order-number.js";
import { Prisma } from "@prisma/client";

export const getInvoicesService = async (storeId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: { storeId, isActive: true },
    include: { order: true },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Invoices fetched successfully", invoices);
};

export const getInvoiceService = async (storeId: string, invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, storeId, isActive: true },
    include: {
      order: {
        include: {
          items: { include: { product: true } },
          coupon: true,
          flashSale: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new ApiError("Invoice not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Invoice fetched successfully", invoice);
};

export const createInvoiceService = async (
  userId: string,
  storeId: string,
  data: CreateInvoiceSchemaType,
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
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        orderId: data.orderId,
        storeId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        billingAddress: data.billingAddress ? JSON.stringify(data.billingAddress) : undefined,
        subtotal: order.totalAmount,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.finalAmount,
        status: "DRAFT",
        dueDate: data.dueDate,
        notes: data.notes,
      },
    });

    await logInvoiceHistory(
      tx,
      userId,
      invoice.id,
      "create",
      "DRAFT",
      "Invoice created",
      ipAddress,
      userAgent,
      invoice
    );

    return invoice;
  });

  return apiResponse("Invoice created successfully", result);
};

export const updateInvoiceService = async (
  userId: string,
  storeId: string,
  invoiceId: string,
  data: UpdateInvoiceSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingInvoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, storeId, isActive: true },
  });

  if (!existingInvoice) {
    throw new ApiError("Invoice not found", StatusCodes.NOT_FOUND);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData: any = {
      customerName: data.customerName || existingInvoice.customerName,
      customerEmail: data.customerEmail ?? existingInvoice.customerEmail,
      customerPhone: data.customerPhone || existingInvoice.customerPhone,
      dueDate: data.dueDate || existingInvoice.dueDate,
      notes: data.notes || existingInvoice.notes,
    };

    if (data.billingAddress) {
      updateData.billingAddress = JSON.stringify(data.billingAddress);
    }

    if (data.status) {
      updateData.status = data.status;
      if (data.status === "PAID") {
        updateData.paidAt = new Date();
      }
    }

    const invoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    await logInvoiceHistory(
      tx,
      userId,
      invoice.id,
      "update",
      data.status || existingInvoice.status,
      "Invoice updated",
      ipAddress,
      userAgent,
      invoice
    );

    return invoice;
  });

  return apiResponse("Invoice updated successfully", result);
};

export const deleteInvoiceService = async (
  userId: string,
  storeId: string,
  invoiceId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingInvoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, storeId, isActive: true },
  });

  if (!existingInvoice) {
    throw new ApiError("Invoice not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: "CANCELLED",
      },
    });

    await logInvoiceHistory(
      tx,
      userId,
      existingInvoice.id,
      "delete",
      "CANCELLED",
      reason,
      ipAddress,
      userAgent,
      existingInvoice
    );
  });

  return apiResponse("Invoice deleted successfully", null);
};

