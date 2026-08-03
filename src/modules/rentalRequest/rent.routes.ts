import { Router } from "express";
import { rentalRequestController } from "./rent.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { rentalRequestValidation } from "./rent.validation";
import { Role } from "../../../prisma/generated/prisma/enums";

const tenantRouter = Router();
tenantRouter.post(
  "/",
  auth(Role.TENANT),
  validateRequest(rentalRequestValidation.createSchema),
  rentalRequestController.createRentalRequest
);

export const rentalRoutes = tenantRouter;
