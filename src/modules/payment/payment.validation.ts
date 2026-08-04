import { z } from "zod";

const createSchema = z.object({
  body: z.object({
    rentalRequestId: z.string({ message: "rentalRequestId is required" }).uuid("Invalid rentalRequestId"),
  }),
});

const confirmSchema = z.object({
  body: z.object({
    sessionId: z.string({ message: "sessionId is required" }),
  }),
});

export const paymentValidation = { createSchema, confirmSchema };
