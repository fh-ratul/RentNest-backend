import { randomInt } from "crypto";
import httpStatus from "http-status";
import { getRedis } from "../lib/redis.js";
import { ApiError } from "./apiError.js";

export const OTP_TTL_SECONDS = 60;

const otpKey = (email: string) => `otp:email-verification:${email}`;

// OTPs only live in Redis, so without it there is no verification at all.
const redis = async () => {
  try {
    return await getRedis();
  } catch {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Email verification is temporarily unavailable. Please try again shortly.",
    );
  }
};

export const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, "0");

// A new OTP replaces any earlier one for the same email.
export const saveOtp = async (email: string, otp: string) => {
  const client = await redis();
  await client.set(otpKey(email), otp, { EX: OTP_TTL_SECONDS });
};

// One-time: a correct OTP is deleted as soon as it is used.
export const verifyOtp = async (email: string, otp: string) => {
  const client = await redis();
  const storedOtp = await client.get(otpKey(email));

  if (!storedOtp || storedOtp !== otp) {
    return false;
  }

  await client.del(otpKey(email));
  return true;
};
