import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { adminValidation } from "./admin.validation.js";
import { Role } from "@prisma/client";

const router = Router();
router.use(auth(Role.ADMIN));

router.get("/users", adminController.getAllUsers);
router.patch(
  "/users/:id",
  validateRequest(adminValidation.updateUserStatusSchema),
  adminController.updateUserStatus,
);
router.get("/properties", adminController.getAllProperties);
router.get("/rentals", adminController.getAllRentalRequests);

export const adminRoutes = router;
