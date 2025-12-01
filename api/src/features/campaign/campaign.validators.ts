import { z } from "zod";

export const CreateCampaignSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional(),
  type: z.enum(["PRODUCT_LAUNCH", "SEASONAL_SALE", "BRAND_AWARENESS", "CUSTOMER_RETENTION", "CLEARANCE", "OTHER"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.coerce.number().nonnegative().optional(),
  targetAudience: z.any().optional(),
  channels: z.array(z.enum(["EMAIL", "SMS", "SOCIAL_MEDIA", "PUSH_NOTIFICATION", "IN_STORE", "WEBSITE", "OTHER"])).optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  type: z.enum(["PRODUCT_LAUNCH", "SEASONAL_SALE", "BRAND_AWARENESS", "CUSTOMER_RETENTION", "CLEARANCE", "OTHER"]).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  targetAudience: z.any().optional(),
  channels: z.array(z.enum(["EMAIL", "SMS", "SOCIAL_MEDIA", "PUSH_NOTIFICATION", "IN_STORE", "WEBSITE", "OTHER"])).optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const CampaignParamsIdSchema = z.object({
  campaignId: z.cuid().min(1, { message: "Invalid campaign ID" }),
});

export type CreateCampaignSchemaType = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignSchemaType = z.infer<typeof UpdateCampaignSchema>;
export type CampaignParamsIdSchemaType = z.infer<typeof CampaignParamsIdSchema>;

