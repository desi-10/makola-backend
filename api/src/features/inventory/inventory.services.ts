import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  CreateInventorySchemaType,
  UpdateInventorySchemaType,
  AdjustInventorySchemaType,
} from "./inventory.validators.js";
import { logInventoryHistory } from "./inventory.utils.js";

export const getInventoriesService = async (storeId: string) => {
  const inventories = await prisma.inventory.findMany({
    where: { storeId, isActive: true },
    include: { product: true },
  });

  return apiResponse("Inventories fetched successfully", inventories);
};

export const getInventoryService = async (
  storeId: string,
  inventoryId: string
) => {
  const inventory = await prisma.inventory.findFirst({
    where: { id: inventoryId, storeId, isActive: true },
    include: { product: true },
  });

  if (!inventory) {
    throw new ApiError("Inventory not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Inventory fetched successfully", inventory);
};

export const createInventoryService = async (
  userId: string,
  storeId: string,
  data: CreateInventorySchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, storeId, isActive: true },
  });

  if (!product) {
    throw new ApiError("Product not found", StatusCodes.NOT_FOUND);
  }

  const existingInventory = await prisma.inventory.findUnique({
    where: {
      productId_storeId: {
        productId: data.productId,
        storeId: storeId,
      },
    },
  });

  if (existingInventory) {
    throw new ApiError(
      "Inventory already exists for this product",
      StatusCodes.CONFLICT
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.create({
      data: {
        productId: data.productId,
        storeId,
        quantity: data.quantity,
        reserved: data.reserved || 0,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive ?? true,
      },
    });

    await logInventoryHistory(
      tx,
      userId,
      inventory.id,
      "create",
      data.quantity,
      0,
      data.quantity,
      "Inventory created",
      ipAddress,
      userAgent,
      inventory
    );

    return inventory;
  });

  return apiResponse("Inventory created successfully", result);
};

export const updateInventoryService = async (
  userId: string,
  storeId: string,
  inventoryId: string,
  data: UpdateInventorySchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingInventory = await prisma.inventory.findFirst({
    where: { id: inventoryId, storeId, isActive: true },
  });

  if (!existingInventory) {
    throw new ApiError("Inventory not found", StatusCodes.NOT_FOUND);
  }

  const previousQuantity = existingInventory.quantity;
  const newQuantity = data.quantity ?? previousQuantity;

  const result = await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity: data.quantity ?? existingInventory.quantity,
        reserved: data.reserved ?? existingInventory.reserved,
        lowStockThreshold:
          data.lowStockThreshold ?? existingInventory.lowStockThreshold,
        isActive: data.isActive ?? existingInventory.isActive,
      },
    });

    await logInventoryHistory(
      tx,
      userId,
      inventory.id,
      "update",
      newQuantity - previousQuantity,
      previousQuantity,
      newQuantity,
      "Inventory updated",
      ipAddress,
      userAgent,
      inventory
    );

    return inventory;
  });

  return apiResponse("Inventory updated successfully", result);
};

export const adjustInventoryService = async (
  userId: string,
  storeId: string,
  inventoryId: string,
  data: AdjustInventorySchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingInventory = await prisma.inventory.findFirst({
    where: { id: inventoryId, storeId, isActive: true },
  });

  if (!existingInventory) {
    throw new ApiError("Inventory not found", StatusCodes.NOT_FOUND);
  }

  const previousQuantity = existingInventory.quantity;
  const newQuantity = previousQuantity + data.quantity;

  if (newQuantity < 0) {
    throw new ApiError("Insufficient inventory", StatusCodes.BAD_REQUEST);
  }

  const result = await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.update({
      where: { id: inventoryId },
      data: { quantity: newQuantity },
    });

    await logInventoryHistory(
      tx,
      userId,
      inventory.id,
      "adjust",
      data.quantity,
      previousQuantity,
      newQuantity,
      data.reason || "Inventory adjusted",
      ipAddress,
      userAgent,
      inventory
    );

    return inventory;
  });

  return apiResponse("Inventory adjusted successfully", result);
};

export const deleteInventoryService = async (
  userId: string,
  storeId: string,
  inventoryId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingInventory = await prisma.inventory.findFirst({
    where: { id: inventoryId, storeId, isActive: true },
  });

  if (!existingInventory) {
    throw new ApiError("Inventory not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventory.update({
      where: { id: inventoryId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await logInventoryHistory(
      tx,
      userId,
      existingInventory.id,
      "delete",
      0,
      existingInventory.quantity,
      0,
      reason,
      ipAddress,
      userAgent,
      existingInventory
    );
  });

  return apiResponse("Inventory deleted successfully", null);
};
