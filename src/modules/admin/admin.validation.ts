import { z } from "zod";

const updateUserStatusSchema = z.object({
  body: z.object({
    activeStatus: z.enum(["ACTIVE", "BLOCKED"]),
  }),
});

export const adminValidation = { updateUserStatusSchema };
