import bcrypt from "bcryptjs";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import type { TokenPayload } from "google-auth-library";
import httpStatus from "http-status";
import { AuthProvider, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { googleClient } from "../../lib/googleAuth.js";
import config from "../../config/index.js";
import {
  IRegisterUser,
  ILoginUser,
  IVerifyEmail,
  IResendOtp,
  IGoogleLogin,
} from "./auth.interface.js";
import { ApiError } from "../../utils/apiError.js";
import { jwtUtils } from "../../utils/jwt.js";
import {
  sendEmail,
  otpEmail,
  welcomeEmail,
  loginAlertEmail,
} from "../../utils/email.js";
import {
  OTP_TTL_SECONDS,
  generateOtp,
  saveOtp,
  verifyOtp,
} from "../../utils/otp.js";

// Never select the password hash for anything that is sent back to a client.
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  activeStatus: true,
  authProvider: true,
  isEmailVerified: true,
  createdAt: true,
} as const;

const createTokens = (user: {
  id: string;
  name: string;
  email: string;
  role: Role;
}) => {
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { accessToken, refreshToken };
};

const sendVerificationOtp = async (user: { name: string; email: string }) => {
  const otp = generateOtp();

  await saveOtp(user.email, otp);

  const isSent = await sendEmail(
    otpEmail({ ...user, otp, ttlSeconds: OTP_TTL_SECONDS }),
  );

  if (!isSent) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Could not send the verification email. Please try again.",
    );
  }
};

const registerUser = async (payload: IRegisterUser) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser?.isEmailVerified) {
    throw new ApiError(400, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_rounds,
  );

  const data = {
    name: payload.name,
    password: hashedPassword,
    role: payload.role,
  };

  // An unverified account never proved it owns the email, so signing up
  // again simply replaces it.
  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data,
        select: safeUserSelect,
      })
    : await prisma.user.create({
        data: { ...data, email: payload.email },
        select: safeUserSelect,
      });

  await sendVerificationOtp(user);

  return user;
};

const verifyEmail = async (payload: IVerifyEmail) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: safeUserSelect,
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  if (user.isEmailVerified) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Email is already verified. Please log in.",
    );
  }

  const isOtpValid = await verifyOtp(payload.email, payload.otp);

  if (!isOtpValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
    select: safeUserSelect,
  });

  if (verifiedUser.activeStatus === "BLOCKED") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. Please contact support.",
    );
  }

  await sendEmail(welcomeEmail(verifiedUser));

  return { ...createTokens(verifiedUser), user: verifiedUser };
};

const resendOtp = async (payload: IResendOtp) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { name: true, email: true, isEmailVerified: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No account found with this email");
  }

  if (user.isEmailVerified) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Email is already verified. Please log in.",
    );
  }

  await sendVerificationOtp(user);

  return null;
};

const loginUser = async (payload: ILoginUser) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.activeStatus === "BLOCKED") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. Please contact support.",
    );
  }

  if (!user.password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This account was created with Google. Please log in with Google.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  // Any earlier OTP has long expired, so a fresh one goes out right away.
  if (!user.isEmailVerified) {
    await sendVerificationOtp(user);

    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your email is not verified. We have sent a new OTP to your email.",
      "EMAIL_NOT_VERIFIED",
    );
  }

  await sendEmail(
    loginAlertEmail({ ...user, method: "password", at: new Date() }),
  );

  return createTokens(user);
};

const googleLogin = async (payload: IGoogleLogin) => {
  let googleIdTokenPayload: TokenPayload | undefined;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired Google ID token",
    );
  }

  if (!googleIdTokenPayload?.sub || !googleIdTokenPayload.email) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired Google ID token",
    );
  }

  if (!googleIdTokenPayload.email_verified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your Google email address is not verified",
    );
  }

  const googleId = googleIdTokenPayload.sub;
  const email = googleIdTokenPayload.email.trim().toLowerCase();
  const name = googleIdTokenPayload.name?.trim() || email.split("@")[0]!;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
    select: { ...safeUserSelect, googleId: true },
  });

  // An unverified email/password account never proved it owns this email,
  // so it is taken over as a fresh Google sign up. Its password is dropped:
  // whoever set it could otherwise log in to the Google user's account.
  if (existingUser && existingUser.isEmailVerified) {
    // Google login is for tenants and landlords: admins must use their password.
    if (existingUser.role === Role.ADMIN) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Google login is only available for tenant and landlord accounts",
      );
    }

    if (existingUser.activeStatus === "BLOCKED") {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account is blocked. Please contact support.",
      );
    }

    if (existingUser.googleId && existingUser.googleId !== googleId) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "This email is already linked to a different Google account",
      );
    }

    // A verified email/password account with the same email: link it.
    if (!existingUser.googleId) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { googleId },
      });
    }

    const { googleId: _googleId, ...user } = existingUser;

    await sendEmail(
      loginAlertEmail({ ...user, method: "Google", at: new Date() }),
    );

    return { ...createTokens(user), user, isNewUser: false };
  }

  // Sign up: the frontend sends the role the user picked on the sign up page.
  if (!payload.role) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No account found for this Google account. Please sign up first and choose a role (TENANT or LANDLORD).",
    );
  }

  const data = {
    name,
    email,
    googleId,
    password: null,
    authProvider: AuthProvider.GOOGLE,
    isEmailVerified: true,
    role: payload.role,
  };

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data,
        select: safeUserSelect,
      })
    : await prisma.user.create({ data, select: safeUserSelect });

  await sendEmail(welcomeEmail(user));

  return { ...createTokens(user), user, isNewUser: true };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
      authProvider: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is missing");
  }

  const verified = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

  if (!verified.success || !verified.data) {
    throw new ApiError(httpStatus.UNAUTHORIZED, verified.error || "Invalid refresh token");
  }

  const { id } = verified.data as JwtPayload;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists");
  }

  if (user.activeStatus === "BLOCKED") {
    throw new ApiError(httpStatus.FORBIDDEN, "This account is blocked");
  }

  const { accessToken } = createTokens(user);

  return { accessToken };
};

export const authService = {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
  googleLogin,
  getMe,
  refreshToken,
};
