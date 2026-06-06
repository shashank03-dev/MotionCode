import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { AnalysisResult, MotionSpec } from "@/lib/contracts/motion";
import type { PlanTier } from "@/lib/contracts/plans";
import { normalizeGeminiAnalysis } from "@/lib/server/gemini";

const ORIGINAL_ENV = { ...process.env };

const VALID_JPEG_BASE64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString(
  "base64",
);

const requestBody = (overrides: Record<string, unknown> = {}) => ({
  assetId: "asset_123",
  frames: [VALID_JPEG_BASE64],
  model: "gemini-2.5-flash",
  projectId: "project_123",
  versionId: "version_123",
  workspaceId: "workspace_123",
  ...overrides,
});

const makeRequest = (body: unknown) =>
  new Request("https://motioncode.test/api/analyze", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

const spec: MotionSpec = {
  accessibilityNote: "Respect prefers-reduced-motion.",
  delayMs: 0,
  description: "The button scales down on hover.",
  durationMs: 400,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  element: "button",
  gpuAccelerated: true,
  implementationNotes: ["Use transform and opacity only."],
  intent: "hover",
  keyframesDetected: 2,
  loops: false,
  performanceScore: 92,
};

const generated = {
  outputs: [
    {
      code: ".el{transform:scale(.95)}",
      dependencies: [],
      framework: "css" as const,
      setupNotes: [],
      warnings: [],
    },
    {
      code: "gsap.to('.el',{scale:.95})",
      dependencies: ["gsap"],
      framework: "gsap" as const,
      setupNotes: [],
      warnings: [],
    },
    {
      code: "const v={animate:{scale:.95}}",
      dependencies: ["framer-motion"],
      framework: "framer-motion" as const,
      setupNotes: [],
      warnings: [],
    },
    {
      code: "const s=useSpring({scale:.95})",
      dependencies: ["@react-spring/web"],
      framework: "react-spring" as const,
      setupNotes: [],
      warnings: [],
    },
  ],
  spec,
};

function createDeps(options: { planTier?: PlanTier; userId?: string | null } = {}) {
  return {
    audit: { record: vi.fn(async () => undefined) },
    generateAnalysis: vi.fn(async () => generated),
    getCurrentUser: vi.fn(async () =>
      options.userId === null ? null : { id: options.userId ?? "user_123" },
    ),
    getPlanTier: vi.fn(async () => options.planTier ?? "free"),
    idGenerator: vi.fn(() => "analysis_123"),
    now: vi.fn(() => new Date("2026-06-06T12:00:00.000Z")),
    usage: { record: vi.fn(async () => undefined) },
  };
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.doUnmock("@supabase/supabase-js");
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("POST /api/analyze", () => {
  it("rejects unauthenticated users before calling Gemini", async () => {
    const { handleAnalyzeRequest } = await import("@/app/api/analyze/route");
    const deps = createDeps({ userId: null });

    const response = await handleAnalyzeRequest(makeRequest(requestBody()), deps);
    const json = (await response.json()) as ApiResponse<AnalysisResult>;

    expect(response.status).toBe(401);
    expect(json).toEqual({
      code: "UNAUTHENTICATED",
      message: "Sign in to analyze motion.",
      ok: false,
    });
    expect(deps.generateAnalysis).not.toHaveBeenCalled();
  });

  it("rejects frames that are not base64 JPEG payloads", async () => {
    const { handleAnalyzeRequest } = await import("@/app/api/analyze/route");
    const deps = createDeps();

    const response = await handleAnalyzeRequest(
      makeRequest(requestBody({ frames: ["not-a-jpeg"] })),
      deps,
    );
    const json = (await response.json()) as ApiResponse<AnalysisResult>;

    expect(response.status).toBe(400);
    expect(json).toMatchObject({
      code: "INVALID_MEDIA",
      ok: false,
    });
    expect(deps.generateAnalysis).not.toHaveBeenCalled();
  });

  it("blocks models that are not allowed by the user's plan", async () => {
    const { handleAnalyzeRequest } = await import("@/app/api/analyze/route");
    const deps = createDeps({ planTier: "free" });

    const response = await handleAnalyzeRequest(
      makeRequest(requestBody({ model: "gemini-2.5-pro" })),
      deps,
    );
    const json = (await response.json()) as ApiResponse<AnalysisResult>;

    expect(response.status).toBe(402);
    expect(json).toMatchObject({
      code: "BILLING_REQUIRED",
      ok: false,
    });
    expect(deps.generateAnalysis).not.toHaveBeenCalled();
  });

  it("returns an ApiResponse<AnalysisResult> and records usage and audit events", async () => {
    const { handleAnalyzeRequest } = await import("@/app/api/analyze/route");
    const deps = createDeps();

    const response = await handleAnalyzeRequest(makeRequest(requestBody()), deps);
    const json = (await response.json()) as ApiResponse<AnalysisResult>;

    expect(response.status).toBe(200);
    expect(json).toEqual({
      data: {
        assetId: "asset_123",
        createdAt: "2026-06-06T12:00:00.000Z",
        frameCount: 1,
        id: "analysis_123",
        model: "gemini-2.5-flash",
        outputs: generated.outputs,
        projectId: "project_123",
        spec,
        versionId: "version_123",
      },
      ok: true,
    });
    expect(deps.generateAnalysis).toHaveBeenCalledWith({
      frames: [VALID_JPEG_BASE64],
      model: "gemini-2.5-flash",
    });
    expect(deps.usage.record).toHaveBeenCalledWith({
      eventType: "analysis.completed",
      frameCount: 1,
      model: "gemini-2.5-flash",
      planTier: "free",
      projectId: "project_123",
      userId: "user_123",
      workspaceId: "workspace_123",
    });
    expect(deps.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user_123",
        eventType: "analysis.completed",
        targetId: "analysis_123",
        targetType: "analysis",
      }),
    );
  });

  it("uses Supabase-backed default recorders for usage and audit events", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://motioncode.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.GEMINI_API_KEY = "server-gemini-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-placeholder";

    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    const createClient = vi.fn(() => ({ from }));
    vi.doMock("@supabase/supabase-js", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@supabase/supabase-js")>();

      return {
        ...actual,
        createClient,
      };
    });

    const { handleAnalyzeRequest } = await import("@/app/api/analyze/route");
    const deps = createDeps();
    const response = await handleAnalyzeRequest(makeRequest(requestBody()), {
      abuseGuard: {
        check: vi.fn(() => ({
          ok: true as const,
          remainingRequests: 9,
          resetAt: Date.now() + 60_000,
        })),
        recordModelFailure: vi.fn(),
        recordModelSuccess: vi.fn(),
        reset: vi.fn(),
      },
      generateAnalysis: deps.generateAnalysis,
      getCurrentUser: deps.getCurrentUser,
      getPlanTier: deps.getPlanTier,
      idGenerator: deps.idGenerator,
      now: deps.now,
    });

    expect(response.status).toBe(200);
    expect(createClient).toHaveBeenCalledWith(
      "https://motioncode.supabase.co",
      "service-role-placeholder",
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: false,
          persistSession: false,
        }),
      }),
    );
    expect(from).toHaveBeenCalledWith("usage_events");
    expect(from).toHaveBeenCalledWith("audit_events");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "analysis.completed",
        frame_count: 1,
        model: "gemini-2.5-flash",
        plan_tier: "free",
        project_id: "project_123",
        user_id: "user_123",
        workspace_id: "workspace_123",
      }),
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: "user_123",
        event_type: "analysis.completed",
        target_id: "analysis_123",
        target_type: "analysis",
        workspace_id: "workspace_123",
      }),
    );
  });
});

describe("Gemini analysis normalization", () => {
  it("converts Gemini JSON into the shared AnalysisResult contract", () => {
    const result = normalizeGeminiAnalysis(
      {
        accessibility_note: "Add a reduced-motion fallback.",
        css: ".el{opacity:1}",
        delay_ms: 50,
        description: "Card fades in.",
        duration_ms: 300,
        easing: "ease-out",
        element: "card",
        framer_motion: "const v={animate:{opacity:1}}",
        gpu_accelerated: true,
        gsap: "gsap.to('.el',{opacity:1})",
        implementation_notes: ["Avoid layout properties."],
        intent: "entrance",
        keyframes_detected: 3,
        loops: false,
        performance_score: 88,
        react_spring: "const s=useSpring({opacity:1})",
      },
      {
        assetId: "asset_123",
        createdAt: "2026-06-06T12:00:00.000Z",
        frameCount: 3,
        id: "analysis_123",
        model: "gemini-2.5-flash",
        projectId: "project_123",
        versionId: "version_123",
      },
    );

    expect(result).toMatchObject({
      assetId: "asset_123",
      frameCount: 3,
      id: "analysis_123",
      outputs: [
        { framework: "css" },
        { framework: "gsap" },
        { framework: "framer-motion" },
        { framework: "react-spring" },
      ],
      spec: {
        accessibilityNote: "Add a reduced-motion fallback.",
        delayMs: 50,
        durationMs: 300,
        keyframesDetected: 3,
        performanceScore: 88,
      },
    });
  });
});
