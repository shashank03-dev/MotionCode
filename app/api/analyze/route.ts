import { randomUUID } from "node:crypto";

import type { User } from "@supabase/supabase-js";

import {
  PLAN_ENTITLEMENTS,
  PLAN_TIERS,
  type PlanTier,
} from "@/lib/contracts/plans";
import {
  createSupabaseAuditRecorder,
  createSupabaseUsageEventRecorder,
  type AuditRecorder,
  type UsageEventRecorder,
} from "@/lib/server/audit";
import { apiError, apiSuccess, isApiError } from "@/lib/server/apiErrors";
import { getDefaultAnalyzeAbuseGuard, type AnalyzeAbuseGuard } from "@/lib/server/abuse";
import {
  AnalysisResultSchema,
  analyzeFramesWithGemini,
  type GeminiAnalysis,
  type GeminiAnalyzeInput,
} from "@/lib/server/gemini";
import { getCurrentUser as getSupabaseCurrentUser } from "@/lib/supabase/server";

import {
  AnalyzeRequestSchema,
  calculateFramePayloadBytes,
  hasFrameValidationIssue,
} from "./schema";

export const runtime = "nodejs";

type CurrentUser = {
  app_metadata?: User["app_metadata"];
  id: string;
};

export type AnalyzeRouteDeps = {
  abuseGuard?: AnalyzeAbuseGuard;
  audit?: AuditRecorder;
  generateAnalysis?: (input: GeminiAnalyzeInput) => Promise<GeminiAnalysis>;
  getCurrentUser?: () => Promise<CurrentUser | null>;
  getPlanTier?: (user: CurrentUser) => Promise<PlanTier>;
  idGenerator?: () => string;
  now?: () => Date;
  usage?: UsageEventRecorder;
};

export async function POST(request: Request) {
  return handleAnalyzeRequest(request);
}

export async function handleAnalyzeRequest(
  request: Request,
  deps: AnalyzeRouteDeps = {},
) {
  const resolvedDeps = resolveAnalyzeDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to analyze motion.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      hasFrameValidationIssue(parsed.error) ? "INVALID_MEDIA" : "INVALID_REQUEST",
      hasFrameValidationIssue(parsed.error)
        ? "Frames must be base64 encoded JPEG images."
        : "Invalid analyze request.",
    );
  }

  const requestBody = parsed.data;
  const planTier = await resolvedDeps.getPlanTier(user);
  const entitlements = PLAN_ENTITLEMENTS[planTier];

  if (!entitlements.allowedModels.includes(requestBody.model)) {
    return apiError(
      "BILLING_REQUIRED",
      `${planTier} plan does not include ${requestBody.model}.`,
    );
  }

  const abuseDecision = resolvedDeps.abuseGuard.check({
    entitlements,
    frameCount: requestBody.frames.length,
    payloadBytes: calculateFramePayloadBytes(requestBody.frames),
    userId: user.id,
  });

  if (!abuseDecision.ok) {
    return apiError(
      abuseDecision.code,
      abuseDecision.message,
      retryHeaders(abuseDecision.retryAfterMs),
    );
  }

  const analysisId = resolvedDeps.idGenerator();
  const createdAt = resolvedDeps.now().toISOString();

  try {
    const generated = await resolvedDeps.generateAnalysis({
      frames: requestBody.frames,
      model: requestBody.model,
    });
    const result = AnalysisResultSchema.parse({
      assetId: requestBody.assetId,
      createdAt,
      frameCount: requestBody.frames.length,
      id: analysisId,
      model: requestBody.model,
      outputs: generated.outputs,
      projectId: requestBody.projectId,
      spec: generated.spec,
      versionId: requestBody.versionId,
    });

    resolvedDeps.abuseGuard.recordModelSuccess(user.id);

    await Promise.all([
      resolvedDeps.usage.record({
        eventType: "analysis.completed",
        frameCount: requestBody.frames.length,
        model: requestBody.model,
        planTier,
        projectId: requestBody.projectId,
        userId: user.id,
        workspaceId: requestBody.workspaceId,
      }),
      resolvedDeps.audit.record({
        actorId: user.id,
        eventType: "analysis.completed",
        metadata: {
          frameCount: requestBody.frames.length,
          model: requestBody.model,
          planTier,
          projectId: requestBody.projectId,
        },
        targetId: analysisId,
        targetType: "analysis",
        workspaceId: requestBody.workspaceId,
      }),
    ]);

    return apiSuccess(result);
  } catch (error) {
    resolvedDeps.abuseGuard.recordModelFailure(user.id);
    await resolvedDeps.audit.record({
      actorId: user.id,
      eventType: "analysis.failed",
      metadata: {
        frameCount: requestBody.frames.length,
        model: requestBody.model,
        planTier,
        reason: isApiError(error) ? error.code : "INTERNAL_ERROR",
      },
      targetId: analysisId,
      targetType: "analysis",
      workspaceId: requestBody.workspaceId,
    });

    if (isApiError(error)) {
      return apiError(error.code, error.message, { status: error.status });
    }

    return apiError("MODEL_FAILED", "Motion analysis failed. Try again shortly.");
  }
}

function resolveAnalyzeDeps(deps: AnalyzeRouteDeps): Required<AnalyzeRouteDeps> {
  return {
    abuseGuard: deps.abuseGuard ?? getDefaultAnalyzeAbuseGuard(),
    audit: deps.audit ?? createSupabaseAuditRecorder(),
    generateAnalysis: deps.generateAnalysis ?? analyzeFramesWithGemini,
    getCurrentUser: deps.getCurrentUser ?? getSupabaseCurrentUser,
    getPlanTier: deps.getPlanTier ?? resolvePlanTierFromUser,
    idGenerator: deps.idGenerator ?? randomUUID,
    now: deps.now ?? (() => new Date()),
    usage: deps.usage ?? createSupabaseUsageEventRecorder(),
  };
}

async function resolvePlanTierFromUser(user: CurrentUser): Promise<PlanTier> {
  const planTier = user.app_metadata?.plan_tier;
  return PLAN_TIERS.includes(planTier as PlanTier) ? (planTier as PlanTier) : "free";
}

function retryHeaders(retryAfterMs: number | undefined): ResponseInit {
  if (!retryAfterMs) {
    return {};
  }

  return {
    headers: {
      "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
    },
  };
}
