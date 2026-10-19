import { getRedis } from "../lib/redis.js";

// Best-effort Redis cache: if Redis is down, the value is just computed.
// Null results are not cached, so a failed lookup is retried next time.
export const cached = async <T>(key: string, ttlSeconds: number, compute: () => Promise<T | null>): Promise<T | null> => {
  try {
    const client = await getRedis();
    const hit = await client.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // fall through to compute
  }

  const value = await compute();

  if (value !== null) {
    try {
      const client = await getRedis();
      await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch {
      // not cached this time
    }
  }

  return value;
};
