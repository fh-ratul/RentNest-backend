import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { geocode, geocodeAddress } from "../../lib/osm.js";
import { RateLimiter } from "../../middlewares/rateLimiter.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { ApiError } from "../../utils/apiError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";

const searchSchema = z.object({
  query: z.object({
    q: z.string({ message: "Type a place to search for" }).trim().min(3, "Type at least 3 characters").max(200),
    city: z.string().trim().max(100).optional(),
  }),
});

// Public: find a place in Bangladesh, for the landlord's map pin and a
// tenant's commute destination. One explicit search per click, never autocomplete.
// With `city`, `q` is a street address: it falls back to shorter forms of it,
// and finally the city itself (marked approximate).
const search = catchAsync(async (req: Request, res: Response) => {
  const q = String(req.query.q);
  const city = typeof req.query.city === "string" && req.query.city ? req.query.city : undefined;

  const found = city ? await geocodeAddress(q, city) : await geocode(q);
  if (!found) {
    throw new ApiError(httpStatus.NOT_FOUND, "Couldn't find that place. Try adding the area or city.");
  }

  const { lat, lng, label } = found;
  const approximate = Boolean(city) && "matched" in found && found.matched === city;
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Place found", data: { lat, lng, label, approximate } });
});

const router = Router();
router.get("/search", RateLimiter.mapLimiter, validateRequest(searchSchema), search);

export const geoRoutes = router;
