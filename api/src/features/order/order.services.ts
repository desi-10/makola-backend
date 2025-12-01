import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  CreateOrderSchemaType,
  UpdateOrderSchemaType,
} from "./order.validators.js";
import { logOrderHistory } from "./order.utils.js";
import { generateOrderNumber } from "../../utils/generate-order-number.js";
import { Prisma } from "@prisma/client";

// =======================================================
// GET ORDERS
// =======================================================
export const getOrdersService = async (storeId: string) => {
  const orders = await prisma.order.findMany({
    where: { storeId, isActive: true },
    include: {
      items: { include: { product: true } },
      coupon: true,
      flashSale: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Orders fetched successfully", orders);
};

// =======================================================
// GET SINGLE ORDER
// =======================================================
export const getOrderService = async (storeId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId, isActive: true },
    include: {
      items: { include: { product: true } },
      coupon: true,
      flashSale: true,
      payments: true,
      invoices: true,
    },
  });

  if (!order) throw new ApiError("Order not found", StatusCodes.NOT_FOUND);

  return apiResponse("Order fetched successfully", order);
};

// =======================================================
// CREATE ORDER (OPTIMIZED — NO LOOPS WITH QUERIES)
// =======================================================
export const createOrderService = async (
  userId: string,
  storeId: string,
  data: CreateOrderSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  // -----------------------------
  // Fetch active flash sales once
  // -----------------------------
  const now = new Date();
  const activeFlashSales = await prisma.flashSale.findMany({
    where: {
      storeId,
      isActive: true,
      status: "ACTIVE",
      startTime: { lte: now },
      endTime: { gte: now },
    },
  });

  // -----------------------------
  // Fetch all products at once
  // -----------------------------
  const productIds = data.items.map((i) => i.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId, isActive: true },
  });

  if (products.length !== productIds.length) {
    const existingIds = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !existingIds.has(id));
    throw new ApiError(
      `Products not found: ${missing.join(", ")}`,
      StatusCodes.NOT_FOUND
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // -----------------------------
  // Batch compute totals
  // -----------------------------
  let subtotal = new Prisma.Decimal(0);
  let discountAmount = new Prisma.Decimal(0);
  let appliedFlashSaleId: string | null = null;

  const flashSaleMap = new Map(activeFlashSales.map((fs) => [fs.id, fs]));

  for (const item of data.items) {
    const product = productMap.get(item.productId)!;
    const unitPrice = product.price;
    const itemSubtotal = unitPrice.mul(item.quantity);

    subtotal = subtotal.plus(itemSubtotal);

    // Detect if item has flash sale
    const flashSale = activeFlashSales.find((fs) =>
      fs.productIds.includes(item.productId)
    );

    if (flashSale) {
      appliedFlashSaleId = flashSale.id;

      // Quantity checks
      if (flashSale.maxQuantity && item.quantity > flashSale.maxQuantity) {
        throw new ApiError(
          `Maximum quantity for flash sale item is ${flashSale.maxQuantity}`,
          StatusCodes.BAD_REQUEST
        );
      }

      if (flashSale.totalQuantity) {
        const remaining = flashSale.totalQuantity - flashSale.soldQuantity;
        if (remaining < item.quantity) {
          throw new ApiError(
            `Flash sale remaining quantity: ${remaining}`,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // Compute discount
      const flashDiscount =
        flashSale.discountType === "PERCENTAGE"
          ? itemSubtotal.mul(flashSale.discountValue).div(100)
          : new Prisma.Decimal(flashSale.discountValue).mul(item.quantity);

      discountAmount = discountAmount.plus(flashDiscount);
    }
  }

  // -----------------------------
  // Validate coupon
  // -----------------------------
  let coupon: any = null;

  if (data.couponId) {
    coupon = await prisma.coupon.findFirst({
      where: {
        id: data.couponId,
        storeId,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    if (!coupon)
      throw new ApiError("Invalid or expired coupon", StatusCodes.BAD_REQUEST);

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new ApiError(
        "Coupon usage limit exceeded",
        StatusCodes.BAD_REQUEST
      );
    }

    const couponDiscount =
      coupon.type === "PERCENTAGE"
        ? subtotal.mul(coupon.value).div(100)
        : new Prisma.Decimal(coupon.value);

    discountAmount = discountAmount.plus(couponDiscount);
  }

  // -----------------------------
  // Final amounts
  // -----------------------------
  const taxAmount = new Prisma.Decimal(data.taxAmount || 0);
  const shippingAmount = new Prisma.Decimal(data.shippingAmount || 0);

  const finalAmount = subtotal
    .minus(discountAmount)
    .plus(taxAmount)
    .plus(shippingAmount);

  // =======================================================
  // TRANSACTION START
  // =======================================================
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        storeId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        status: "PENDING",
        totalAmount: subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        finalAmount,
        couponId: data.couponId || undefined,
        flashSaleId: appliedFlashSaleId || undefined,
        notes: data.notes,
        shippingAddress: data.shippingAddress
          ? JSON.stringify(data.shippingAddress)
          : undefined,
      },
    });

    // -----------------------------
    // Batch inventory fetch
    // -----------------------------
    const inventoryRecords = await tx.inventory.findMany({
      where: {
        productId: { in: productIds },
        storeId,
      },
    });

    const inventoryMap = new Map(inventoryRecords.map((i) => [i.productId, i]));

    // -----------------------------
    // Create order items + update inventory
    // -----------------------------
    const orderItemCreates = [];
    const inventoryUpdates = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.price;
      const itemSubtotal = unitPrice.mul(item.quantity);

      // flash sale discount
      let itemDiscount = new Prisma.Decimal(0);

      if (appliedFlashSaleId) {
        const fs = flashSaleMap.get(appliedFlashSaleId);
        if (fs && fs.productIds.includes(item.productId)) {
          itemDiscount =
            fs.discountType === "PERCENTAGE"
              ? itemSubtotal.mul(fs.discountValue).div(100)
              : new Prisma.Decimal(fs.discountValue).mul(item.quantity);
        }
      }

      const itemTotal = itemSubtotal.minus(itemDiscount);

      orderItemCreates.push(
        tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            discount: itemDiscount,
            totalPrice: itemTotal,
          },
        })
      );

      const inv = inventoryMap.get(item.productId);
      if (inv) {
        if (inv.quantity - inv.reserved < item.quantity) {
          throw new ApiError(
            `Insufficient inventory for product ${item.productId}`,
            StatusCodes.BAD_REQUEST
          );
        }

        inventoryUpdates.push(
          tx.inventory.update({
            where: { id: inv.id },
            data: { reserved: { increment: item.quantity } },
          })
        );
      }
    }

    await Promise.all(orderItemCreates);
    await Promise.all(inventoryUpdates);

    // -----------------------------
    // Update coupon usage
    // -----------------------------
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // -----------------------------
    // Flash sale sold quantity
    // -----------------------------
    if (appliedFlashSaleId) {
      const flashSale = flashSaleMap.get(appliedFlashSaleId);
      if (flashSale) {
        const totalSold = data.items
          .filter((i) => flashSale.productIds.includes(i.productId))
          .reduce((a, b) => a + b.quantity, 0);

        await tx.flashSale.update({
          where: { id: appliedFlashSaleId },
          data: { soldQuantity: { increment: totalSold } },
        });
      }
    }

    await logOrderHistory(
      tx,
      userId,
      order.id,
      "create",
      "PENDING",
      "Order created",
      ipAddress,
      userAgent,
      order
    );

    return order;
  });

  // Fetch order with items
  const orderWithItems = await prisma.order.findUnique({
    where: { id: result.id },
    include: {
      items: { include: { product: true } },
      coupon: true,
    },
  });

  return apiResponse("Order created successfully", orderWithItems);
};

// =======================================================
// UPDATE ORDER
// =======================================================
export const updateOrderService = async (
  userId: string,
  storeId: string,
  orderId: string,
  data: UpdateOrderSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingOrder = await prisma.order.findFirst({
    where: { id: orderId, storeId, isActive: true },
  });

  if (!existingOrder)
    throw new ApiError("Order not found", StatusCodes.NOT_FOUND);

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        status: data.status ?? existingOrder.status,
        customerName: data.customerName ?? existingOrder.customerName,
        customerEmail: data.customerEmail ?? existingOrder.customerEmail,
        customerPhone: data.customerPhone ?? existingOrder.customerPhone,
        notes: data.notes ?? existingOrder.notes,
        shippingAddress: data.shippingAddress
          ? JSON.stringify(data.shippingAddress)
          : (existingOrder.shippingAddress as any) ?? undefined,
      },
    });

    await logOrderHistory(
      tx,
      userId,
      order.id,
      "update",
      order.status,
      "Order updated",
      ipAddress,
      userAgent,
      order
    );

    return order;
  });

  return apiResponse("Order updated successfully", updated);
};

// =======================================================
// DELETE ORDER
// =======================================================
export const deleteOrderService = async (
  userId: string,
  storeId: string,
  orderId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId, isActive: true },
    include: { items: true },
  });

  if (!order) throw new ApiError("Order not found", StatusCodes.NOT_FOUND);

  await prisma.$transaction(async (tx) => {
    const productIds = order.items.map((i) => i.productId);

    const inventoryRecords = await tx.inventory.findMany({
      where: { productId: { in: productIds }, storeId },
    });

    const inventoryMap = new Map(inventoryRecords.map((i) => [i.productId, i]));

    const updates = order.items.map((item) => {
      const inv = inventoryMap.get(item.productId);
      if (!inv) return null;

      return tx.inventory.update({
        where: { id: inv.id },
        data: { reserved: { decrement: item.quantity } },
      });
    });

    await Promise.all(updates.filter(Boolean));

    await tx.order.update({
      where: { id: orderId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: "CANCELLED",
      },
    });

    await logOrderHistory(
      tx,
      userId,
      orderId,
      "delete",
      "CANCELLED",
      reason,
      ipAddress,
      userAgent,
      order
    );
  });

  return apiResponse("Order deleted successfully", null);
};
