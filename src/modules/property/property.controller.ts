import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { propertyService } from "./property.service.js";
import { getCommute } from "./property.neighbourhood.js";

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const { properties, meta } = await propertyService.getAllProperties(
    req.query as any,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties retrieved",
    data: properties,
    meta,
  });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await propertyService.getPropertyById(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property retrieved",
    data: result,
  });
});

const createProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await propertyService.createProperty(req.user!.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Property created",
    data: result,
  });
});

const getMyProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await propertyService.getMyProperties(req.user!.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your properties retrieved",
    data: result,
  });
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const id = req.params?.id as string;
  const result = await propertyService.updateProperty(
    id,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property updated",
    data: result,
  });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await propertyService.deleteProperty(id, req.user!.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property deleted",
    data: null,
  });
});

const uploadPropertyImage = catchAsync(async (req: Request, res: Response) => {
  const result = await propertyService.uploadPropertyImage(req.file);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Image uploaded",
    data: result,
  });
});

// Car and walking times from a listing to a point the visitor picked.
const getPropertyCommute = catchAsync(async (req: Request, res: Response) => {
  const result = await getCommute(req.params.id as string, {
    lat: Number(req.query.lat),
    lng: Number(req.query.lng),
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Travel times retrieved",
    data: result,
  });
});

export const propertyController = {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  getPropertyCommute,
};
