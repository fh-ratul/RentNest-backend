import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { IUpdateUserStatus } from "./admin.interface";
import { ApiError } from "../../utils/apiError";

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const updateUserStatus = async (id: string, payload: IUpdateUserStatus) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (user.role === "ADMIN") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot change status of an admin account",
    );
  }

  return prisma.user.update({
    where: { id },
    data: { activeStatus: payload.activeStatus },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
    },
  });
};

const getAllProperties = async () => {
  return prisma.property.findMany({
    include: {
      category: true,
      landlord: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getAllRentalRequests = async () => {
  return prisma.rentalRequest.findMany({
    include: {
      property: { select: { id: true, title: true, city: true } },
      tenant: { select: { id: true, name: true, email: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentalRequests,
};
