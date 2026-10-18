import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

async function seedProperties(landlordId: string) {
  const existingProperties = await prisma.property.count();

  if (existingProperties > 0) {
    console.log("Properties already exist. Property seed skipped.");
    return;
  }

  let category = await prisma.category.findFirst({});
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Apartment" },
    });
  }

  await prisma.property.createMany({
    data: [
      {
        title: "Modern Apartment in Downtown",
        description: "Bright and spacious apartment with great city views.",
        address: "123 Main Street",
        city: "Dhaka",
        price: 45000,
        bedrooms: 2,
        bathrooms: 2,
        status: "AVAILABLE",
        categoryId: category.id,
        landlordId,
      },
      {
        title: "Cozy Family House",
        description: "Perfect for families with a garden and parking space.",
        address: "456 Green Road",
        city: "Chittagong",
        price: 65000,
        bedrooms: 3,
        bathrooms: 2,
        status: "AVAILABLE",
        categoryId: category.id,
        landlordId,
      },
      {
        title: "Luxury Loft near Airport",
        description: "Stylish loft with modern furniture and open plan design.",
        address: "789 Airport Avenue",
        city: "Sylhet",
        price: 78000,
        bedrooms: 1,
        bathrooms: 1,
        status: "AVAILABLE",
        categoryId: category.id,
        landlordId,
      },
    ],
  });

  console.log("Seeded dummy properties successfully.");
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
