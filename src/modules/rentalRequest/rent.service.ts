import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ICreateRentalRequest, IUpdateRentalStatus } from "./rent.interface";
import { ApiError } from "../../utils/apiError";

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

export const rentalRequestService = {
  createRentalRequest,
};
