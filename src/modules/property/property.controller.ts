import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { propertyService } from "./property.service";

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const { properties, meta } = await propertyService.getAllProperties(req.query as any);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Properties retrieved", data: properties, meta });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {

    const id= req.params?.id 
  const result = await propertyService.getPropertyById(id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Property retrieved", data: result });
});

export const propertyController = {
  getAllProperties,
  getPropertyById,
};