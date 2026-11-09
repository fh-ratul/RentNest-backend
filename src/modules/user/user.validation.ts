import { z } from "zod";

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255).optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string({ message: "Old password is required" }),
    newPassword: z
      .string({ message: "New password is required" })
      .min(6, "Password must be at least 6 characters"),
  }),
});

export const userValidation = { updateProfileSchema, changePasswordSchema };
