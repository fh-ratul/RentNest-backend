import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import { getRedis } from "../../lib/redis.js";
import type { IUpdateUserStatus } from "./admin.interface.js";
import { ApiError } from "../../utils/apiError.js";
import { DEMO_EMAIL_DOMAIN, isDemoEmail } from "../../utils/demo.js";

// `demo` is true for the public Demo Admin: it only sees the demo accounts'
// data, and its status changes go to a Redis sandbox, never the database.
const DEMO_EMAIL = {
  endsWith: DEMO_EMAIL_DOMAIN,
  mode: "insensitive",
} as const;
const SANDBOX_KEY = "demo-admin:user-status";
const SANDBOX_TTL_SECONDS = 60 * 60;

// Best effort: without Redis the demo still works, its changes just don't stick.
const sandboxStatuses = async (): Promise<Record<string, string>> => {
  try {
    const client = await getRedis();
    return await client.hGetAll(SANDBOX_KEY);
  } catch {
    return {};
  }
};

const saveSandboxStatus = async (id: string, status: string) => {
  try {
    const client = await getRedis();
    await client.hSet(SANDBOX_KEY, id, status);
    await client.expire(SANDBOX_KEY, SANDBOX_TTL_SECONDS);
  } catch {
    // not kept this time
  }
};

const getAllUsers = async (demo: boolean) => {
  const users = await prisma.user.findMany({
    ...(demo && { where: { email: DEMO_EMAIL } }),
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

  if (!demo) return users;

  const statuses = await sandboxStatuses();
  return users.map((user) => {
    const status = statuses[user.id];
    return status === "ACTIVE" || status === "BLOCKED"
      ? { ...user, activeStatus: status }
      : user;
  });
};

const updateUserStatus = async (
  id: string,
  payload: IUpdateUserStatus,
  demo: boolean,
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || (demo && !isDemoEmail(user.email))) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (user.role === "ADMIN") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot change status of an admin account",
    );
  }

  if (demo) {
    await saveSandboxStatus(id, payload.activeStatus);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      activeStatus: payload.activeStatus,
    };
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

const getAllProperties = async (demo: boolean) => {
  return prisma.property.findMany({
    ...(demo && { where: { landlord: { email: DEMO_EMAIL } } }),
    include: {
      category: true,
      landlord: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getAllRentalRequests = async (demo: boolean) => {
  return prisma.rentalRequest.findMany({
    ...(demo && {
      where: {
        tenant: { email: DEMO_EMAIL },
        property: { landlord: { email: DEMO_EMAIL } },
      },
    }),
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
