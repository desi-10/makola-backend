import { z } from "zod";

// Variant schema
const VariantSchema = z.object({
  name: z.string().min(1, { message: "Variant name is required" }),
  sku: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
  costPrice: z.coerce.number().nonnegative().optional().nullable(),
  comparePrice: z.coerce.number().nonnegative().optional().nullable(),
  weight: z.coerce.number().nonnegative().optional().nullable(),
  length: z.coerce.number().nonnegative().optional().nullable(),
  width: z.coerce.number().nonnegative().optional().nullable(),
  height: z.coerce.number().nonnegative().optional().nullable(),
  attributes: z.record(z.string(), z.string()).optional().nullable(),
  image: z.string().url().optional().nullable(),
  isActive: z.coerce.boolean().default(true).optional(),
});

// Product Image schema
const ProductImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().optional().nullable(),
  order: z.coerce.number().int().nonnegative().default(0).optional(),
  isPrimary: z.coerce.boolean().default(false).optional(),
});

// Product Specification schema
const ProductSpecificationSchema = z.object({
  key: z.string().min(1, { message: "Specification key is required" }),
  value: z.string().min(1, { message: "Specification value is required" }),
  order: z.coerce.number().int().nonnegative().default(0).optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional().nullable(),
  shortDescription: z.string().trim().optional().nullable(),
  slug: z.string().trim().optional().nullable(),
  sku: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  modelNumber: z.string().trim().optional().nullable(),
  categoryId: z.cuid().optional().nullable(),
  brandId: z.cuid().optional().nullable(),
  // Pricing
  price: z.coerce
    .number()
    .nonnegative({ message: "Price must be greater or equal to 0" }),
  costPrice: z.coerce.number().nonnegative().optional().nullable(),
  comparePrice: z.coerce.number().nonnegative().optional().nullable(),
  // Physical attributes
  weight: z.coerce.number().nonnegative().optional().nullable(),
  length: z.coerce.number().nonnegative().optional().nullable(),
  width: z.coerce.number().nonnegative().optional().nullable(),
  height: z.coerce.number().nonnegative().optional().nullable(),
  // Product status
  condition: z.string().trim().optional().nullable(),
  warrantyDuration: z.string().trim().optional().nullable(),
  isFeatured: z.coerce.boolean().default(false).optional(),
  // SEO
  metaTitle: z.string().trim().optional().nullable(),
  metaDescription: z.string().trim().optional().nullable(),
  // Media
  image: z
    .any()
    .transform((val) => {
      if (val instanceof File) return val;
      if (val === "" || val === "null" || val === undefined) return null;
      return null;
    })
    .nullable()
    .optional(),
  videoUrl: z.string().url().optional().nullable(),
  // Shipping
  shippingClass: z.string().trim().optional().nullable(),
  taxCategory: z.string().trim().optional().nullable(),
  // Related data
  variants: z.array(VariantSchema).optional(),
  images: z.array(ProductImageSchema).optional(),
  tagIds: z.array(z.cuid()).optional(),
  specifications: z.array(ProductSpecificationSchema).optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim().optional(),
  description: z.string().trim().optional().nullable(),
  shortDescription: z.string().trim().optional().nullable(),
  slug: z.string().trim().optional().nullable(),
  sku: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  modelNumber: z.string().trim().optional().nullable(),
  categoryId: z.cuid().optional().nullable(),
  brandId: z.cuid().optional().nullable(),
  // Pricing
  price: z.coerce
    .number()
    .nonnegative({ message: "Price must be greater or equal to 0" })
    .optional(),
  costPrice: z.coerce.number().nonnegative().optional().nullable(),
  comparePrice: z.coerce.number().nonnegative().optional().nullable(),
  // Physical attributes
  weight: z.coerce.number().nonnegative().optional().nullable(),
  length: z.coerce.number().nonnegative().optional().nullable(),
  width: z.coerce.number().nonnegative().optional().nullable(),
  height: z.coerce.number().nonnegative().optional().nullable(),
  // Product status
  condition: z.string().trim().optional().nullable(),
  warrantyDuration: z.string().trim().optional().nullable(),
  isFeatured: z.coerce.boolean().optional(),
  // SEO
  metaTitle: z.string().trim().optional().nullable(),
  metaDescription: z.string().trim().optional().nullable(),
  // Media
  image: z
    .any()
    .transform((val) => {
      if (val instanceof File) return val;
      if (val === "" || val === "null" || val === undefined) return null;
      return null;
    })
    .nullable()
    .optional(),
  videoUrl: z.string().url().optional().nullable(),
  // Shipping
  shippingClass: z.string().trim().optional().nullable(),
  taxCategory: z.string().trim().optional().nullable(),
  // Related data
  variants: z.array(VariantSchema).optional(),
  images: z.array(ProductImageSchema).optional(),
  tagIds: z.array(z.cuid()).optional(),
  specifications: z.array(ProductSpecificationSchema).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const ProductParamsIdSchema = z.object({
  productId: z.cuid().min(1, { message: "Invalid product ID" }),
});

export type CreateProductSchemaType = z.infer<typeof CreateProductSchema>;
export type UpdateProductSchemaType = z.infer<typeof UpdateProductSchema>;
export type ProductParamsIdSchemaType = z.infer<typeof ProductParamsIdSchema>;
