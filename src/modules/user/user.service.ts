import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import config from "../../config/index.js";
import type { IUpdateProfile, IChangePassword } from "./user.interface.js";
import { ApiError } from "../../utils/apiError.js";

// `demo` is true for the public Demo Admin: its changes are checked and
// answered as usual but never saved, so one visitor can't break the demo.
const updateProfile = async (
  userId: string,
  payload: IUpdateProfile,
  demo: boolean,
) => {
  if (demo) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    return { ...user, name: payload.name ?? user.name };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
};

const changePassword = async (
  userId: string,
  payload: IChangePassword,
  demo: boolean,
) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This account was created with Google and has no password",
    );
  }

  const isMatched = await bcrypt.compare(payload.oldPassword, user.password);
  if (!isMatched) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Old password is incorrect");
  }

  if (demo) return null;

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    config.bcrypt_salt_rounds,
  );

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return null;
};
export const userService = {
  updateProfile,
  changePassword,
};
