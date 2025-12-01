import { z } from "zod";

export const CreatePaymentSchema = z.object({
  orderId: z.cuid().min(1, { message: "Order ID is required" }),
  amount: z.coerce.number().nonnegative({ message: "Amount must be >= 0" }),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_MONEY", "PAYPAL", "STRIPE", "OTHER"]),
  transactionId: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  metadata: z.any().optional(),
});

export const UpdatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]).optional(),
  transactionId: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  metadata: z.any().optional(),
});

export const PaymentParamsIdSchema = z.object({
  paymentId: z.cuid().min(1, { message: "Invalid payment ID" }),
});

export type CreatePaymentSchemaType = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentSchemaType = z.infer<typeof UpdatePaymentSchema>;
export type PaymentParamsIdSchemaType = z.infer<typeof PaymentParamsIdSchema>;

