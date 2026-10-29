import { randomInt } from "crypto";
import httpStatus from "http-status";
import { getRedis } from "../lib/redis.js";
import { ApiError } from "./apiError.js";

export const OTP_TTL_SECONDS = 60;

const otpKey = (email: string) => `otp:email-verification:${email}`;
const attemptsKey = (email: string) => `otp:attempts:${email}`;
// Per email, so guesses spread across IPs are still capped for each code.
const MAX_OTP_ATTEMPTS = 5;

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
  // A resent code starts with a fresh set of attempts.
  await client.del(attemptsKey(email));
};

// One-time: a correct OTP is deleted as soon as it is used. After
// MAX_OTP_ATTEMPTS guesses every attempt fails until a new code is sent.
export const verifyOtp = async (email: string, otp: string) => {
  const client = await redis();

  const attempts = await client.incr(attemptsKey(email));
  if (attempts === 1) await client.expire(attemptsKey(email), OTP_TTL_SECONDS);
  if (attempts > MAX_OTP_ATTEMPTS) return false;

  const storedOtp = await client.get(otpKey(email));

  if (!storedOtp || storedOtp !== otp) {
    return false;
  }

  await client.del([otpKey(email), attemptsKey(email)]);
  return true;
};
