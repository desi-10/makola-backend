import { z } from "zod";

export const CreateInvoiceSchema = z.object({
  orderId: z.cuid().min(1, { message: "Order ID is required" }),
  customerName: z.string().min(1, { message: "Customer name is required" }).trim(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().trim().optional().nullable(),
  billingAddress: z.any().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
});

export const UpdateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  customerName: z.string().min(1).trim().optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().trim().optional().nullable(),
  billingAddress: z.any().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
});

export const InvoiceParamsIdSchema = z.object({
  invoiceId: z.cuid().min(1, { message: "Invalid invoice ID" }),
});

export type CreateInvoiceSchemaType = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceSchemaType = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceParamsIdSchemaType = z.infer<typeof InvoiceParamsIdSchema>;

