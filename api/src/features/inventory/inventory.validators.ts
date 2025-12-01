import { z } from "zod";

export const CreateInventorySchema = z.object({
  productId: z.cuid().min(1, { message: "Product ID is required" }),
  quantity: z.coerce
    .number()
    .int()
    .nonnegative({ message: "Quantity must be >= 0" }),
  reserved: z.coerce
    .number()
    .int()
    .nonnegative({ message: "Reserved must be >= 0" })
    .optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateInventorySchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .nonnegative({ message: "Quantity must be >= 0" })
    .optional(),
  reserved: z.coerce
    .number()
    .int()
    .nonnegative({ message: "Reserved must be >= 0" })
    .optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const AdjustInventorySchema = z.object({
  quantity: z.coerce.number().int(),
  reason: z.string().trim().optional(),
});

export const InventoryParamsIdSchema = z.object({
  inventoryId: z.cuid().min(1, { message: "Invalid inventory ID" }),
});

export type CreateInventorySchemaType = z.infer<typeof CreateInventorySchema>;
export type UpdateInventorySchemaType = z.infer<typeof UpdateInventorySchema>;
export type AdjustInventorySchemaType = z.infer<typeof AdjustInventorySchema>;
export type InventoryParamsIdSchemaType = z.infer<
  typeof InventoryParamsIdSchema
>;
