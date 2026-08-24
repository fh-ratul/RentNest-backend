import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { userValidation } from "./user.validation.js";
import { userController } from "./user.controller.js";

const router= Router()
router.patch("/updateMe", auth(), validateRequest(userValidation.updateProfileSchema), userController.updateProfile);
router.patch(
  "/change-password",
  auth(),
  validateRequest(userValidation.changePasswordSchema),
  userController.changePassword
);
export const userRoutes = router;

