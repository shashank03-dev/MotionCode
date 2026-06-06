export type RateLimitDecision =
  | {
      ok: true;
      remaining: number;
      resetAt: number;
    }
  | {
      ok: false;
      remaining: 0;
      resetAt: number;
      retryAfterMs: number;
    };

export type InMemoryRateLimiterOptions = {
  maxRequests: number;
  now?: () => number;
  windowMs: number;
};

export type InMemoryRateLimiter = {
  check: (key: string) => RateLimitDecision;
  reset: () => void;
};

export function createInMemoryRateLimiter({
  maxRequests,
  now = Date.now,
  windowMs,
}: InMemoryRateLimiterOptions): InMemoryRateLimiter {
  const hitsByKey = new Map<string, number[]>();

  function prune(hits: number[], currentTime: number) {
    return hits.filter((hit) => currentTime - hit < windowMs);
  }

  return {
    check(key) {
      const currentTime = now();
      const hits = prune(hitsByKey.get(key) ?? [], currentTime);

      if (hits.length >= maxRequests) {
        const resetAt = hits[0] + windowMs;
        return {
          ok: false,
          remaining: 0,
          resetAt,
          retryAfterMs: Math.max(0, resetAt - currentTime),
        };
      }

      hits.push(currentTime);
      hitsByKey.set(key, hits);

      return {
        ok: true,
        remaining: Math.max(0, maxRequests - hits.length),
        resetAt: hits[0] + windowMs,
      };
    },
    reset() {
      hitsByKey.clear();
    },
  };
}
