import { z } from "zod";

export const CreateStoreSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
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
  description: z.string().optional(),
});

export const UpdateStoreSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).optional(),
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
  description: z.string().optional(),
});

export const StoreParamsIdSchema = z.object({
  storeId: z.cuid().min(1, { message: "Invalid store ID" }),
});

export type CreateStoreSchemaType = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreSchemaType = z.infer<typeof UpdateStoreSchema>;
export type StoreParamsIdSchemaType = z.infer<typeof StoreParamsIdSchema>;
