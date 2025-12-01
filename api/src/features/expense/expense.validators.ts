import { z } from "zod";

export const CreateExpenseSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).trim(),
  description: z.string().trim().optional(),
  category: z.enum(["RENT", "UTILITIES", "SALARIES", "MARKETING", "INVENTORY", "EQUIPMENT", "MAINTENANCE", "TRANSPORTATION", "INSURANCE", "TAXES", "OTHER"]),
  amount: z.coerce.number().nonnegative({ message: "Amount must be >= 0" }),
  date: z.coerce.date(),
  receiptUrl: z.string().url().optional(),
  paidBy: z.cuid().optional(),
  approvedBy: z.cuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).default("PENDING").optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateExpenseSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  category: z.enum(["RENT", "UTILITIES", "SALARIES", "MARKETING", "INVENTORY", "EQUIPMENT", "MAINTENANCE", "TRANSPORTATION", "INSURANCE", "TAXES", "OTHER"]).optional(),
  amount: z.coerce.number().nonnegative().optional(),
  date: z.coerce.date().optional(),
  receiptUrl: z.string().url().optional(),
  paidBy: z.cuid().optional(),
  approvedBy: z.cuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const ExpenseParamsIdSchema = z.object({
  expenseId: z.cuid().min(1, { message: "Invalid expense ID" }),
});

export type CreateExpenseSchemaType = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseSchemaType = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseParamsIdSchemaType = z.infer<typeof ExpenseParamsIdSchema>;

