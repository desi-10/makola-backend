import { z } from "zod";

export const CreateRoleSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().trim().optional(),
  permissionIds: z.array(z.cuid()).optional(),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  permissionIds: z.array(z.cuid()).optional(),
  isActive: z.coerce.boolean().default(true).optional(),
});

export const RoleParamsIdSchema = z.object({
  roleId: z.cuid().min(1, { message: "Invalid role ID" }),
});

export const AssignPermissionSchema = z.object({
  permissionId: z.cuid().min(1, { message: "Permission ID is required" }),
});

export type CreateRoleSchemaType = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleSchemaType = z.infer<typeof UpdateRoleSchema>;
export type RoleParamsIdSchemaType = z.infer<typeof RoleParamsIdSchema>;
export type AssignPermissionSchemaType = z.infer<typeof AssignPermissionSchema>;

