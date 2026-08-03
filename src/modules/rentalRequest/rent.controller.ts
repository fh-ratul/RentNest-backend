import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalRequestService } from "./rent.service";

const createRentalRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await rentalRequestService.createRentalRequest(req.user!.id, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Rental request submitted", data: result });
});

export const rentalRequestController = {
  createRentalRequest,
 
};