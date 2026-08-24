import httpStatus from "http-status";
import { RentalStatus } from "./rent.interface.js";
import { ApiError } from "../../utils/apiError.js";

const VALID_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["ACTIVE"], 
  REJECTED: [],
  ACTIVE: ["COMPLETED"],
  COMPLETED: [],
};

export const assertValidTransition = (current: RentalStatus, next: RentalStatus) => {
  if (!VALID_TRANSITIONS[current].includes(next)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot transition rental request from ${current} to ${next}`);
  }
};