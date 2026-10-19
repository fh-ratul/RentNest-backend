import httpStatus from "http-status";
import { z } from "zod";
import { generateJson } from "../../lib/ai.js";
import { NEARBY_RADIUS_M, nearbyPlaces, route, TNearbyCategory, TPoint } from "../../lib/osm.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { cached } from "../../utils/cache.js";

// A failed lookup is retried when someone views the listing, at most this often.
const RETRY_AFTER_MS = 60 * 60 * 1000;

const SUMMARY_SYSTEM = `You write a short "Living here" note for a home-rental listing in Bangladesh, for someone deciding whether to rent.
Use only the nearby-places data you are given. Never invent places, distances, traffic, safety or prices.
OpenStreetMap data can be incomplete: if a kind of place is missing or has a count of 0, simply don't mention it. Never say there is none nearby.
Don't guess who will live there (families, students, bachelors): describe the area, not the reader.`;

const summarise = async (area: string, categories: TNearbyCategory[]) => {
  const found = categories.filter((c) => c.count > 0);
  if (!found.length) return null;

  const lines = found.map(
    (c) =>
      `- ${c.label}: ${c.count}${c.more ? "+" : ""} within ${NEARBY_RADIUS_M} m` +
      (c.nearest ? `; nearest is ${c.nearest.name}, ${c.nearest.distanceM} m away` : ""),
  );

  try {
    const { data } = await generateJson({
      system: SUMMARY_SYSTEM,
      prompt: `Area: ${area}\nPlaces within ${NEARBY_RADIUS_M} m of the home (from OpenStreetMap):\n${lines.join("\n")}\n\nReturn "summary": 2 or 3 plain-English sentences, at most 60 words, about everyday convenience (schools, healthcare, shopping, prayer, transport, green space), naming a couple of the nearest places with their distances.`,
      schema: z.object({ summary: z.string().min(1) }),
      temperature: 0.3,
    });
    return data.summary.trim();
  } catch {
    // The places list is still useful without the AI note.
    return null;
  }
};

// Looks up what's within walking distance of a listing's pin and stores it.
// Slow (one OpenStreetMap request per kind of place), so it runs in the background.
export const refreshNeighbourhood = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { latitude: true, longitude: true, address: true, city: true },
  });
  if (!property || property.latitude === null || property.longitude === null) return;

  const point = { lat: property.latitude, lng: property.longitude };

  // Marks the attempt, so views don't start a second lookup while this one runs.
  await prisma.property.update({ where: { id: propertyId }, data: { neighbourhoodUpdatedAt: new Date() } });

  const categories = await nearbyPlaces(point);
  const summary = await summarise(`${property.address}, ${property.city}`, categories);

  // Only save if the pin hasn't moved while the lookup was running.
  await prisma.property.updateMany({
    where: { id: propertyId, latitude: point.lat, longitude: point.lng },
    data: {
      neighbourhood: { radiusM: NEARBY_RADIUS_M, source: "OpenStreetMap", categories },
      neighbourhoodSummary: summary,
      neighbourhoodUpdatedAt: new Date(),
    },
  });
};

// True when a listing has a pin but no stored neighbourhood, and nothing has
// been tried recently (e.g. the background lookup failed or was cut short).
export const needsNeighbourhood = (property: {
  latitude: number | null;
  longitude: number | null;
  neighbourhood: unknown;
  neighbourhoodUpdatedAt: Date | null;
}) =>
  property.latitude !== null &&
  property.longitude !== null &&
  !property.neighbourhood &&
  (!property.neighbourhoodUpdatedAt || Date.now() - property.neighbourhoodUpdatedAt.getTime() > RETRY_AFTER_MS);

// Car and walking times from a listing to a place the tenant picked.
export const getCommute = async (propertyId: string, to: TPoint) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { latitude: true, longitude: true },
  });
  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }
  if (property.latitude === null || property.longitude === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This listing has no location on the map yet");
  }

  const from = { lat: property.latitude, lng: property.longitude };
  // ~100 m of rounding, so nearby picks share a cached answer. Each mode is
  // cached on its own, so one that failed is retried next time.
  const leg = (mode: "car" | "foot") =>
    cached(`commute:${mode}:${propertyId}:${to.lat.toFixed(3)},${to.lng.toFixed(3)}`, 60 * 60 * 24 * 7, () =>
      route(from, to, mode),
    );
  const [car, foot] = await Promise.all([leg("car"), leg("foot")]);

  if (!car && !foot) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Travel times are unavailable right now. Please try again shortly.");
  }
  return { car, foot };
};
