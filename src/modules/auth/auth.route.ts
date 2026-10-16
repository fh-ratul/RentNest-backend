import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authValidation } from "./auth.validation.js";
import { auth } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", validateRequest(authValidation.registerSchema), authController.registerUser);
router.post("/verify-email", validateRequest(authValidation.verifyEmailSchema), authController.verifyEmail);
router.post("/resend-otp", validateRequest(authValidation.resendOtpSchema), authController.resendOtp);
router.post("/login", validateRequest(authValidation.loginSchema), authController.loginUser);
router.post("/google", validateRequest(authValidation.googleLoginSchema), authController.googleLogin);
router.get("/me", auth(), authController.getMe);
router.post("/refresh-token", authController.refreshToken);
export const authRoutes = router;
