import { z } from "zod";

export const CreateProductSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional(),
  price: z.coerce.number().nonnegative({ message: "Price must be >= 0" }),
  sku: z.string().trim().optional(),
  categoryId: z.string().cuid().optional().nullable(),
  image: z
    .any()
    .transform((val) => {
      if (val instanceof File) return val;
      if (val === "" || val === "null" || val === undefined) return null;
      return null;
    })
    .nullable()
    .optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim().optional(),
  description: z.string().trim().optional(),
  price: z.coerce
    .number()
    .nonnegative({ message: "Price must be >= 0" })
    .optional(),
  sku: z.string().trim().optional(),
  categoryId: z.string().cuid().optional().nullable(),
  image: z
    .any()
    .transform((val) => {
      if (val instanceof File) return val;
      if (val === "" || val === "null" || val === undefined) return null;
      return null;
    })
    .nullable()
    .optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const ProductParamsIdSchema = z.object({
  productId: z.cuid().min(1, { message: "Invalid product ID" }),
});

export type CreateProductSchemaType = z.infer<typeof CreateProductSchema>;
export type UpdateProductSchemaType = z.infer<typeof UpdateProductSchema>;
export type ProductParamsIdSchemaType = z.infer<typeof ProductParamsIdSchema>;
