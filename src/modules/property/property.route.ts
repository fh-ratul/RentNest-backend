import { Router } from "express";
import { propertyController } from "./property.controller.js";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { propertyValidation } from "./property.validation.js";
import { Role } from "@prisma/client";
import { upload } from "../../lib/multer.js";

const publicRouter = Router();
publicRouter.get("/", propertyController.getAllProperties);
publicRouter.get("/:id", propertyController.getPropertyById);
export const propertyRoutes = publicRouter;

const landlordRouter = Router();
landlordRouter.use(auth(Role.LANDLORD));
landlordRouter.get("/", propertyController.getMyProperties);
// One photo per request, sent as multipart form data in the "image" field.
landlordRouter.post("/images", upload.single("image"), propertyController.uploadPropertyImage);
landlordRouter.post("/", validateRequest(propertyValidation.createSchema), propertyController.createProperty);
landlordRouter.put("/:id", validateRequest(propertyValidation.updateSchema), propertyController.updateProperty);
landlordRouter.delete("/:id", propertyController.deleteProperty);
export const landlordPropertyRoutes = landlordRouter;