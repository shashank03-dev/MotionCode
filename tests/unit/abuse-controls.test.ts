import { describe, expect, it } from "vitest";

import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans";
import { createAnalyzeAbuseGuard } from "@/lib/server/abuse";

describe("analyze abuse controls", () => {
  it("enforces request frequency without relying on global state", () => {
    let now = 1_000;
    const guard = createAnalyzeAbuseGuard({
      maxRequests: 2,
      now: () => now,
      requestWindowMs: 60_000,
    });
    const input = {
      entitlements: PLAN_ENTITLEMENTS.free,
      frameCount: 1,
      payloadBytes: 4,
      userId: "user_1",
    };

    expect(guard.check(input)).toMatchObject({ ok: true });
    expect(guard.check(input)).toMatchObject({ ok: true });
    expect(guard.check(input)).toMatchObject({
      code: "RATE_LIMITED",
      ok: false,
    });

    now += 60_001;

    expect(guard.check(input)).toMatchObject({ ok: true });
  });

  it("rejects frame counts and payloads above plan entitlements", () => {
    const guard = createAnalyzeAbuseGuard({ maxRequests: 10 });

    expect(
      guard.check({
        entitlements: PLAN_ENTITLEMENTS.free,
        frameCount: PLAN_ENTITLEMENTS.free.maxFramesPerAnalysis + 1,
        payloadBytes: 4,
        userId: "user_1",
      }),
    ).toMatchObject({
      code: "QUOTA_EXCEEDED",
      ok: false,
    });

    expect(
      guard.check({
        entitlements: { ...PLAN_ENTITLEMENTS.free, maxUploadBytes: 3 },
        frameCount: 1,
        payloadBytes: 4,
        userId: "user_2",
      }),
    ).toMatchObject({
      code: "INVALID_MEDIA",
      ok: false,
    });
  });

  it("blocks users after repeated model failures and releases them after cooldown", () => {
    let now = 5_000;
    const guard = createAnalyzeAbuseGuard({
      maxModelFailures: 2,
      modelFailureCooldownMs: 120_000,
      modelFailureWindowMs: 300_000,
      now: () => now,
    });
    const input = {
      entitlements: PLAN_ENTITLEMENTS.free,
      frameCount: 1,
      payloadBytes: 4,
      userId: "user_1",
    };

    guard.recordModelFailure("user_1");
    expect(guard.check(input)).toMatchObject({ ok: true });

    guard.recordModelFailure("user_1");
    expect(guard.check(input)).toMatchObject({
      code: "MODEL_FAILED",
      ok: false,
    });

    now += 120_001;

    expect(guard.check(input)).toMatchObject({ ok: true });
  });
});
