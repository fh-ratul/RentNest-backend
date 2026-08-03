import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ICreateProperty, IPropertyFilters, IUpdateProperty } from "./property.interface";
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

const createProperty = async (landlordId: string, payload: ICreateProperty) => {
  const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
  if (!category) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid categoryId");
  }

  return prisma.property.create({
    data: { ...payload, landlordId },
    include: { category: true },
  });
};

const getMyProperties = async (landlordId: string) => {
  return prisma.property.findMany({
    where: { landlordId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
};

const updateProperty = async (id: string, landlordId: string, payload: IUpdateProperty) => {
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }
  if (property.landlordId !== landlordId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You can only update your own properties");
  }

  return prisma.property.update({ where: { id }, data: payload });
};

const deleteProperty = async (id: string, landlordId: string) => {
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }
  if (property.landlordId !== landlordId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You can only delete your own properties");
  }

  await prisma.property.delete({ where: { id } });
  return null;
};

export const propertyService = {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
};