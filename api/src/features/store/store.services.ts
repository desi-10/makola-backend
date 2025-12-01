import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { logStoreHistory } from "./store.utils.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";
import {
  CreateStoreSchemaType,
  UpdateStoreSchemaType,
} from "./store.validators.js";

export const getStoresService = async (organizationId: string) => {
  const stores = await prisma.store.findMany({
    where: { organizationId: organizationId },
  });

  return apiResponse("Stores fetched successfully", stores);
};

export const createStoreService = async (
  userId: string,
  organizationId: string,
  data: CreateStoreSchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  console.log(userId, "userId");
  console.log(organizationId, "organizationId");
  const existingStore = await prisma.store.findFirst({
    where: { name: data.name, organizationId: organizationId, isActive: true },
  });

  if (existingStore) {
    throw new ApiError("Store already exists", StatusCodes.CONFLICT);
  }

  let image = null;
  if (file) {
    const uploadedImage = await uploadToCloudinary("stores", file.buffer);
    image = uploadedImage.secure_url;
  }

  const result = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        ...data,
        organizationId: organizationId,
        image: image,
      },
    });

    const role = await tx.storeRole.create({
      data: {
        name: "owner",
        description: "Owner of the store",
        storeId: store.id,
      },
    });

    await tx.storeMember.create({
      data: {
        userId: userId,
        storeId: store.id,
        roleId: role.id,
      },
    });

    await logStoreHistory(
      tx,
      userId,
      store.id,
      "create",
      "Store created successfully",
      ipAddress,
      userAgent,
      store
    );

    return store;
  });

  return apiResponse("Store created successfully", result);
};

export const getStoreService = async (
  userId: string,
  organizationId: string,
  storeId: string
) => {
  const store = await prisma.store.findFirst({
    where: { organizationId: organizationId, id: storeId, isActive: true },
  });

  if (!store) {
    throw new ApiError("Store not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Store fetched successfully", store);
};

export const updateStoreService = async (
  userId: string,
  organizationId: string,
  storeId: string,
  data: UpdateStoreSchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  const existingStore = await prisma.store.findFirst({
    where: { id: storeId, organizationId: organizationId, isActive: true },
  });

  if (!existingStore) {
    throw new ApiError("Store not found", StatusCodes.NOT_FOUND);
  }

  const existingStoreConflict = await prisma.store.findFirst({
    where: { name: data.name, organizationId: organizationId, isActive: true },
  });

  if (existingStoreConflict && existingStoreConflict.id !== storeId) {
    throw new ApiError("Store name already exists", StatusCodes.CONFLICT);
  }

  let image = existingStore.image;
  if (file) {
    const uploadedImage = await uploadToCloudinary("stores", file.buffer);
    image = uploadedImage.secure_url;
    if (existingStore.image) await deleteFromCloudinary(existingStore.image);
  }

  const result = await prisma.$transaction(async (tx) => {
    const store = await tx.store.update({
      where: { id: storeId },
      data: {
        name: data.name || existingStore.name,
        description: data.description || existingStore.description,
        image: image,
        isActive: data.isActive ?? existingStore.isActive,
      },
    });

    await logStoreHistory(
      tx,
      userId,
      store.id,
      "update",
      "Store updated",
      ipAddress,
      userAgent,
      store
    );

    return store;
  });

  return apiResponse("Store updated successfully", result);
};

export const deleteStoreService = async (
  userId: string,
  organizationId: string,
  storeId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingStore = await prisma.store.findFirst({
    where: { id: storeId, organizationId: organizationId, isActive: true },
  });

  if (!existingStore)
    throw new ApiError("Store not found", StatusCodes.NOT_FOUND);

  await prisma.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: storeId },
      data: { deletedAt: new Date(), isActive: false },
    });

    await logStoreHistory(
      tx,
      userId,
      existingStore.id,
      "delete",
      reason,
      ipAddress,
      userAgent,
      existingStore
    );
  });

  return apiResponse("Store deleted successfully", null);
};

export const getStoreHistoryService = async (
  userId: string,
  organizationId: string,
  storeId: string
) => {
  const history = await prisma.storeHistory.findMany({
    where: { storeId: storeId },
  });
  const parsedHistory = history.map((item) => {
    return {
      ...item,
      meta: JSON.parse(item.meta as string),
    };
  });
  return apiResponse("Store history fetched successfully", parsedHistory);
};

export const getStoreHistoryByIdService = async (storeHistoryId: string) => {
  const history = await prisma.storeHistory.findUnique({
    where: { id: storeHistoryId },
  });
  const parsedHistory = {
    ...history,
    meta: JSON.parse(history?.meta as string),
  };

  return apiResponse("Store history fetched successfully", parsedHistory);
};
