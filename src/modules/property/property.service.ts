import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { IPropertyFilters } from "./property.interface";
import { ApiError } from "../../utils/apiError";

const getAllProperties = async (filters: IPropertyFilters) => {
  const { city, categoryId, minPrice, maxPrice, bedrooms, search, page = 1, limit = 10 } = filters;

  const where = {
    status: "AVAILABLE" as const,
    ...(city && { city: { equals: city, mode: "insensitive" as const } }),
    ...(categoryId && { categoryId }),
    ...(bedrooms && { bedrooms: Number(bedrooms) }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      },
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: Number(limit),
      include: { category: true, landlord: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, meta: { page: Number(page), limit: Number(limit), total } };
};

const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      category: true,
      landlord: { select: { id: true, name: true, email: true } },
      reviews: { include: { tenant: { select: { id: true, name: true } } } },
    },
  });

  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }

  return property;
};

export const propertyService = {
  getAllProperties,
  getPropertyById,
  
};