import { ApiError } from "./apiErrors";
import {
  createInMemoryRateLimiter,
  type InMemoryRateLimiter,
} from "./rateLimit";

// Billing mutations are cheap to call but expensive downstream: each checkout
// creates a Razorpay subscription + customer, and change-plan/cancel hit the
// Razorpay API. Cap per-user bursts so a logged-in client cannot spam the
// provider. Best-effort per-instance limiting (same model as the analyze
// guard) — durable limits would need a shared store.
const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60_000;

let limiter: InMemoryRateLimiter | null = null;

function getLimiter() {
  limiter ??= createInMemoryRateLimiter({
    maxRequests: DEFAULT_MAX_REQUESTS,
    windowMs: DEFAULT_WINDOW_MS,
  });
  return limiter;
}

/**
 * Returns an ApiError when the per-user billing rate limit is exceeded, or
 * null when the request may proceed.
 */
export function checkBillingRateLimit(userId: string): ApiError | null {
  const decision = getLimiter().check(`billing:${userId}`);
  if (!decision.ok) {
    return new ApiError(
      "RATE_LIMITED",
      "Too many billing requests. Try again in a moment.",
      429,
    );
  }

  return null;
}

export function resetBillingRateLimiterForTests() {
  getLimiter().reset();
}
