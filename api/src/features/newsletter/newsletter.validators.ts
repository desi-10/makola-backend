import { z } from "zod";

export const CreateNewsletterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  subject: z.string().min(1, { message: "Subject is required" }).trim(),
  content: z.string().min(1, { message: "Content is required" }),
  scheduledAt: z.coerce.date().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateNewsletterSchema = z.object({
  name: z.string().min(1).trim().optional(),
  subject: z.string().min(1).trim().optional(),
  content: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"]).optional(),
  scheduledAt: z.coerce.date().optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const NewsletterParamsIdSchema = z.object({
  newsletterId: z.cuid().min(1, { message: "Invalid newsletter ID" }),
});

export const SubscribeNewsletterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
  name: z.string().trim().optional(),
});

export type CreateNewsletterSchemaType = z.infer<typeof CreateNewsletterSchema>;
export type UpdateNewsletterSchemaType = z.infer<typeof UpdateNewsletterSchema>;
export type NewsletterParamsIdSchemaType = z.infer<typeof NewsletterParamsIdSchema>;
export type SubscribeNewsletterSchemaType = z.infer<typeof SubscribeNewsletterSchema>;

