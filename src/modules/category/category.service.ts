import { prisma } from "../../lib/prisma.js";

const getAllCategories = async () => {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
};

export const categoryService = { getAllCategories };
