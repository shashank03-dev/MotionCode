import { describe, expect, expectTypeOf, it } from "vitest";

import { APP_ERROR_CODES, type ApiResponse } from "@/lib/contracts/errors";
import {
  OUTPUT_FRAMEWORKS,
  type AnalysisResult,
} from "@/lib/contracts/motion";
import {
  PLAN_ENTITLEMENTS,
  PLAN_TIERS,
  type PlanTier,
} from "@/lib/contracts/plans";

describe("shared product contracts", () => {
  it("defines the shared plan tiers and entitlements", () => {
    expect(PLAN_TIERS).toEqual(["free", "pro", "studio"]);
    expect(PLAN_ENTITLEMENTS.free).toMatchObject({
      tier: "free",
      dailyAnalyses: 3,
      allowedModels: ["gemini-2.5-flash"],
      shareLinks: false,
      comments: false,
      supportPriority: "community",
    });
    expect(PLAN_ENTITLEMENTS.studio).toMatchObject({
      tier: "studio",
      dailyAnalyses: 500,
      allowedModels: ["gemini-2.5-flash", "gemini-2.5-pro"],
      shareLinks: true,
      comments: true,
      supportPriority: "priority",
    });

    expectTypeOf<PlanTier>().toEqualTypeOf<"free" | "pro" | "studio">();
  });

  it("defines motion output and API response contracts", () => {
    expect(OUTPUT_FRAMEWORKS).toEqual([
      "css",
      "gsap",
      "framer-motion",
      "react-spring",
    ]);
    expect(APP_ERROR_CODES).toContain("MODEL_FAILED");
    expect(APP_ERROR_CODES).toContain("BILLING_REQUIRED");

    expectTypeOf<AnalysisResult["model"]>().toEqualTypeOf<
      "gemini-2.5-flash" | "gemini-2.5-pro" | "gpt-5.5"
    >();
    expectTypeOf<ApiResponse<{ id: string }>>().toMatchTypeOf<
      | { ok: true; data: { id: string } }
      | { ok: false; code: (typeof APP_ERROR_CODES)[number]; message: string }
    >();
  });
});
