import httpStatus from "http-status";
import config from "../config/index.js";
import { ApiError } from "../utils/apiError.js";
import { cached } from "../utils/cache.js";

// Free OpenStreetMap services. Their policies ask for an identifying
// User-Agent, at most one Nominatim request per second, no autocomplete, and
// caching, so lookups here run only on explicit actions and are stored.
const USER_AGENT = `RentNest/1.0 (+${config.app_url || "https://rent-nest-frontend-virid-six.vercel.app"})`;
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const ROUTER = "https://routing.openstreetmap.de";
const TIMEOUT_MS = 12_000;

export type TPoint = { lat: number; lng: number };

// One Nominatim request at a time per server, spaced 1.1s apart.
let nominatimQueue: Promise<unknown> = Promise.resolve();
const NOMINATIM_GAP_MS = 1100;

type TNominatimPlace = {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  category: string;
  type: string;
  place_rank: number;
};

// Nominatim's place_rank: 8 is a division, 12 a district, 16 a city.
const DISTRICT_RANK = 12;

const nominatim = (params: Record<string, string>): Promise<TNominatimPlace[]> => {
  const request = nominatimQueue.then(async () => {
    // English names where OSM has them, since the rest of the site is in English.
    const url = `${NOMINATIM}?${new URLSearchParams({ format: "jsonv2", countrycodes: "bd", "accept-language": "en", ...params })}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`Nominatim ${res.status}`);
      return (await res.json()) as TNominatimPlace[];
    } catch (error) {
      // Rate-limited, down or slow: the caller can only ask to try again later.
      console.warn(`Nominatim failed: ${error instanceof Error ? error.message : error}`);
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Map search is busy right now. Please try again in a minute.");
    } finally {
      await new Promise((resolve) => setTimeout(resolve, NOMINATIM_GAP_MS));
    }
  });
  nominatimQueue = request.catch(() => undefined);
  return request;
};

// ── Geocoding ────────────────────────────────────────────────────────────

export type TGeocodeResult = TPoint & { label: string };

const lookup = (
  query: string,
  cacheKey: string,
  limit = 1,
  pick: (places: TNominatimPlace[]) => TNominatimPlace | undefined = (places) => places[0],
) => {
  const q = query.trim().replace(/\s+/g, " ");
  return cached<TGeocodeResult>(`${cacheKey}:${q.toLowerCase()}`, 60 * 60 * 24 * 30, async () => {
    const place = pick(await nominatim({ q, limit: String(limit) }));
    if (!place) return null;
    return { lat: Number(place.lat), lng: Number(place.lon), label: place.display_name.split(",").slice(0, 3).join(",").trim() };
  });
};

export const geocode = (query: string) => lookup(query, "geo:search:en");

// The town itself, not the division that shares its name ("Rajshahi" is
// both, and the division comes first): a division's centre can be 50 km away.
const geocodeCity = (city: string) =>
  lookup(city, "geo:city:en", 5, (places) =>
    places.find((p) => p.category === "place") ?? places.find((p) => p.place_rank >= DISTRICT_RANK),
  );

// Further than this from the city centre, a match is a same-named place elsewhere.
const MAX_FROM_CITY_M = 30_000;

// House numbers rarely resolve in Bangladesh, so try the full address, then
// drop leading parts ("House 27, Road 9A, Dhanmondi" → "Road 9A, Dhanmondi"
// → "Dhanmondi"), then the city alone.
export const geocodeAddress = async (address: string, city: string) => {
  const cityPoint = await geocodeCity(city);

  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const candidates = [...new Set(parts.map((_, i) => [...parts.slice(i), city].join(", ")))].filter((c) => c !== city);

  for (const candidate of candidates) {
    const result = await geocode(candidate);
    if (result && (!cityPoint || distanceM(cityPoint, result) <= MAX_FROM_CITY_M)) {
      return { ...result, matched: candidate };
    }
  }
  return cityPoint ? { ...cityPoint, matched: city } : null;
};

// ── Nearby places ────────────────────────────────────────────────────────

export const NEARBY_RADIUS_M = 1000;

// Nominatim's search words find each kind of place; the type filter drops
// name-only matches (e.g. a "Hospital Road" when looking for hospitals).
const CATEGORIES = [
  { key: "schools", label: "Schools", q: "school", keep: (p: TNominatimPlace) => p.category === "amenity" && /^(school|college|university|kindergarten)$/.test(p.type) },
  { key: "mosques", label: "Mosques", q: "mosque", keep: (p: TNominatimPlace) => p.category === "amenity" && p.type === "place_of_worship" },
  { key: "healthcare", label: "Hospitals & clinics", q: "hospital", keep: (p: TNominatimPlace) => p.category === "amenity" && /^(hospital|clinic|doctors)$/.test(p.type) },
  { key: "pharmacies", label: "Pharmacies", q: "pharmacy", keep: (p: TNominatimPlace) => (p.category === "amenity" && p.type === "pharmacy") || (p.category === "shop" && p.type === "chemist") },
  { key: "shopping", label: "Shops & markets", q: "supermarket", keep: (p: TNominatimPlace) => (p.category === "shop" && /^(supermarket|convenience|mall|department_store)$/.test(p.type)) || p.type === "marketplace" },
  { key: "banks", label: "Banks & ATMs", q: "bank", keep: (p: TNominatimPlace) => p.category === "amenity" && /^(bank|atm)$/.test(p.type) },
  { key: "transport", label: "Bus stops", q: "bus stop", keep: (p: TNominatimPlace) => (p.category === "highway" && p.type === "bus_stop") || p.type === "bus_station" },
  { key: "parks", label: "Parks", q: "park", keep: (p: TNominatimPlace) => p.category === "leisure" && /^(park|playground|garden)$/.test(p.type) },
] as const;

const SEARCH_LIMIT = 40; // Nominatim's maximum

export type TNearbyCategory = {
  key: string;
  label: string;
  count: number;
  // true when the search hit its limit, so there are probably more
  more: boolean;
  nearest: { name: string; distanceM: number } | null;
};

export const distanceM = (a: TPoint, b: TPoint) => {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371e3 * Math.asin(Math.sqrt(h)));
};

export const nearbyPlaces = async (point: TPoint): Promise<TNearbyCategory[]> => {
  // A box a little larger than the radius; the distance check trims it to a circle.
  const d = (NEARBY_RADIUS_M / 111_000) * 1.05;
  const viewbox = [point.lng - d, point.lat + d, point.lng + d, point.lat - d].join(",");

  const results: TNearbyCategory[] = [];
  for (const category of CATEGORIES) {
    const places = await nominatim({ q: category.q, viewbox, bounded: "1", limit: String(SEARCH_LIMIT) });
    const near = places
      .filter(category.keep)
      .map((p) => ({
        name: p.name?.trim() ?? "",
        distanceM: distanceM(point, { lat: Number(p.lat), lng: Number(p.lon) }),
      }))
      .filter((p) => p.distanceM <= NEARBY_RADIUS_M)
      .sort((a, b) => a.distanceM - b.distanceM);

    // Unnamed places still count, but the "nearest" shown needs a real name
    // (an address like "Road 5/1" would read as if it were the place).
    const nearestNamed = near.find((p) => p.name);

    results.push({
      key: category.key,
      label: category.label,
      count: near.length,
      more: places.length >= SEARCH_LIMIT,
      nearest: nearestNamed ?? null,
    });
  }
  return results;
};

// ── Travel times ─────────────────────────────────────────────────────────

export type TRoute = { minutes: number; km: number };

// FOSSGIS's public OSRM servers. Times are for empty roads: no traffic.
export const route = async (from: TPoint, to: TPoint, mode: "car" | "foot"): Promise<TRoute | null> => {
  const profile = mode === "car" ? "driving" : "foot";
  const url = `${ROUTER}/routed-${mode}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const body = (await res.json()) as { routes?: { duration: number; distance: number }[] };
    const best = body.routes?.[0];
    return best ? { minutes: Math.max(1, Math.round(best.duration / 60)), km: Math.round(best.distance / 100) / 10 } : null;
  } catch {
    return null;
  }
};
