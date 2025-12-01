import { z } from "zod";

export const CreateFlashSaleSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.coerce.number().nonnegative({ message: "Discount value must be >= 0" }),
  productIds: z.array(z.cuid()).min(1, { message: "At least one product is required" }),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  maxQuantity: z.coerce.number().int().positive().optional(),
  totalQuantity: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateFlashSaleSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  discountValue: z.coerce.number().nonnegative().optional(),
  productIds: z.array(z.cuid()).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  status: z.enum(["SCHEDULED", "ACTIVE", "ENDED", "CANCELLED"]).optional(),
  maxQuantity: z.coerce.number().int().positive().optional(),
  totalQuantity: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const FlashSaleParamsIdSchema = z.object({
  flashSaleId: z.cuid().min(1, { message: "Invalid flash sale ID" }),
});

export type CreateFlashSaleSchemaType = z.infer<typeof CreateFlashSaleSchema>;
export type UpdateFlashSaleSchemaType = z.infer<typeof UpdateFlashSaleSchema>;
export type FlashSaleParamsIdSchemaType = z.infer<typeof FlashSaleParamsIdSchema>;

