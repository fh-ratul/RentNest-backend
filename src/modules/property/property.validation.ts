import { z } from "zod";

// Roughly Bangladesh's bounding box, so a slip of the map can't save a pin abroad.
const OUTSIDE_BD = "The map pin must be in Bangladesh";
const latitude = z.number().min(20.3, OUTSIDE_BD).max(26.8, OUTSIDE_BD).nullable().optional();
const longitude = z.number().min(88.0, OUTSIDE_BD).max(92.8, OUTSIDE_BD).nullable().optional();
const bothOrNeither = (body: { latitude?: number | null; longitude?: number | null }) =>
  (body.latitude == null) === (body.longitude == null);

const createSchema = z.object({
  body: z.object({
    title: z.string({ message: "Title is required" }).min(3).max(255),
    description: z.string({ message: "Description is required" }).min(10),
    address: z.string({ message: "Address is required" }),
    city: z.string({ message: "City is required" }),
    price: z.number({ message: "Price is required" }).positive("Price must be greater than 0"),
    bedrooms: z.number({ message: "Bedrooms is required" }).int().nonnegative(),
    bathrooms: z.number({ message: "Bathrooms is required" }).int().nonnegative(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url("Each image must be a valid URL")).optional(),
    areaSqft: z.number().int().positive().optional(),
    furnishing: z.enum(["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]).optional(),
    availableFrom: z.string().datetime().optional(),
    categoryId: z.string({ message: "categoryId is required" }).uuid("Invalid categoryId"),
    latitude,
    longitude,
  }).refine(bothOrNeither, { message: "Send both latitude and longitude, or neither" }),
});

const updateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().min(10).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    price: z.number().positive().optional(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    areaSqft: z.number().int().positive().optional(),
    furnishing: z.enum(["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]).optional(),
    availableFrom: z.string().datetime().optional(),
    categoryId: z.string().uuid().optional(),
    latitude,
    longitude,
  }).refine(bothOrNeither, { message: "Send both latitude and longitude, or neither" }),
});

const commuteSchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(20.3, OUTSIDE_BD).max(26.8, OUTSIDE_BD),
    lng: z.coerce.number().min(88.0, OUTSIDE_BD).max(92.8, OUTSIDE_BD),
  }),
});

export const propertyValidation = { createSchema, updateSchema, commuteSchema };
