import { Router } from "express";
import { propertyController } from "./property.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { propertyValidation } from "./property.validation";

const publicRouter = Router();
publicRouter.get("/", propertyController.getAllProperties);
publicRouter.get("/:id", propertyController.getPropertyById);
export const propertyRoutes = publicRouter;