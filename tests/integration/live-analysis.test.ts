// @vitest-environment node
// Opt in with MOTIONCODE_LIVE_ANALYSIS=1 and a development GEMINI_API_KEY.
// Exercises the real provider and route contract; auth/quota adapters are isolated.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { handleAnalyzeRequest } from "@/app/api/analyze/handler";
import { PLAN_ENTITLEMENTS, PLAN_TIERS } from "@/lib/contracts/plans";
import { analyzeFramesWithGemini } from "@/lib/server/gemini";
import { createAnalyzeAbuseGuard } from "@/lib/server/abuse";

const enabled = process.env.MOTIONCODE_LIVE_ANALYSIS === "1";
const frame = readFileSync(fileURLToPath(new URL("../fixtures/motion-contact-sheet.jpg", import.meta.url))).toString("base64");

for (const planTier of PLAN_TIERS) {
  test.skipIf(!enabled)(`live ${planTier} analysis returns usable code`, async () => {
    let reservations = 0;
    const started = Date.now();
    const model = planTier === "free" ? "gemini-2.5-flash" : "gemini-2.5-pro";
    const response = await handleAnalyzeRequest(new Request("https://motioncode.test/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ frames: [frame], frameGrid: { columns: 4, rows: 1, frameCount: 4 }, model }),
    }), {
      generateAnalysis: (input) => analyzeFramesWithGemini(input, { apiKey: process.env.GEMINI_API_KEY }),
      getCurrentUser: async () => ({ id: `live-test-${planTier}` }),
      getEntitlementSummary: async () => ({ planTier, entitlements: PLAN_ENTITLEMENTS[planTier] }),
      isOpenAiAnalysisEnabled: () => false,
      abuseGuard: createAnalyzeAbuseGuard(),
      reserveDailyAnalysisUsage: async () => { reservations += 1; return true; },
      releaseDailyAnalysisUsage: async () => { reservations -= 1; return true; },
      usage: { record: async () => {} },
      audit: { record: async () => {} },
    });
    const json = await response.json();
    console.log(JSON.stringify({ planTier, status: response.status, durationMs: Date.now() - started, code: json.code, outputs: json.data?.outputs?.map((entry: { framework: string }) => entry.framework) }));
    expect(response.status, JSON.stringify(json)).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.model).toBe(model);
    expect(json.data.frameCount).toBe(4);
    expect(reservations).toBe(1);
    for (const framework of ["css", "gsap", "framer-motion", "react-spring"]) {
      const output = json.data.outputs.find((entry: { framework: string }) => entry.framework === framework);
      expect(output?.code.trim().length, framework).toBeGreaterThan(20);
    }
  }, 120_000);
}
