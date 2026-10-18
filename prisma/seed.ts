import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_CATEGORIES, SEED_LANDLORDS, SEED_PROPERTIES } from "./seed-properties.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// One account per role for the one-click demo buttons on the frontend's login page.
// They use example.com, a reserved domain with no mailboxes, and sendEmail skips it.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "RentNest@12345";

const DEMO_USERS = [
  { name: "Demo Tenant", email: "demo.tenant@example.com", role: "TENANT" },
  { name: "Demo Landlord", email: "demo.landlord@example.com", role: "LANDLORD" },
  { name: "Demo Admin", email: "demo.admin@example.com", role: "ADMIN" },
] as const;

// Creates the demo accounts, or puts them back into a working state
// (known password, verified, active) if someone changed or banned them.
async function seedDemoUsers() {
  const password = await bcrypt.hash(DEMO_PASSWORD, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
  const ids: Record<string, string> = {};

  for (const demo of DEMO_USERS) {
    const working = {
      password,
      authProvider: "CREDENTIAL" as const,
      isEmailVerified: true,
      activeStatus: "ACTIVE" as const,
      role: demo.role,
    };

    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: working,
      create: { name: demo.name, email: demo.email, ...working },
    });
    ids[demo.role] = user.id;
  }

  console.log(`Demo accounts ready (password: ${DEMO_PASSWORD}).`);
  return ids;
}

// Adds the listings from seed-properties.ts. Safe to re-run: a listing whose
// title its landlord already has is skipped, and nothing else is touched.
async function seedProperties(demoLandlordId: string) {
  const password = await bcrypt.hash(DEMO_PASSWORD, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
  const landlordIds: Record<string, string> = { demo: demoLandlordId };

  for (const landlord of SEED_LANDLORDS) {
    const user = await prisma.user.upsert({
      where: { email: landlord.email },
      update: {},
      create: {
        name: landlord.name,
        email: landlord.email,
        password,
        role: "LANDLORD",
        isEmailVerified: true,
      },
    });
    landlordIds[landlord.key] = user.id;
  }

  const categoryIds: Record<string, string> = {};
  for (const name of SEED_CATEGORIES) {
    const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categoryIds[name] = category.id;
  }

  let created = 0;
  for (const { landlord, category, ...property } of SEED_PROPERTIES) {
    const landlordId = landlordIds[landlord]!;
    const exists = await prisma.property.findFirst({
      where: { title: property.title, landlordId },
      select: { id: true },
    });
    if (exists) continue;

    await prisma.property.create({
      data: { ...property, status: "AVAILABLE", landlordId, categoryId: categoryIds[category]! },
    });
    created++;
  }

  console.log(`Seeded ${created} new properties (${SEED_PROPERTIES.length - created} already existed).`);
}

async function main() {
  const demoIds = await seedDemoUsers();
  await seedProperties(demoIds.LANDLORD!);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
