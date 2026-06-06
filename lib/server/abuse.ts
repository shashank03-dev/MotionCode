import type { AppErrorCode } from "@/lib/contracts/errors";
import type { PlanEntitlements } from "@/lib/contracts/plans";

import {
  createInMemoryRateLimiter,
  type InMemoryRateLimiter,
} from "./rateLimit";

export type AbuseDecision =
  | {
      ok: true;
      remainingRequests: number;
      resetAt: number;
    }
  | {
      code: AppErrorCode;
      message: string;
      ok: false;
      retryAfterMs?: number;
    };

export type AnalyzeAbuseCheckInput = {
  entitlements: PlanEntitlements;
  frameCount: number;
  payloadBytes: number;
  userId: string;
};

export type AnalyzeAbuseGuard = {
  check: (input: AnalyzeAbuseCheckInput) => AbuseDecision;
  recordModelFailure: (userId: string) => void;
  recordModelSuccess: (userId: string) => void;
  reset: () => void;
};

export type AnalyzeAbuseGuardOptions = {
  maxModelFailures?: number;
  maxRequests?: number;
  modelFailureCooldownMs?: number;
  modelFailureWindowMs?: number;
  now?: () => number;
  requestWindowMs?: number;
};

const DEFAULT_MAX_REQUESTS = 20;
const DEFAULT_REQUEST_WINDOW_MS = 60_000;
const DEFAULT_MAX_MODEL_FAILURES = 3;
const DEFAULT_MODEL_FAILURE_WINDOW_MS = 5 * 60_000;
const DEFAULT_MODEL_FAILURE_COOLDOWN_MS = 2 * 60_000;

type FailureState = {
  blockedUntil?: number;
  failures: number[];
};

export function createAnalyzeAbuseGuard({
  maxModelFailures = DEFAULT_MAX_MODEL_FAILURES,
  maxRequests = DEFAULT_MAX_REQUESTS,
  modelFailureCooldownMs = DEFAULT_MODEL_FAILURE_COOLDOWN_MS,
  modelFailureWindowMs = DEFAULT_MODEL_FAILURE_WINDOW_MS,
  now = Date.now,
  requestWindowMs = DEFAULT_REQUEST_WINDOW_MS,
}: AnalyzeAbuseGuardOptions = {}): AnalyzeAbuseGuard {
  const limiter: InMemoryRateLimiter = createInMemoryRateLimiter({
    maxRequests,
    now,
    windowMs: requestWindowMs,
  });
  const failuresByUser = new Map<string, FailureState>();

  function getActiveFailureState(userId: string, currentTime: number) {
    const state = failuresByUser.get(userId);
    if (!state) {
      return undefined;
    }

    if (state.blockedUntil && state.blockedUntil <= currentTime) {
      failuresByUser.delete(userId);
      return undefined;
    }

    state.failures = state.failures.filter(
      (failureAt) => currentTime - failureAt < modelFailureWindowMs,
    );

    if (!state.failures.length && !state.blockedUntil) {
      failuresByUser.delete(userId);
      return undefined;
    }

    return state;
  }

  return {
    check({ entitlements, frameCount, payloadBytes, userId }) {
      const currentTime = now();
      const failureState = getActiveFailureState(userId, currentTime);

      if (failureState?.blockedUntil && failureState.blockedUntil > currentTime) {
        return {
          code: "MODEL_FAILED",
          message: "Model analysis is temporarily paused after repeated failures.",
          ok: false,
          retryAfterMs: failureState.blockedUntil - currentTime,
        };
      }

      if (frameCount > entitlements.maxFramesPerAnalysis) {
        return {
          code: "QUOTA_EXCEEDED",
          message: `Your plan allows up to ${entitlements.maxFramesPerAnalysis} frames per analysis.`,
          ok: false,
        };
      }

      if (payloadBytes > entitlements.maxUploadBytes) {
        return {
          code: "INVALID_MEDIA",
          message: `Frame payload exceeds the ${entitlements.tier} plan upload limit.`,
          ok: false,
        };
      }

      const rateLimit = limiter.check(userId);
      if (!rateLimit.ok) {
        return {
          code: "RATE_LIMITED",
          message: "Too many analyze requests. Try again shortly.",
          ok: false,
          retryAfterMs: rateLimit.retryAfterMs,
        };
      }

      return {
        ok: true,
        remainingRequests: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      };
    },
    recordModelFailure(userId) {
      const currentTime = now();
      const state = getActiveFailureState(userId, currentTime) ?? { failures: [] };
      state.failures.push(currentTime);

      if (state.failures.length >= maxModelFailures) {
        state.blockedUntil = currentTime + modelFailureCooldownMs;
      }

      failuresByUser.set(userId, state);
    },
    recordModelSuccess(userId) {
      failuresByUser.delete(userId);
    },
    reset() {
      limiter.reset();
      failuresByUser.clear();
    },
  };
}

const defaultAnalyzeAbuseGuard = createAnalyzeAbuseGuard();

export function getDefaultAnalyzeAbuseGuard() {
  return defaultAnalyzeAbuseGuard;
}

export function resetDefaultAnalyzeAbuseGuardForTests() {
  defaultAnalyzeAbuseGuard.reset();
}
