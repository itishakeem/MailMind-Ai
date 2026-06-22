// Sliding-window in-process rate limiter.
// Shared state lives in module scope — works within a single warm serverless instance.
// For distributed rate limiting across Vercel instances, swap the Map store for
// Upstash Redis using @upstash/ratelimit (same { allowed, remaining, resetAt } interface).

const windows = new Map<string, number[]>();

const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Checks whether `key` is within `limit` requests in the last `windowMs` milliseconds.
 * Mutates the in-memory window on each call — call only once per request.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Evict timestamps outside the window
  const timestamps = (windows.get(key) ?? []).filter((t) => t > cutoff);

  const allowed = timestamps.length < limit;

  if (allowed) {
    timestamps.push(now);
  }

  if (timestamps.length > 0) {
    windows.set(key, timestamps);
  } else {
    windows.delete(key);
  }

  // Guard against unbounded memory growth when many unique keys arrive
  if (windows.size > MAX_TRACKED_KEYS) {
    for (const [k, ts] of Array.from(windows.entries())) {
      if (ts.every((t: number) => t <= cutoff)) {
        windows.delete(k);
      }
    }
  }

  const oldestTimestamp = timestamps.length > 0 ? timestamps[0] : now;

  return {
    allowed,
    remaining: Math.max(0, limit - timestamps.length),
    resetAt: new Date(oldestTimestamp + windowMs),
  };
}
