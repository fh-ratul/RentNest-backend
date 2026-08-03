import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsers();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.updateUserStatus(
    req.params?.id as string,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User status updated",
    data: result,
  });
});

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllProperties();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties retrieved",
    data: result,
  });
});

const getAllRentalRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllRentalRequests();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental requests retrieved",
    data: result,
  });
});

export const adminController = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentalRequests,
};
