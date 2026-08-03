import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingProperties = await prisma.property.count();

  if (existingProperties > 0) {
    console.log("Properties already exist. Seed skipped.");
    return;
  }

  const categories = await prisma.category.findMany({});

  let category = categories[0];
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Apartment" },
    });
  }

  let users = await prisma.user.findMany({ select: { id: true } });

  let landlordId = users[0]?.id;
  if (!landlordId) {
    const createdUser = await prisma.user.create({
      data: {
        name: "Demo Landlord",
        email: "landlord@example.com",
        password: "hashedpassword",
        role: "LANDLORD",
      },
    });
    landlordId = createdUser.id;
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
