/**
 * A small in-memory sliding-window rate limiter. Good enough for a
 * single-instance deployment; swap for a Redis-backed limiter (e.g.
 * Upstash) before running multiple instances behind a load balancer.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0]!;
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - oldest) };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length, retryAfterMs: 0 };
}

// Periodically forget buckets that have gone idle so this doesn't grow
// unbounded across a long-running process.
const SWEEP_INTERVAL_MS = 5 * 60_000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.timestamps.every((t) => now - t > SWEEP_INTERVAL_MS)) {
        buckets.delete(key);
      }
    }
  }, SWEEP_INTERVAL_MS).unref?.();
}
