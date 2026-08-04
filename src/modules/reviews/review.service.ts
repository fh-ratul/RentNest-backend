import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ICreateReview } from "./review.interface";
import { ApiError } from "../../utils/apiError";

const createReview = async (tenantId: string, payload: ICreateReview) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: payload.rentalRequestId },
    include: { review: true },
  });

  if (!rental) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }
  if (rental.tenantId !== tenantId) {
    throw new ApiError(httpStatus.FORBIDDEN, "This is not your rental request");
  }
  if (rental.status !== "COMPLETED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You can only review a completed rental",
    );
  }
  if (rental.review) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already reviewed this rental",
    );
  }

  return prisma.review.create({
    data: {
      rentalRequestId: rental.id,
      tenantId,
      propertyId: rental.propertyId,
      rating: payload.rating,
      comment: payload.comment,
    },
  });
};

export const reviewService = { createReview };
