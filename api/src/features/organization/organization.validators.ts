import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const OrganizationParmasIdSchema = z.object({
  organizationId: z.string().min(1, { message: "Organization ID is required" }),
});

export type CreateOrganizationSchemaType = z.infer<
  typeof CreateOrganizationSchema
>;

export type UpdateOrganizationSchemaType = z.infer<
  typeof UpdateOrganizationSchema
>;

export type OrganizationParmasIdSchemaType = z.infer<
  typeof OrganizationParmasIdSchema
>;
