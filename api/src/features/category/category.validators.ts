import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional(),
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

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim().optional(),
  description: z.string().trim().optional(),
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

export const CategoryParamsIdSchema = z.object({
  categoryId: z.cuid().min(1, { message: "Invalid category ID" }),
});

export type CreateCategorySchemaType = z.infer<typeof CreateCategorySchema>;
export type UpdateCategorySchemaType = z.infer<typeof UpdateCategorySchema>;
export type CategoryParamsIdSchemaType = z.infer<typeof CategoryParamsIdSchema>;


