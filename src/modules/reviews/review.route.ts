import { Router } from "express";
import { reviewController } from "./review.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { reviewValidation } from "./review.validation";
import { Role } from "../../../prisma/generated/prisma/enums";

const router = Router();
router.post("/", auth(Role.TENANT), validateRequest(reviewValidation.createSchema), reviewController.createReview);

export const reviewRoutes = router;
