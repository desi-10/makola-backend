import { z } from "zod";

export const CreateOrderSchema = z.object({
  customerName: z
    .string()
    .min(1, { message: "Customer name is required" })
    .trim(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().trim().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.cuid(),
        quantity: z.coerce
          .number()
          .int()
          .positive({ message: "Quantity must be > 0" }),
        // unitPrice and discount are calculated server-side for security
        // Client should only send productId and quantity
      })
    )
    .min(1, { message: "At least one item is required" }),
  couponId: z.cuid().optional().nullable(),
  // flashSaleId is auto-detected server-side based on active flashsales
  // No need to send it from client
  taxAmount: z.coerce.number().nonnegative().default(0).optional(),
  shippingAmount: z.coerce.number().nonnegative().default(0).optional(),
  notes: z.string().trim().optional(),
  shippingAddress: z.any().optional(),
});

export const UpdateOrderSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ])
    .optional(),
  customerName: z.string().min(1).trim().optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional(),
  shippingAddress: z.any().optional(),
});

export const OrderParamsIdSchema = z.object({
  orderId: z.cuid().min(1, { message: "Invalid order ID" }),
});

export type CreateOrderSchemaType = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderSchemaType = z.infer<typeof UpdateOrderSchema>;
export type OrderParamsIdSchemaType = z.infer<typeof OrderParamsIdSchema>;
