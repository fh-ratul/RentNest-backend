import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

type LimiterOptions = {
  prefix: string;
  limit: number;
  windowMs: number;
  message: string;
};

const createRateLimiter = ({ prefix, limit, windowMs, message }: LimiterOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${prefix}:${req.ip}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMs);

    try {
      // Atomic upsert: if the window expired, reset to 1; otherwise increment.
      // One statement, no read-then-write race between concurrent requests.
      const [row] = await prisma.$queryRaw<{ count: number }[]>`
        INSERT INTO "rate_limits" (key, count, "expiresAt")
        VALUES (${key}, 1, ${expiresAt})
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN "rate_limits"."expiresAt" < ${now} THEN 1 ELSE "rate_limits".count + 1 END,
          "expiresAt" = CASE WHEN "rate_limits"."expiresAt" < ${now} THEN ${expiresAt} ELSE "rate_limits"."expiresAt" END
        RETURNING count;
      `;

        if(!row){
            throw new Error("Error")
        }
      if (row.count > limit) {
        return res.status(429).json({
          success: false,
          statusCode: 429,
          message,
        });
      }

      next();
    } catch (err) {
      // Fail open: a broken rate-limit store shouldn't block real traffic.
      console.error("Rate limiter error:", err);
      next();
    }
  };
};

 const authLimiter = createRateLimiter({
  prefix: "auth",
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many attempts. Please try again after 15 minutes.",
});

 const generalLimiter = createRateLimiter({
  prefix: "general",
  limit: 300,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests. Please slow down and try again shortly.",
});

export const RateLimiter={
    authLimiter,
    generalLimiter
}