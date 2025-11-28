import { z } from "zod";

export const UpdateUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  image: z.string().optional(),
  bio: z
    .string()
    .max(160, { message: "Bio must be less than 160 characters" })
    .optional(),
});

export const UpdatePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;
