import { z } from "zod";

const createSchema = z.object({
  body: z.object({
    propertyId: z.string({ message: "propertyId is required" }).uuid("Invalid propertyId"),
    moveInDate: z.string({ message: "moveInDate is required" }).datetime({ message: "moveInDate must be an ISO date string" }).or(z.string().min(1)),
    message: z.string().max(1000).optional(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
   
    status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]),
  }),
});

export const rentalRequestValidation = { createSchema, updateStatusSchema };
