import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { aiService } from "./ai.service.js";

const draftListing = catchAsync(async (req: Request, res: Response) => {
  const result = await aiService.draftListing(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Listing draft ready",
    data: result,
  });
});

export const aiController = { draftListing };
