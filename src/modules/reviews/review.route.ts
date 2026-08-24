import { Router } from "express";
import { reviewController } from "./review.controller.js";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { reviewValidation } from "./review.validation.js";
import { Role } from "@prisma/client";

const router = Router();
router.post("/", auth(Role.TENANT), validateRequest(reviewValidation.createSchema), reviewController.createReview);

export const reviewRoutes = router;
