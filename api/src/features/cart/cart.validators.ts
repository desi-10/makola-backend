import { z } from "zod";

export const CreateCartSchema = z.object({
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().trim().optional().nullable(),
  customerName: z.string().trim().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.cuid(),
      quantity: z.coerce.number().int().positive({ message: "Quantity must be > 0" }),
    })
  ).min(1, { message: "At least one item is required" }),
});

export const UpdateCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.cuid(),
      quantity: z.coerce.number().int().positive({ message: "Quantity must be > 0" }),
    })
  ).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().trim().optional().nullable(),
  customerName: z.string().trim().optional().nullable(),
});

export const CartParamsIdSchema = z.object({
  cartId: z.cuid().min(1, { message: "Invalid cart ID" }),
});

export type CreateCartSchemaType = z.infer<typeof CreateCartSchema>;
export type UpdateCartSchemaType = z.infer<typeof UpdateCartSchema>;
export type CartParamsIdSchemaType = z.infer<typeof CartParamsIdSchema>;

