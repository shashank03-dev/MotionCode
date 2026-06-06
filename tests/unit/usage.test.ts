import { afterEach, describe, expect, it, vi } from "vitest";
import { createDailyUsageLimiter } from "@/lib/server/usage";
import { FREE_LIMIT as CLIENT_FREE_LIMIT } from "@/lib/rateLimit";
import { FREE_LIMIT } from "@/lib/usageLimits";

const analysisResult = {
  intent: "entrance",
  element: "button",
  duration_ms: 300,
  delay_ms: 0,
  easing: "ease-out",
  loops: false,
  description: "Button fades in.",
  keyframes_detected: 2,
  performance_score: 90,
  gpu_accelerated: true,
  accessibility_note: "Respects reduced motion.",
  css: ".button { opacity: 1; }",
  gsap: "gsap.to('.button', { opacity: 1 });",
  framer_motion: "animate={{ opacity: 1 }}",
  react_spring: "useSpring({ opacity: 1 })",
};

afterEach(() => {
  vi.doUnmock("@/lib/server/gemini");
  vi.clearAllMocks();
  vi.resetModules();
});

function analysisRequest(headers: Record<string, string> = {}): Request {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({ frames: ["frame-1"], frameCount: 1 }),
  });
}

async function loadAnalyzeRoute() {
  vi.resetModules();
  const analyzeFramesWithGemini = vi.fn(async () => analysisResult);

  vi.doMock("@/lib/server/gemini", () => ({
    analyzeFramesWithGemini,
  }));

  const { POST } = await import("@/app/api/analyze/route");

  return { POST, analyzeFramesWithGemini };
}

describe("createDailyUsageLimiter", () => {
  it("allows requests below the daily limit", async () => {
    const limiter = createDailyUsageLimiter({ limit: 3 });

    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: true,
      remaining: 2,
      limit: 3,
    });
  });

  it("blocks requests over the daily limit", async () => {
    const limiter = createDailyUsageLimiter({ limit: 1 });

    await limiter.consume("user-1");

    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: false,
      remaining: 0,
      limit: 1,
    });
  });

  it("resets usage on a new day", async () => {
    let currentDate = new Date("2026-06-06T12:00:00.000Z");
    const limiter = createDailyUsageLimiter({
      limit: 1,
      now: () => currentDate,
    });

    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: true,
      remaining: 0,
      limit: 1,
    });
    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: false,
      remaining: 0,
      limit: 1,
    });

    currentDate = new Date("2026-06-07T00:00:00.000Z");

    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: true,
      remaining: 0,
      limit: 1,
    });
  });

  it("tracks identities independently", async () => {
    const limiter = createDailyUsageLimiter({ limit: 1 });

    await limiter.consume("user-1");

    await expect(limiter.consume("user-2")).resolves.toEqual({
      allowed: true,
      remaining: 0,
      limit: 1,
    });
    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: false,
      remaining: 0,
      limit: 1,
    });
  });
});

describe("FREE_LIMIT", () => {
  it("keeps client display quota in sync with the shared limit", () => {
    expect(CLIENT_FREE_LIMIT).toBe(FREE_LIMIT);
  });
});

describe("POST /api/analyze usage guard", () => {
  it("allows requests under the limit, returns Gemini output, and blocks over-limit before Gemini", async () => {
    const { POST, analyzeFramesWithGemini } = await loadAnalyzeRoute();

    for (let i = 0; i < FREE_LIMIT; i += 1) {
      const response = await POST(
        analysisRequest({ "x-forwarded-for": "203.0.113.1" }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(analysisResult);
    }

    const blocked = await POST(
      analysisRequest({ "x-forwarded-for": "203.0.113.1" }),
    );

    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({
      error: "Daily analysis limit reached.",
      limit: FREE_LIMIT,
      remaining: 0,
    });
    expect(analyzeFramesWithGemini).toHaveBeenCalledTimes(FREE_LIMIT);
    expect(analyzeFramesWithGemini).toHaveBeenCalledWith(["frame-1"]);
  });

  it("uses a deterministic anonymous fallback when identity headers are missing", async () => {
    const { POST, analyzeFramesWithGemini } = await loadAnalyzeRoute();

    for (let i = 0; i < FREE_LIMIT; i += 1) {
      const response = await POST(analysisRequest());

      expect(response.status).toBe(200);
    }

    const blocked = await POST(analysisRequest());

    expect(blocked.status).toBe(429);
    expect(analyzeFramesWithGemini).toHaveBeenCalledTimes(FREE_LIMIT);
  });

  it("keeps route quota buckets isolated by identity", async () => {
    const { POST, analyzeFramesWithGemini } = await loadAnalyzeRoute();

    for (let i = 0; i < FREE_LIMIT; i += 1) {
      const response = await POST(
        analysisRequest({ "x-forwarded-for": "203.0.113.2" }),
      );

      expect(response.status).toBe(200);
    }

    const otherIdentity = await POST(
      analysisRequest({ "x-forwarded-for": "203.0.113.3" }),
    );
    const blockedFirstIdentity = await POST(
      analysisRequest({ "x-forwarded-for": "203.0.113.2" }),
    );

    expect(otherIdentity.status).toBe(200);
    expect(blockedFirstIdentity.status).toBe(429);
    expect(analyzeFramesWithGemini).toHaveBeenCalledTimes(FREE_LIMIT + 1);
  });

  it("parses the first x-forwarded-for value for fallback identity", async () => {
    const { POST } = await loadAnalyzeRoute();

    for (let i = 0; i < FREE_LIMIT; i += 1) {
      const response = await POST(
        analysisRequest({
          "x-forwarded-for": "203.0.113.4, 198.51.100.10",
        }),
      );

      expect(response.status).toBe(200);
    }

    const blocked = await POST(
      analysisRequest({ "x-forwarded-for": "203.0.113.4" }),
    );

    expect(blocked.status).toBe(429);
  });

  it("prefers Vercel forwarded identity over raw x-forwarded-for", async () => {
    const { POST } = await loadAnalyzeRoute();

    for (let i = 0; i < FREE_LIMIT; i += 1) {
      const response = await POST(
        analysisRequest({
          "x-vercel-forwarded-for": "203.0.113.5",
          "x-forwarded-for": "198.51.100.20",
        }),
      );

      expect(response.status).toBe(200);
    }

    const blocked = await POST(
      analysisRequest({ "x-vercel-forwarded-for": "203.0.113.5" }),
    );

    expect(blocked.status).toBe(429);
  });
});
