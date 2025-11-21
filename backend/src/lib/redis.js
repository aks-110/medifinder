// Optional Redis integration. If REDIS_URL isn't set, every export below is a
// safe no-op so the rest of the app never has to branch on "is Redis on".
import Redis from "ioredis";

let client = null;
if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: true });
  client.connect().catch((err) => {
    console.warn("[redis] could not connect, falling back to no-op cache:", err.message);
    client = null;
  });
}

export const redisEnabled = () => !!client;

export async function cacheGet(key) {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* cache is best-effort */
  }
}

// Simple fixed-window rate limiter. Returns true if the request should be
// allowed. Without Redis, always allows (no distributed limiter to fall back to).
export async function rateLimitAllow(key, limit, windowSeconds) {
  if (!client) return true;
  try {
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, windowSeconds);
    return count <= limit;
  } catch {
    return true;
  }
}
