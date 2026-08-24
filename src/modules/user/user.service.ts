import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import config from "../../config/index.js";
import { IUpdateProfile, IChangePassword } from "./user.interface.js";
import { ApiError } from "../../utils/apiError.js";

const updateProfile = async (userId: string, payload: IUpdateProfile) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
};

const changePassword = async (userId: string, payload: IChangePassword) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const isMatched = await bcrypt.compare(payload.oldPassword, user.password);
  if (!isMatched) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Old password is incorrect");
  }

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
