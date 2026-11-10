import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { isDemoAdmin } from "../../utils/demo.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { userService } from "./user.service.js";

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const demo = isDemoAdmin(req.user!);
  const result = await userService.updateProfile(req.user!.id, req.body, demo);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: demo
      ? "Profile updated (demo account: not saved)"
      : "Profile updated",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const demo = isDemoAdmin(req.user!);
  await userService.changePassword(req.user!.id, req.body, demo);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: demo
      ? "Password changed (demo account: not saved)"
      : "Password changed successfully",
    data: null,
  });
});
export const userController = {
  updateProfile,
  changePassword,
};
