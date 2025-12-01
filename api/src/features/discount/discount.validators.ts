import { z } from "zod";

export const CreateDiscountSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().nonnegative({ message: "Value must be >= 0" }),
  minPurchase: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().nonnegative().optional(),
  applicableTo: z
    .enum(["ALL", "SPECIFIC_PRODUCTS", "SPECIFIC_CATEGORIES"])
    .default("ALL"),
  productIds: z.array(z.cuid()).optional(),
  categoryIds: z.array(z.cuid()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateDiscountSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  value: z.coerce.number().nonnegative().optional(),
  minPurchase: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().nonnegative().optional(),
  applicableTo: z
    .enum(["ALL", "SPECIFIC_PRODUCTS", "SPECIFIC_CATEGORIES"])
    .optional(),
  productIds: z.array(z.cuid()).optional(),
  categoryIds: z.array(z.cuid()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const DiscountParamsIdSchema = z.object({
  discountId: z.cuid().min(1, { message: "Invalid discount ID" }),
});

export type CreateDiscountSchemaType = z.infer<typeof CreateDiscountSchema>;
export type UpdateDiscountSchemaType = z.infer<typeof UpdateDiscountSchema>;
export type DiscountParamsIdSchemaType = z.infer<typeof DiscountParamsIdSchema>;
