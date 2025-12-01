import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  CreateProductSchemaType,
  UpdateProductSchemaType,
} from "./product.validators.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";

export const getProductsService = async (storeId: string) => {
  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    include: { category: true },
  });

  return apiResponse("Products fetched successfully", products);
};

export const createProductService = async (
  userId: string,
  storeId: string,
  data: CreateProductSchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  const existingProduct = await prisma.product.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingProduct) {
    throw new ApiError("Product already exists", StatusCodes.CONFLICT);
  }

  if (data.sku) {
    const existingSku = await prisma.product.findFirst({
      where: { sku: data.sku, storeId, isActive: true },
    });

    if (existingSku) {
      throw new ApiError("SKU already exists", StatusCodes.CONFLICT);
    }
  }

  let image: string | null = null;
  if (file) {
    const uploadedImage = await uploadToCloudinary("products", file.buffer);
    image = uploadedImage.secure_url;
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      sku: data.sku,
      storeId,
      categoryId: data.categoryId ?? undefined,
      image: image ?? undefined,
    },
  });

  return apiResponse("Product created successfully", product);
};

export const getProductService = async (storeId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId, isActive: true },
    include: { category: true },
  });

  if (!product) {
    throw new ApiError("Product not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Product fetched successfully", product);
};

export const updateProductService = async (
  userId: string,
  storeId: string,
  productId: string,
  data: UpdateProductSchemaType,
  file: Express.Multer.File | undefined,
  ipAddress: string,
  userAgent: string
) => {
  console.log(productId, "productId");
  console.log(storeId, "storeId");

  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, storeId, isActive: true },
  });

  if (!existingProduct) {
    throw new ApiError("Product not found", StatusCodes.NOT_FOUND);
  }

  if (data.name && data.name !== existingProduct.name) {
    const conflict = await prisma.product.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: productId },
      },
    });

    if (conflict) {
      console.log(conflict, "update");
      throw new ApiError("Product already exists", StatusCodes.CONFLICT);
    }
  }

  if (data.sku && data.sku !== existingProduct.sku) {
    const existingSku = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        storeId,
        isActive: true,
        NOT: { id: productId },
      },
    });

    if (existingSku) {
      throw new ApiError("SKU already exists", StatusCodes.CONFLICT);
    }
  }

  let image = existingProduct.image;
  if (file) {
    const uploadedImage = await uploadToCloudinary("products", file.buffer);
    image = uploadedImage.secure_url;
    if (existingProduct.image) {
      await deleteFromCloudinary(existingProduct.image);
    }
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name || existingProduct.name,
      description: data.description || existingProduct.description,
      price: data.price ?? existingProduct.price,
      sku: data.sku || existingProduct.sku,
      categoryId: data.categoryId ?? existingProduct.categoryId,
      image,
      isActive: data.isActive ?? existingProduct.isActive,
    },
  });

  return apiResponse("Product updated successfully", product);
};

export const deleteProductService = async (
  userId: string,
  storeId: string,
  productId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, storeId, isActive: true },
  });

  if (!existingProduct) {
    throw new ApiError("Product not found", StatusCodes.NOT_FOUND);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return apiResponse("Product deleted successfully", null);
};
