import { z } from "zod";

export const CreateCouponSchema = z.object({
  code: z.string().min(1, { message: "Code is required" }).trim().toUpperCase(),
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().nonnegative({ message: "Value must be >= 0" }),
  minPurchase: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().nonnegative().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  applicableTo: z.enum(["ALL", "SPECIFIC_PRODUCTS", "SPECIFIC_CATEGORIES"]).default("ALL"),
  productIds: z.array(z.cuid()).optional(),
  categoryIds: z.array(z.cuid()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateCouponSchema = z.object({
  code: z.string().min(1).trim().toUpperCase().optional(),
  name: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  value: z.coerce.number().nonnegative().optional(),
  minPurchase: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().nonnegative().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  applicableTo: z.enum(["ALL", "SPECIFIC_PRODUCTS", "SPECIFIC_CATEGORIES"]).optional(),
  productIds: z.array(z.cuid()).optional(),
  categoryIds: z.array(z.cuid()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const CouponParamsIdSchema = z.object({
  couponId: z.cuid().min(1, { message: "Invalid coupon ID" }),
});

export type CreateCouponSchemaType = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponSchemaType = z.infer<typeof UpdateCouponSchema>;
export type CouponParamsIdSchemaType = z.infer<typeof CouponParamsIdSchema>;

