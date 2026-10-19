import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middlewares/auth.js";
import { RateLimiter } from "../../middlewares/rateLimiter.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { aiController } from "./ai.controller.js";
import { aiValidation } from "./ai.validation.js";

const router = Router();

// Landlord: draft a listing's title, description, amenities and category from its photos.
router.post(
  "/listing-draft",
  auth(Role.LANDLORD),
  RateLimiter.aiLimiter,
  validateRequest(aiValidation.listingDraftSchema),
  aiController.draftListing,
);

export const aiRoutes = router;
