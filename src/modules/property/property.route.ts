import { Router } from "express";
import { propertyController } from "./property.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { propertyValidation } from "./property.validation";
import { Role } from "../../../prisma/generated/prisma/enums";

const publicRouter = Router();
publicRouter.get("/", propertyController.getAllProperties);
publicRouter.get("/:id", propertyController.getPropertyById);
export const propertyRoutes = publicRouter;

const landlordRouter = Router();
landlordRouter.use(auth(Role.LANDLORD));
landlordRouter.get("/", propertyController.getMyProperties);
landlordRouter.post("/", validateRequest(propertyValidation.createSchema), propertyController.createProperty);
landlordRouter.put("/:id", validateRequest(propertyValidation.updateSchema), propertyController.updateProperty);
landlordRouter.delete("/:id", propertyController.deleteProperty);
export const landlordPropertyRoutes = landlordRouter;