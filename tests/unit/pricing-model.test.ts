import { describe, expect, it } from "vitest";

import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans";
import { COMPARISON, MAX_FRAMES, PRICING_TIERS } from "@/lib/pricing";

describe("pricing model", () => {
  it("lists every tier in order with the advertised prices", () => {
    expect(PRICING_TIERS.map((t) => [t.name, t.price])).toEqual([
      ["Free", "$0"],
      ["Pro", "$18"],
      ["Team", "$49"],
    ]);
    expect(PRICING_TIERS.filter((t) => t.featured).map((t) => t.tier)).toEqual(["pro"]);
  });

  it("derives sampling resolution from the enforced entitlements", () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.frames).toBe(PLAN_ENTITLEMENTS[tier.tier].maxFramesPerAnalysis);
      expect(tier.highlights).toContain(`${tier.frames} frames per analysis`);
    }
    expect(MAX_FRAMES).toBe(PLAN_ENTITLEMENTS.studio.maxFramesPerAnalysis);
  });

  it("never advertises the free quota as more than is enforced", () => {
    const free = PRICING_TIERS.find((t) => t.tier === "free")!;
    expect(free.highlights[0]).toBe(
      `${PLAN_ENTITLEMENTS.free.dailyAnalyses} analysis a day`,
    );
    const workspaces = COMPARISON.flatMap((g) => g.rows).find((r) => r.label === "Workspaces")!;
    expect(workspaces.values.free).toBe(false);
  });

  it("only claims shipping features", () => {
    const copy = JSON.stringify(PRICING_TIERS).toLowerCase();
    for (const unshipped of ["sso", "motion tokens", "roles"]) {
      expect(copy).not.toContain(unshipped);
    }
  });

  it("keeps the comparison table in step with the entitlements", () => {
    const rows = Object.fromEntries(COMPARISON.flatMap((g) => g.rows).map((r) => [r.label, r.values]));
    expect(rows["Version history"]).toEqual({ free: false, pro: true, studio: true });
    expect(rows["Comments"]).toEqual({ free: false, pro: false, studio: true });
    expect(rows["Seats"]).toEqual({ free: "1", pro: "1", studio: "5" });
  });
});
