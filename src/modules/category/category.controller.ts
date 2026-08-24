import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { categoryService } from "./category.service.js";

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getAllCategories();
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Categories retrieved", data: result });
});

export const categoryController = { getAllCategories };
