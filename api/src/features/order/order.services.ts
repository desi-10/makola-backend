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

  if (!order) {
    throw new ApiError("Order not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Order fetched successfully", order);
};

export const createOrderService = async (
  userId: string,
  storeId: string,
  data: CreateOrderSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  // Check for active flashsales
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

  // Validate products exist and calculate totals
  let subtotal = new Prisma.Decimal(0);
  let discountAmount = new Prisma.Decimal(0);
  let appliedFlashSaleId: string | null = null;

  for (const item of data.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, storeId, isActive: true },
    });

    if (!product) {
      throw new ApiError(
        `Product ${item.productId} not found`,
        StatusCodes.NOT_FOUND
      );
    }

    // Use product price from database (security: don't trust client)
    const unitPrice = product.price;
    const itemSubtotal = new Prisma.Decimal(unitPrice).times(item.quantity);

    // Check if product is in any active flashsale
    let itemDiscount = new Prisma.Decimal(0);
    let flashSaleForItem = null;

    for (const flashSale of activeFlashSales) {
      if (flashSale.productIds.includes(item.productId)) {
        // Check quantity limits
        if (flashSale.maxQuantity && item.quantity > flashSale.maxQuantity) {
          throw new ApiError(
            `Maximum quantity for flashsale item is ${flashSale.maxQuantity}`,
            StatusCodes.BAD_REQUEST
          );
        }

        // Check if flashsale has remaining quantity
        if (flashSale.totalQuantity) {
          const remaining = flashSale.totalQuantity - flashSale.soldQuantity;
          if (remaining < item.quantity) {
            throw new ApiError(
              `Insufficient flashsale quantity. Only ${remaining} available`,
              StatusCodes.BAD_REQUEST
            );
          }
        }

        // Calculate flashsale discount based on product price
        const flashSaleDiscount =
          flashSale.discountType === "PERCENTAGE"
            ? itemSubtotal.times(flashSale.discountValue).dividedBy(100)
            : new Prisma.Decimal(flashSale.discountValue).times(item.quantity);

        itemDiscount = itemDiscount.plus(flashSaleDiscount);
        appliedFlashSaleId = flashSale.id;
        flashSaleForItem = flashSale;
        break; // Apply first matching flashsale
      }
    }

    subtotal = subtotal.plus(itemSubtotal);
    discountAmount = discountAmount.plus(itemDiscount);
  }

  // Validate and apply coupon if provided
  let coupon = null;
  if (data.couponId) {
    coupon = await prisma.coupon.findFirst({
      where: {
        id: data.couponId,
        storeId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    if (!coupon) {
      throw new ApiError("Invalid or expired coupon", StatusCodes.BAD_REQUEST);
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new ApiError(
        "Coupon usage limit exceeded",
        StatusCodes.BAD_REQUEST
      );
    }

    // Calculate coupon discount
    const couponDiscount =
      coupon.type === "PERCENTAGE"
        ? subtotal.times(coupon.value).dividedBy(100)
        : new Prisma.Decimal(coupon.value);

    discountAmount = discountAmount.plus(couponDiscount);
  }

  const taxAmount = new Prisma.Decimal(data.taxAmount || 0);
  const shippingAmount = new Prisma.Decimal(data.shippingAmount || 0);
  const finalAmount = subtotal
    .minus(discountAmount)
    .plus(taxAmount)
    .plus(shippingAmount);

  const result = await prisma.$transaction(async (tx) => {
    // Create order
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

    // Create order items
    for (const item of data.items) {
      // Get product to use its price (security: don't trust client)
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new ApiError(
          `Product ${item.productId} not found`,
          StatusCodes.NOT_FOUND
        );
      }

      const unitPrice = product.price;
      const itemSubtotal = new Prisma.Decimal(unitPrice).times(item.quantity);

      // Calculate item discount (including flashsale if applicable)
      let itemDiscount = new Prisma.Decimal(0);

      // Check if this item has flashsale discount
      if (appliedFlashSaleId) {
        const flashSale = activeFlashSales.find(
          (fs) => fs.id === appliedFlashSaleId
        );
        if (flashSale && flashSale.productIds.includes(item.productId)) {
          const flashSaleDiscount =
            flashSale.discountType === "PERCENTAGE"
              ? itemSubtotal.times(flashSale.discountValue).dividedBy(100)
              : new Prisma.Decimal(flashSale.discountValue).times(
                  item.quantity
                );
          itemDiscount = itemDiscount.plus(flashSaleDiscount);
        }
      }

      const itemTotal = itemSubtotal.minus(itemDiscount);

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice,
          discount: itemDiscount,
          totalPrice: itemTotal,
        },
      });

      // Update inventory (reserve quantity)
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_storeId: {
            productId: item.productId,
            storeId,
          },
        },
      });

      if (inventory) {
        if (inventory.quantity - inventory.reserved < item.quantity) {
          throw new ApiError(
            `Insufficient inventory for product ${item.productId}`,
            StatusCodes.BAD_REQUEST
          );
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { reserved: { increment: item.quantity } },
        });
      }
    }

    // Update coupon usage count
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Update flashsale sold quantity
    if (appliedFlashSaleId) {
      const flashSale = activeFlashSales.find(
        (fs) => fs.id === appliedFlashSaleId
      );
      if (flashSale) {
        const totalQuantitySold = data.items
          .filter((item) => flashSale.productIds.includes(item.productId))
          .reduce((sum, item) => sum + item.quantity, 0);

        await tx.flashSale.update({
          where: { id: appliedFlashSaleId },
          data: { soldQuantity: { increment: totalQuantitySold } },
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

  const orderWithItems = await prisma.order.findUnique({
    where: { id: result.id },
    include: {
      items: { include: { product: true } },
      coupon: true,
    },
  });

  return apiResponse("Order created successfully", orderWithItems);
};

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

  if (!existingOrder) {
    throw new ApiError("Order not found", StatusCodes.NOT_FOUND);
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        status: data.status || existingOrder.status,
        customerName: data.customerName || existingOrder.customerName,
        customerEmail: data.customerEmail ?? existingOrder.customerEmail,
        customerPhone: data.customerPhone || existingOrder.customerPhone,
        notes: data.notes || existingOrder.notes,
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
      data.status || existingOrder.status,
      "Order updated",
      ipAddress,
      userAgent,
      order
    );

    return order;
  });

  return apiResponse("Order updated successfully", result);
};

export const deleteOrderService = async (
  userId: string,
  storeId: string,
  orderId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingOrder = await prisma.order.findFirst({
    where: { id: orderId, storeId, isActive: true },
    include: { items: true },
  });

  if (!existingOrder) {
    throw new ApiError("Order not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    // Release reserved inventory
    for (const item of existingOrder.items) {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_storeId: {
            productId: item.productId,
            storeId,
          },
        },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { reserved: { decrement: item.quantity } },
        });
      }
    }

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
      existingOrder.id,
      "delete",
      "CANCELLED",
      reason,
      ipAddress,
      userAgent,
      existingOrder
    );
  });

  return apiResponse("Order deleted successfully", null);
};
