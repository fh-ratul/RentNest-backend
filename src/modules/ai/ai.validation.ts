import { z } from "zod";

// The facts the landlord has typed so far; the photos are the main input.
const listingDraftSchema = z.object({
  body: z.object({
    imageUrls: z
      .array(z.string().url("Each photo must be a valid URL"), { message: "Photos are required" })
      .min(1, "Add at least one photo first")
      .max(10, "Up to 10 photos"),
    city: z.string().max(100).optional(),
    address: z.string().max(200).optional(),
    price: z.number().positive().optional(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const aiValidation = { listingDraftSchema };
