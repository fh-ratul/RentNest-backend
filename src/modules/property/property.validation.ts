import { z } from "zod";

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
  }),
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
  }),
});

export const propertyValidation = { createSchema, updateSchema };
