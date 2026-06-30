import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

function mockEntitlements(planTier: string) {
  vi.doMock("@/lib/server/entitlements", () => ({
    getEntitlementSummary: vi.fn(async () => ({ planTier })),
  }));
}

describe("resolvePlanGate", () => {
  it("marks free users as not paid", async () => {
    mockEntitlements("free");
    const { resolvePlanGate } = await import("@/app/dashboard/data");

    await expect(resolvePlanGate("user_free")).resolves.toEqual({
      isPaid: false,
      planTier: "free",
    });
  });

  it("marks pro users as paid", async () => {
    mockEntitlements("pro");
    const { resolvePlanGate } = await import("@/app/dashboard/data");

    await expect(resolvePlanGate("user_pro")).resolves.toEqual({
      isPaid: true,
      planTier: "pro",
    });
  });

  it("marks studio users as paid", async () => {
    mockEntitlements("studio");
    const { resolvePlanGate } = await import("@/app/dashboard/data");

    await expect(resolvePlanGate("user_studio")).resolves.toEqual({
      isPaid: true,
      planTier: "studio",
    });
  });
});
