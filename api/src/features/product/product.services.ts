import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import {
  CreateProductSchemaType,
  UpdateProductSchemaType,
} from "./product.validators.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";
import { logProductHistory } from "./product.utils.js";

export const getProductsService = async (storeId: string) => {
  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    include: {
      category: true,
      brand: true,
      variants: { where: { isActive: true } },
      images: { orderBy: { order: "asc" } },
      tagRelations: { include: { tag: true } },
      specifications: { orderBy: { order: "asc" } },
    },
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
  // Validate uniqueness
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

  if (data.barcode) {
    const existingBarcode = await prisma.product.findFirst({
      where: { barcode: data.barcode, storeId, isActive: true },
    });

    if (existingBarcode) {
      throw new ApiError("Barcode already exists", StatusCodes.CONFLICT);
    }
  }

  if (data.slug) {
    const existingSlug = await prisma.product.findFirst({
      where: { slug: data.slug, storeId, isActive: true },
    });

    if (existingSlug) {
      throw new ApiError("Slug already exists", StatusCodes.CONFLICT);
    }
  }

  // Validate category and brand exist
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, storeId, isActive: true },
    });
    if (!category) {
      throw new ApiError("Category not found", StatusCodes.NOT_FOUND);
    }
  }

  if (data.brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: data.brandId, storeId, isActive: true },
    });
    if (!brand) {
      throw new ApiError("Brand not found", StatusCodes.NOT_FOUND);
    }
  }

  // Upload primary image
  let image: string | null = null;
  if (file) {
    const uploadedImage = await uploadToCloudinary("products", file.buffer);
    image = uploadedImage.secure_url;
  }

  // Create product with all related data in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
        shortDescription: data.shortDescription ?? undefined,
        slug: data.slug ?? undefined,
        sku: data.sku ?? undefined,
        barcode: data.barcode ?? undefined,
        modelNumber: data.modelNumber ?? undefined,
        storeId,
        categoryId: data.categoryId ?? undefined,
        brandId: data.brandId ?? undefined,
        price: new Prisma.Decimal(data.price),
        costPrice: data.costPrice
          ? new Prisma.Decimal(data.costPrice)
          : undefined,
        comparePrice: data.comparePrice
          ? new Prisma.Decimal(data.comparePrice)
          : undefined,
        weight: data.weight ? new Prisma.Decimal(data.weight) : undefined,
        length: data.length ? new Prisma.Decimal(data.length) : undefined,
        width: data.width ? new Prisma.Decimal(data.width) : undefined,
        height: data.height ? new Prisma.Decimal(data.height) : undefined,
        condition: data.condition ?? undefined,
        warrantyDuration: data.warrantyDuration ?? undefined,
        isFeatured: data.isFeatured ?? false,
        metaTitle: data.metaTitle ?? undefined,
        metaDescription: data.metaDescription ?? undefined,
        image: image ?? undefined,
        videoUrl: data.videoUrl ?? undefined,
        shippingClass: data.shippingClass ?? undefined,
        taxCategory: data.taxCategory ?? undefined,
        isActive: data.isActive ?? true,
      },
    });

    // Create variants
    if (data.variants && data.variants.length > 0) {
      await Promise.all(
        data.variants.map((variant) =>
          tx.productVariant.create({
            data: {
              productId: product.id,
              name: variant.name,
              sku: variant.sku ?? undefined,
              barcode: variant.barcode ?? undefined,
              price: variant.price
                ? new Prisma.Decimal(variant.price)
                : undefined,
              costPrice: variant.costPrice
                ? new Prisma.Decimal(variant.costPrice)
                : undefined,
              comparePrice: variant.comparePrice
                ? new Prisma.Decimal(variant.comparePrice)
                : undefined,
              weight: variant.weight
                ? new Prisma.Decimal(variant.weight)
                : undefined,
              length: variant.length
                ? new Prisma.Decimal(variant.length)
                : undefined,
              width: variant.width
                ? new Prisma.Decimal(variant.width)
                : undefined,
              height: variant.height
                ? new Prisma.Decimal(variant.height)
                : undefined,
              attributes: variant.attributes
                ? (variant.attributes as Prisma.InputJsonValue)
                : undefined,
              image: variant.image ?? undefined,
              isActive: variant.isActive ?? true,
            },
          })
        )
      );
    }

    // Create images
    if (data.images && data.images.length > 0) {
      await Promise.all(
        data.images.map((img, index) =>
          tx.productImage.create({
            data: {
              productId: product.id,
              url: img.url,
              alt: img.alt ?? undefined,
              order: img.order ?? index,
              isPrimary: img.isPrimary ?? index === 0,
            },
          })
        )
      );
    } else if (image) {
      // If no images array but primary image exists, create it
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: image,
          order: 0,
          isPrimary: true,
        },
      });
    }

    // Create tag relations
    if (data.tagIds && data.tagIds.length > 0) {
      // Validate tags exist
      const tags = await tx.productTag.findMany({
        where: {
          id: { in: data.tagIds },
          storeId,
        },
      });

      if (tags.length !== data.tagIds.length) {
        throw new ApiError("One or more tags not found", StatusCodes.NOT_FOUND);
      }

      await Promise.all(
        data.tagIds.map((tagId) =>
          tx.productTagRelation.create({
            data: {
              productId: product.id,
              tagId,
            },
          })
        )
      );
    }

    // Create specifications
    if (data.specifications && data.specifications.length > 0) {
      await Promise.all(
        data.specifications.map((spec, index) =>
          tx.productSpecification.create({
            data: {
              productId: product.id,
              key: spec.key,
              value: spec.value,
              order: spec.order ?? index,
            },
          })
        )
      );
    }

    // Log history
    await logProductHistory(
      tx,
      userId,
      product.id,
      "create",
      "Product created",
      ipAddress,
      userAgent,
      product
    );

    // Return product with all relations
    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        brand: true,
        variants: true,
        images: { orderBy: { order: "asc" } },
        tagRelations: { include: { tag: true } },
        specifications: { orderBy: { order: "asc" } },
      },
    });
  });

  return apiResponse("Product created successfully", result);
};

export const getProductService = async (storeId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId, isActive: true },
    include: {
      category: true,
      brand: true,
      variants: { where: { isActive: true } },
      images: { orderBy: { order: "asc" } },
      tagRelations: { include: { tag: true } },
      specifications: { orderBy: { order: "asc" } },
      inventory: true,
    },
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
  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, storeId, isActive: true },
  });

  if (!existingProduct) {
    throw new ApiError("Product not found", StatusCodes.NOT_FOUND);
  }

  // Validate uniqueness for updated fields
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
      throw new ApiError("Product name already exists", StatusCodes.CONFLICT);
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

  if (data.barcode && data.barcode !== existingProduct.barcode) {
    const existingBarcode = await prisma.product.findFirst({
      where: {
        barcode: data.barcode,
        storeId,
        isActive: true,
        NOT: { id: productId },
      },
    });

    if (existingBarcode) {
      throw new ApiError("Barcode already exists", StatusCodes.CONFLICT);
    }
  }

  if (data.slug && data.slug !== existingProduct.slug) {
    const existingSlug = await prisma.product.findFirst({
      where: {
        slug: data.slug,
        storeId,
        isActive: true,
        NOT: { id: productId },
      },
    });

    if (existingSlug) {
      throw new ApiError("Slug already exists", StatusCodes.CONFLICT);
    }
  }

  // Validate category and brand if provided
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, storeId, isActive: true },
    });
    if (!category) {
      throw new ApiError("Category not found", StatusCodes.NOT_FOUND);
    }
  }

  if (data.brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: data.brandId, storeId, isActive: true },
    });
    if (!brand) {
      throw new ApiError("Brand not found", StatusCodes.NOT_FOUND);
    }
  }

  // Handle image upload
  let image = existingProduct.image;
  if (file) {
    const uploadedImage = await uploadToCloudinary("products", file.buffer);
    image = uploadedImage.secure_url;
    if (existingProduct.image) {
      await deleteFromCloudinary(existingProduct.image);
    }
  }

  // Update product with all related data in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const updateData: any = {
      name: data.name ?? existingProduct.name,
      description: data.description ?? existingProduct.description,
      shortDescription:
        data.shortDescription !== undefined
          ? data.shortDescription
          : existingProduct.shortDescription,
      slug: data.slug ?? existingProduct.slug,
      sku: data.sku ?? existingProduct.sku,
      barcode: data.barcode ?? existingProduct.barcode,
      modelNumber: data.modelNumber ?? existingProduct.modelNumber,
      categoryId: data.categoryId ?? existingProduct.categoryId,
      brandId: data.brandId ?? existingProduct.brandId,
      price: data.price
        ? new Prisma.Decimal(data.price)
        : existingProduct.price,
      costPrice:
        data.costPrice !== undefined
          ? data.costPrice
            ? new Prisma.Decimal(data.costPrice)
            : null
          : existingProduct.costPrice,
      comparePrice:
        data.comparePrice !== undefined
          ? data.comparePrice
            ? new Prisma.Decimal(data.comparePrice)
            : null
          : existingProduct.comparePrice,
      weight:
        data.weight !== undefined
          ? data.weight
            ? new Prisma.Decimal(data.weight)
            : null
          : existingProduct.weight,
      length:
        data.length !== undefined
          ? data.length
            ? new Prisma.Decimal(data.length)
            : null
          : existingProduct.length,
      width:
        data.width !== undefined
          ? data.width
            ? new Prisma.Decimal(data.width)
            : null
          : existingProduct.width,
      height:
        data.height !== undefined
          ? data.height
            ? new Prisma.Decimal(data.height)
            : null
          : existingProduct.height,
      condition: data.condition ?? existingProduct.condition,
      warrantyDuration:
        data.warrantyDuration ?? existingProduct.warrantyDuration,
      isFeatured:
        data.isFeatured !== undefined
          ? data.isFeatured
          : existingProduct.isFeatured,
      metaTitle: data.metaTitle ?? existingProduct.metaTitle,
      metaDescription: data.metaDescription ?? existingProduct.metaDescription,
      image: image ?? existingProduct.image,
      videoUrl: data.videoUrl ?? existingProduct.videoUrl,
      shippingClass: data.shippingClass ?? existingProduct.shippingClass,
      taxCategory: data.taxCategory ?? existingProduct.taxCategory,
      isActive:
        data.isActive !== undefined ? data.isActive : existingProduct.isActive,
    };

    const product = await tx.product.update({
      where: { id: productId },
      data: updateData,
    });

    // Update variants if provided
    if (data.variants) {
      // Delete existing variants and create new ones (or update logic can be added)
      await tx.productVariant.deleteMany({
        where: { productId },
      });

      await Promise.all(
        data.variants.map((variant) =>
          tx.productVariant.create({
            data: {
              productId: product.id,
              name: variant.name,
              sku: variant.sku ?? undefined,
              barcode: variant.barcode ?? undefined,
              price: variant.price
                ? new Prisma.Decimal(variant.price)
                : undefined,
              costPrice: variant.costPrice
                ? new Prisma.Decimal(variant.costPrice)
                : undefined,
              comparePrice: variant.comparePrice
                ? new Prisma.Decimal(variant.comparePrice)
                : undefined,
              weight: variant.weight
                ? new Prisma.Decimal(variant.weight)
                : undefined,
              length: variant.length
                ? new Prisma.Decimal(variant.length)
                : undefined,
              width: variant.width
                ? new Prisma.Decimal(variant.width)
                : undefined,
              height: variant.height
                ? new Prisma.Decimal(variant.height)
                : undefined,
              attributes: variant.attributes
                ? (variant.attributes as Prisma.InputJsonValue)
                : undefined,
              image: variant.image ?? undefined,
              isActive: variant.isActive ?? true,
            },
          })
        )
      );
    }

    // Update images if provided
    if (data.images) {
      await tx.productImage.deleteMany({
        where: { productId },
      });

      await Promise.all(
        data.images.map((img, index) =>
          tx.productImage.create({
            data: {
              productId: product.id,
              url: img.url,
              alt: img.alt ?? undefined,
              order: img.order ?? index,
              isPrimary: img.isPrimary ?? index === 0,
            },
          })
        )
      );
    }

    // Update tag relations if provided
    if (data.tagIds) {
      await tx.productTagRelation.deleteMany({
        where: { productId },
      });

      const tags = await tx.productTag.findMany({
        where: {
          id: { in: data.tagIds },
          storeId,
        },
      });

      if (tags.length !== data.tagIds.length) {
        throw new ApiError("One or more tags not found", StatusCodes.NOT_FOUND);
      }

      await Promise.all(
        data.tagIds.map((tagId) =>
          tx.productTagRelation.create({
            data: {
              productId: product.id,
              tagId,
            },
          })
        )
      );
    }

    // Update specifications if provided
    if (data.specifications) {
      await tx.productSpecification.deleteMany({
        where: { productId },
      });

      await Promise.all(
        data.specifications.map((spec, index) =>
          tx.productSpecification.create({
            data: {
              productId: product.id,
              key: spec.key,
              value: spec.value,
              order: spec.order ?? index,
            },
          })
        )
      );
    }

    // Log history
    await logProductHistory(
      tx,
      userId,
      product.id,
      "update",
      "Product updated",
      ipAddress,
      userAgent,
      product
    );

    // Return product with all relations
    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        brand: true,
        variants: true,
        images: { orderBy: { order: "asc" } },
        tagRelations: { include: { tag: true } },
        specifications: { orderBy: { order: "asc" } },
      },
    });
  });

  return apiResponse("Product updated successfully", result);
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

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Also deactivate variants
    await tx.productVariant.updateMany({
      where: { productId },
      data: { isActive: false },
    });

    // Log history
    await logProductHistory(
      tx,
      userId,
      productId,
      "delete",
      reason,
      ipAddress,
      userAgent,
      existingProduct
    );
  });

  return apiResponse("Product deleted successfully", null);
};
