import { Router } from "express";
import { adminController } from "./admin.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminValidation } from "./admin.validation";
import { Role } from "../../../prisma/generated/prisma/enums";

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
