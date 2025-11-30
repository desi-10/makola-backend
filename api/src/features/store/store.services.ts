import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { logStoreHistory } from "./store.utils.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";

export const getStoresService = async (organizationId: string) => {
  const stores = await prisma.store.findMany({
    where: { organizationId: organizationId },
  });

  return apiResponse("Stores fetched successfully", stores);
};

export const createStoreService = async (
  userId: string,
  organizationId: string,
  data: any,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
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

  const store = await prisma.store.create({
    data: {
      ...data,
      organizationId: organizationId,
      image: image,
    },
  });

  const role = await prisma.storeRole.create({
    data: {
      name: "owner",
      description: "Owner of the store",
      storeId: store.id,
    },
  });

  await prisma.storeMember.create({
    data: {
      userId: userId,
      storeId: store.id,
      roleId: role.id,
    },
  });

  await logStoreHistory(
    userId,
    store.id,
    "create",
    "Store created successfully",
    ipAddress,
    userAgent,
    store
  );

  return apiResponse("Store created successfully", store);
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
  data: any,
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

  let image = existingStore.image;
  if (file) {
    const uploadedImage = await uploadToCloudinary("stores", file.buffer);
    image = uploadedImage.secure_url;
    if (existingStore.image) await deleteFromCloudinary(existingStore.image);
  }

  const store = await prisma.store.update({
    where: { id: storeId },
    data: {
      name: data.name || existingStore.name,
      description: data.description || existingStore.description,
      image: image,
      isActive: data.isActive ?? existingStore.isActive,
    },
  });

  await logStoreHistory(
    userId,
    store.id,
    "update",
    "Store updated",
    ipAddress,
    userAgent,
    store
  );

  return apiResponse("Store updated successfully", store);
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

  await prisma.store.update({
    where: { id: storeId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logStoreHistory(
    userId,
    existingStore.id,
    "delete",
    reason,
    ipAddress,
    userAgent,
    existingStore
  );

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
