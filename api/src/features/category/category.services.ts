import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  CreateCategorySchemaType,
  UpdateCategorySchemaType,
} from "./category.validators.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";

export const getCategoriesService = async (storeId: string) => {
  const categories = await prisma.category.findMany({
    where: { storeId, isActive: true },
  });

  return apiResponse("Categories fetched successfully", categories);
};

export const createCategoryService = async (
  userId: string,
  storeId: string,
  data: CreateCategorySchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  const existingCategory = await prisma.category.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingCategory) {
    throw new ApiError("Category already exists", StatusCodes.CONFLICT);
  }

  let image: string | null = null;
  if (file) {
    const uploadedImage = await uploadToCloudinary("categories", file.buffer);
    image = uploadedImage.secure_url;
  }

  const category = await prisma.category.create({
    data: {
      ...data,
      storeId,
      image: image ?? undefined,
    },
  });

  return apiResponse("Category created successfully", category);
};

export const getCategoryService = async (
  storeId: string,
  categoryId: string
) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId, isActive: true },
  });

  if (!category) {
    throw new ApiError("Category not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Category fetched successfully", category);
};

export const updateCategoryService = async (
  userId: string,
  storeId: string,
  categoryId: string,
  data: UpdateCategorySchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  const existingCategory = await prisma.category.findFirst({
    where: { id: categoryId, storeId, isActive: true },
  });

  if (!existingCategory) {
    throw new ApiError("Category not found", StatusCodes.NOT_FOUND);
  }

  if (data.name && data.name !== existingCategory.name) {
    const conflict = await prisma.category.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: categoryId },
      },
    });

    if (conflict) {
      throw new ApiError("Category already exists", StatusCodes.CONFLICT);
    }
  }

  let image = existingCategory.image;
  if (file) {
    const uploadedImage = await uploadToCloudinary("categories", file.buffer);
    image = uploadedImage.secure_url;
    if (existingCategory.image) {
      await deleteFromCloudinary(existingCategory.image);
    }
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: data.name || existingCategory.name,
      description: data.description || existingCategory.description,
      image,
      isActive: data.isActive ?? existingCategory.isActive,
    },
  });

  return apiResponse("Category updated successfully", category);
};

export const deleteCategoryService = async (
  userId: string,
  storeId: string,
  categoryId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingCategory = await prisma.category.findFirst({
    where: { id: categoryId, storeId, isActive: true },
  });

  if (!existingCategory) {
    throw new ApiError("Category not found", StatusCodes.NOT_FOUND);
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return apiResponse("Category deleted successfully", null);
};
