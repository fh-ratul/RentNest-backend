// One-off: puts existing listings on the map and looks up their nearby places.
//   npm run backfill:locations
// Safe to re-run: listings that already have a pin and places are skipped.
// Slow on purpose: OpenStreetMap's geocoder allows one request per second.
import { Prisma } from "@prisma/client";
import { geocodeAddress } from "../src/lib/osm.js";
import { prisma } from "../src/lib/prisma.js";
import { refreshNeighbourhood } from "../src/modules/property/property.neighbourhood.js";
import { ApiError } from "../src/utils/apiError.js";

async function main() {
  const properties = await prisma.property.findMany({
    where: { OR: [{ latitude: null }, { neighbourhood: { equals: Prisma.DbNull } }] },
    select: { id: true, title: true, address: true, city: true, latitude: true, longitude: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`${properties.length} listings to check.`);

  try {
    for (const property of properties) {
      let { latitude, longitude } = property;

      if (latitude === null || longitude === null) {
        const found = await geocodeAddress(property.address, property.city);
        // A match on the city alone would put the pin somewhere arbitrary in it.
        if (!found || found.matched === property.city) {
          console.log(`- ${property.title}: address not found, left for the landlord to pin`);
          continue;
        }
        ({ lat: latitude, lng: longitude } = found);
        await prisma.property.update({ where: { id: property.id }, data: { latitude, longitude } });
        console.log(`- ${property.title}: pinned via "${found.matched}"`);
      }

      await refreshNeighbourhood(property.id);
      const saved = await prisma.property.findUnique({
        where: { id: property.id },
        select: { neighbourhood: true, neighbourhoodSummary: true },
      });
      const categories = (saved?.neighbourhood as { categories?: { count: number }[] } | null)?.categories ?? [];
      console.log(
        `    places: ${categories.reduce((sum, c) => sum + c.count, 0)} found, summary: ${saved?.neighbourhoodSummary ? "yes" : "no"}`,
      );
    }
  } catch (error) {
    // OpenStreetMap is refusing requests (usually rate limiting): carrying on would only make it worse.
    if (!(error instanceof ApiError)) throw error;
    console.log(`Stopped early: ${error.message} Re-run later; finished listings are skipped.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
