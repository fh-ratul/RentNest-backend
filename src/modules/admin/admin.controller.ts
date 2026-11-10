import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { isDemoAdmin } from "../../utils/demo.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { adminService } from "./admin.service.js";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsers(isDemoAdmin(req.user!));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const demo = isDemoAdmin(req.user!);
  const result = await adminService.updateUserStatus(
    req.params?.id as string,
    req.body,
    demo,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: demo
      ? "User status updated in the demo sandbox (resets within an hour)"
      : "User status updated",
    data: result,
  });
});

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllProperties(isDemoAdmin(req.user!));
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties retrieved",
    data: result,
  });
});

const getAllRentalRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllRentalRequests(
    isDemoAdmin(req.user!),
  );
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
