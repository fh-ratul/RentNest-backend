import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ICreateRentalRequest, IUpdateRentalStatus } from "./rent.interface";
import { ApiError } from "../../utils/apiError";
import { assertValidTransition } from "./rent.utils";

const createRentalRequest = async (
  tenantId: string,
  payload: ICreateRentalRequest,
) => {
  const property = await prisma.property.findUnique({
    where: { id: payload.propertyId },
  });

  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }
  if (property.status !== "AVAILABLE") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This property is not currently available",
    );
  }

  const existingActiveRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId: payload.propertyId,
      status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
    },
  });
  if (existingActiveRequest) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You already have an active or pending request for this property",
    );
  }

  return prisma.rentalRequest.create({
    data: {
      tenantId,
      propertyId: payload.propertyId,
      moveInDate: new Date(payload.moveInDate),
      message: payload.message,
    },
    include: { property: true },
  });
};

const getMyRentalRequests = async (tenantId: string) => {
  return prisma.rentalRequest.findMany({
    where: { tenantId },
    include: { property: true, payment: true, review: true },
    orderBy: { createdAt: "desc" },
  });
};

const getRentalRequestById = async (id: string, userId: string, role: string) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id },
    include: { property: true, tenant: { select: { id: true, name: true, email: true } }, payment: true, review: true },
  });

  if (!rental) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  const isOwnerTenant = rental.tenantId === userId;
  const isOwnerLandlord = rental.property.landlordId === userId;

  if (role !== "ADMIN" && !isOwnerTenant && !isOwnerLandlord) {
    throw new ApiError(httpStatus.FORBIDDEN, "You don't have access to this rental request");
  }

  return rental;
};

const getRequestsForLandlord = async (landlordId: string) => {
  return prisma.rentalRequest.findMany({
    where: { property: { landlordId } },
    include: { property: true, tenant: { select: { id: true, name: true, email: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  });
};

const updateRentalStatus = async (id: string, landlordId: string, payload: IUpdateRentalStatus) => {
  const rental = await prisma.rentalRequest.findUnique({ where: { id }, include: { property: true } });

  if (!rental) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }
  if (rental.property.landlordId !== landlordId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You can only manage requests for your own properties");
  }

  assertValidTransition(rental.status, payload.status);

  return prisma.rentalRequest.update({ where: { id }, data: { status: payload.status } });
};
export const rentalRequestService = {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestById,
  getRequestsForLandlord,
  updateRentalStatus
};
