import { z } from "zod";

export const CreateMemberSchema = z.object({
  userId: z.cuid().min(1, { message: "User ID is required" }),
  roleId: z.cuid().min(1, { message: "Role ID is required" }),
});

export const UpdateMemberSchema = z.object({
  roleId: z.cuid().min(1, { message: "Role ID is required" }).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const MemberParamsIdSchema = z.object({
  memberId: z.cuid().min(1, { message: "Invalid member ID" }),
});

export type CreateMemberSchemaType = z.infer<typeof CreateMemberSchema>;
export type UpdateMemberSchemaType = z.infer<typeof UpdateMemberSchema>;
export type MemberParamsIdSchemaType = z.infer<typeof MemberParamsIdSchema>;

