import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateCartSchemaType, UpdateCartSchemaType } from "./cart.validators.js";
import { Prisma } from "@prisma/client";

export const getCartsService = async (storeId: string) => {
  const carts = await prisma.cart.findMany({
    where: { storeId, isActive: true },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Carts fetched successfully", carts);
};

export const getAbandonedCartsService = async (storeId: string, hoursAgo: number = 24) => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);

  const carts = await prisma.cart.findMany({
    where: {
      storeId,
      isActive: true,
      status: "ACTIVE",
      updatedAt: { lt: cutoffDate },
    },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  return apiResponse("Abandoned carts fetched successfully", carts);
};

export const getCartService = async (storeId: string, cartId: string) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, storeId, isActive: true },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!cart) {
    throw new ApiError("Cart not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Cart fetched successfully", cart);
};

export const createCartService = async (
  storeId: string,
  data: CreateCartSchemaType
) => {
  // Validate products exist
  for (const item of data.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, storeId, isActive: true },
    });

    if (!product) {
      throw new ApiError(`Product ${item.productId} not found`, StatusCodes.NOT_FOUND);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.create({
      data: {
        storeId,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        status: "ACTIVE",
      },
    });

    // Create cart items
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new ApiError(`Product ${item.productId} not found`, StatusCodes.NOT_FOUND);
      }

      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        },
      });
    }

    return cart;
  });

  const cartWithItems = await prisma.cart.findUnique({
    where: { id: result.id },
    include: {
      items: { include: { product: true } },
    },
  });

  return apiResponse("Cart created successfully", cartWithItems);
};

export const updateCartService = async (
  storeId: string,
  cartId: string,
  data: UpdateCartSchemaType
) => {
  const existingCart = await prisma.cart.findFirst({
    where: { id: cartId, storeId, isActive: true },
  });

  if (!existingCart) {
    throw new ApiError("Cart not found", StatusCodes.NOT_FOUND);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update cart info
    await tx.cart.update({
      where: { id: cartId },
      data: {
        customerEmail: data.customerEmail ?? existingCart.customerEmail,
        customerPhone: data.customerPhone ?? existingCart.customerPhone,
        customerName: data.customerName ?? existingCart.customerName,
      },
    });

    // Update items if provided
    if (data.items) {
      // Delete existing items
      await tx.cartItem.deleteMany({
        where: { cartId },
      });

      // Validate and create new items
      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId, isActive: true },
        });

        if (!product) {
          throw new ApiError(`Product ${item.productId} not found`, StatusCodes.NOT_FOUND);
        }

        await tx.cartItem.create({
          data: {
            cartId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
          },
        });
      }
    }

    return await tx.cart.findUnique({
      where: { id: cartId },
      include: {
        items: { include: { product: true } },
      },
    });
  });

  return apiResponse("Cart updated successfully", result);
};

export const markCartAbandonedService = async (storeId: string, cartId: string) => {
  const existingCart = await prisma.cart.findFirst({
    where: { id: cartId, storeId, isActive: true },
  });

  if (!existingCart) {
    throw new ApiError("Cart not found", StatusCodes.NOT_FOUND);
  }

  const cart = await prisma.cart.update({
    where: { id: cartId },
    data: {
      status: "ABANDONED",
      abandonedAt: new Date(),
    },
  });

  return apiResponse("Cart marked as abandoned", cart);
};

export const convertCartToOrderService = async (
  storeId: string,
  cartId: string,
  orderData: any
) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, storeId, isActive: true },
    include: { items: { include: { product: true } } },
  });

  if (!cart) {
    throw new ApiError("Cart not found", StatusCodes.NOT_FOUND);
  }

  if (cart.items.length === 0) {
    throw new ApiError("Cart is empty", StatusCodes.BAD_REQUEST);
  }

  // Convert cart items to order items format
  const orderItems = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  // Import order service
  const { createOrderService } = await import("../order/order.services.js");
  
  // Create order from cart
  const order = await createOrderService(
    cart.customerEmail || "system",
    storeId,
    {
      customerName: cart.customerName || orderData.customerName,
      customerEmail: cart.customerEmail || orderData.customerEmail,
      customerPhone: cart.customerPhone || orderData.customerPhone,
      items: orderItems,
      couponId: orderData.couponId,
      taxAmount: orderData.taxAmount,
      shippingAmount: orderData.shippingAmount,
      notes: orderData.notes,
      shippingAddress: orderData.shippingAddress,
    },
    "system",
    "system"
  );

  // Mark cart as converted
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      status: "CONVERTED",
    },
  });

  return apiResponse("Cart converted to order successfully", order);
};

export const deleteCartService = async (storeId: string, cartId: string) => {
  const existingCart = await prisma.cart.findFirst({
    where: { id: cartId, storeId, isActive: true },
  });

  if (!existingCart) {
    throw new ApiError("Cart not found", StatusCodes.NOT_FOUND);
  }

  await prisma.cart.update({
    where: { id: cartId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return apiResponse("Cart deleted successfully", null);
};

