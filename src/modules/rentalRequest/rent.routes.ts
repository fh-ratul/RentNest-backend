import { Router } from "express";
import { rentalRequestController } from "./rent.controller.js";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { rentalRequestValidation } from "./rent.validation.js";
import { Role } from "@prisma/client";

const tenantRouter = Router();
tenantRouter.post(
  "/",
  auth(Role.TENANT),
  validateRequest(rentalRequestValidation.createSchema),
  rentalRequestController.createRentalRequest
);

tenantRouter.get("/", auth(Role.TENANT), rentalRequestController.getMyRentalRequests);
tenantRouter.get("/:id", auth(), rentalRequestController.getRentalRequestById);

export const rentalRoutes = tenantRouter;


const landlordRouter = Router();
landlordRouter.use(auth(Role.LANDLORD));
landlordRouter.get("/", rentalRequestController.getRequestsForLandlord);
landlordRouter.patch(
  "/:id",
  validateRequest(rentalRequestValidation.updateStatusSchema),
  rentalRequestController.updateRentalStatus
);
export const landlordRentalRoutes = landlordRouter;