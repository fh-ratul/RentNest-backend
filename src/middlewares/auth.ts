import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import config from "../config/index.js";
import { prisma } from "../lib/prisma.js";
import httpStatus from "http-status";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import { jwtUtils } from "../utils/jwt.js";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: Role;
      };
    }
  }
}

export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "You are not logged in. Please log in to access this resource.");
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success || !verifiedToken.data) {
      throw new ApiError(httpStatus.UNAUTHORIZED, verifiedToken.error || "Invalid or expired token");
    }

    const { id, name, email, role } = verifiedToken.data as JwtPayload;

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission to access this resource.");
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists.");
    }

    if (user.activeStatus === "BLOCKED") {
      throw new ApiError(httpStatus.FORBIDDEN, "Your account has been blocked. Please contact support.");
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  });
};
