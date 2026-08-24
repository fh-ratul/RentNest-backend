import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authValidation } from "./auth.validation.js";
import { auth } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", validateRequest(authValidation.registerSchema), authController.registerUser);
router.post("/login", validateRequest(authValidation.loginSchema), authController.loginUser);
router.get("/me", auth(), authController.getMe);
router.post("/refresh-token", authController.refreshToken);
export const authRoutes = router;
