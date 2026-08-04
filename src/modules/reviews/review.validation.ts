import { z } from "zod";

const createSchema = z.object({
  body: z.object({
    rentalRequestId: z.string({ message: "rentalRequestId is required" }).uuid("Invalid rentalRequestId"),
    rating: z
      .number({ message: "rating is required" })
      .int("rating must be an integer")
      .min(1, "rating must be between 1 and 5")
      .max(5, "rating must be between 1 and 5"),
    comment: z.string().max(1000).optional(),
  }),
});

export const reviewValidation = { createSchema };
