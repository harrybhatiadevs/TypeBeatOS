/**
 * In-memory sliding-window rate limiter.
 *
 * Good enough for a single-process dev/beta deploy. The `Limiter` interface
 * is the swap point for a Redis-backed implementation once we're behind
 * Fly.io's worker pool — same call signature, just a different `consume`.
 */

export interface Limiter {
  consume(key: string): Promise<RateLimitResult>;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
};

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

function nowMs() {
  return Date.now();
}

export type RateLimitConfig = {
  /** Maximum hits allowed inside the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
  /** Optional name used to namespace the bucket key */
  name?: string;
};

export function createLimiter(cfg: RateLimitConfig): Limiter {
  const { limit, windowMs, name = "default" } = cfg;

  return {
    async consume(key: string): Promise<RateLimitResult> {
      const fullKey = `${name}:${key}`;
      const now = nowMs();
      const cutoff = now - windowMs;

      const bucket = buckets.get(fullKey) ?? { hits: [] };
      bucket.hits = bucket.hits.filter((t) => t > cutoff);

      if (bucket.hits.length >= limit) {
        const earliest = bucket.hits[0];
        buckets.set(fullKey, bucket);
        return {
          allowed: false,
          remaining: 0,
          resetMs: Math.max(0, earliest + windowMs - now),
        };
      }

      bucket.hits.push(now);
      buckets.set(fullKey, bucket);
      return {
        allowed: true,
        remaining: limit - bucket.hits.length,
        resetMs: windowMs,
      };
    },
  };
}

/** Test-only: wipe all buckets. Not exported through any production code path. */
export function _resetForTests() {
  buckets.clear();
}

// Tuned for unauthenticated, IP-keyed flows. We expect occasional retries
// (typos, fat-finger Enter) but anything past ~10/min from one IP is abuse.
export const authLimiter = createLimiter({
  name: "auth",
  limit: 10,
  windowMs: 60_000,
});

// Waitlist is public and email-only; one IP shouldn't be hammering it.
export const waitlistLimiter = createLimiter({
  name: "waitlist",
  limit: 5,
  windowMs: 60_000,
});

// OAuth callback gets keyed by IP; same idea as auth but slightly looser
// to tolerate Google's redirect bursts.
export const oauthLimiter = createLimiter({
  name: "oauth",
  limit: 20,
  windowMs: 60_000,
});
