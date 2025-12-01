import { z } from "zod";

export const CreateInviteSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
  roleId: z.cuid().optional(),
  expiresInDays: z.coerce.number().int().positive().default(7).optional(),
});

export const InviteParamsIdSchema = z.object({
  inviteId: z.cuid().min(1, { message: "Invalid invite ID" }),
});

export type CreateInviteSchemaType = z.infer<typeof CreateInviteSchema>;
export type InviteParamsIdSchemaType = z.infer<typeof InviteParamsIdSchema>;

