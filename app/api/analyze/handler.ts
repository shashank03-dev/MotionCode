import { randomUUID } from "node:crypto";

import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import {
  PLAN_ENTITLEMENTS,
  PLAN_TIERS,
  type PlanTier,
} from "@/lib/contracts/plans";
import {
  authorizeAnalysisRequestWithSupabase,
  createSupabaseAuditRecorder,
  createSupabaseUsageEventRecorder,
  getDailyAnalysisCountWithSupabase,
  type AuditRecorder,
  type UsageEventRecorder,
} from "@/lib/server/audit";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
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
  MAX_ANALYZE_REQUEST_CONTENT_LENGTH,
  calculateFramePayloadBytes,
  hasFrameValidationIssue,
  type AnalyzeRequestBody,
} from "./schema";

export { MAX_ANALYZE_REQUEST_CONTENT_LENGTH };

type CurrentUser = {
  app_metadata?: User["app_metadata"];
  id: string;
};

export type DailyAnalysisCountInput = {
  since: Date;
  userId: string;
};

export type AnalyzeRouteDeps = {
  abuseGuard?: AnalyzeAbuseGuard;
  audit?: AuditRecorder;
  authorizeAnalysisRequest?: (
    user: CurrentUser,
    requestBody: AnalyzeRequestBody,
  ) => Promise<boolean>;
  generateAnalysis?: (input: GeminiAnalyzeInput) => Promise<GeminiAnalysis>;
  getCurrentUser?: () => Promise<CurrentUser | null>;
  getDailyAnalysisCount?: (input: DailyAnalysisCountInput) => Promise<number>;
  getPlanTier?: (user: CurrentUser) => Promise<PlanTier>;
  idGenerator?: () => string;
  now?: () => Date;
  usage?: UsageEventRecorder;
};

export async function handleAnalyzeRequest(
  request: Request,
  deps: AnalyzeRouteDeps = {},
) {
  const contentLengthDecision = checkContentLength(request);
  if (contentLengthDecision) {
    return contentLengthDecision;
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiError(error.code, error.message, { status: error.status });
    }

    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  if (body === null) {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const resolvedDeps = resolveAnalyzeDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to analyze motion.");
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

  const preflightError = await runPreflightChecks({
    entitlements,
    requestBody,
    resolvedDeps,
    user,
  });
  if (preflightError) {
    return preflightError;
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

  try {
    await resolvedDeps.usage.record({
      eventType: "analysis.started",
      frameCount: requestBody.frames.length,
      model: requestBody.model,
      planTier,
      projectId: requestBody.projectId,
      userId: user.id,
      workspaceId: requestBody.workspaceId,
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to reserve analysis usage.");
  }

  const analysisId = resolvedDeps.idGenerator();
  const createdAt = resolvedDeps.now().toISOString();
  const generatedResult = await runGeminiAnalysis({
    analysisId,
    createdAt,
    planTier,
    requestBody,
    resolvedDeps,
    user,
  });

  if (!generatedResult.ok) {
    return generatedResult.response;
  }

  try {
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
  } catch (error) {
    const persistenceError = toApiError(
      error,
      "INTERNAL_ERROR",
      "Failed to persist analysis usage.",
    );
    await recordFailureAuditSafely(resolvedDeps.audit, {
      analysisId,
      planTier,
      reason: persistenceError.code,
      requestBody,
      user,
    });

    return apiError(persistenceError.code, persistenceError.message, {
      status: persistenceError.status,
    });
  }

  return apiSuccess(generatedResult.result);
}

type ResolvedAnalyzeRouteDeps = Required<AnalyzeRouteDeps>;

function resolveAnalyzeDeps(
  deps: AnalyzeRouteDeps,
): ResolvedAnalyzeRouteDeps {
  return {
    abuseGuard: deps.abuseGuard ?? getDefaultAnalyzeAbuseGuard(),
    audit: deps.audit ?? createSupabaseAuditRecorder(),
    authorizeAnalysisRequest:
      deps.authorizeAnalysisRequest ?? authorizeAnalysisRequestWithSupabase,
    generateAnalysis: deps.generateAnalysis ?? analyzeFramesWithGemini,
    getCurrentUser: deps.getCurrentUser ?? getSupabaseCurrentUser,
    getDailyAnalysisCount:
      deps.getDailyAnalysisCount ?? getDailyAnalysisCountWithSupabase,
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

function checkContentLength(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return null;
  }

  const parsed = Number.parseInt(contentLength, 10);
  if (
    Number.isFinite(parsed) &&
    parsed > MAX_ANALYZE_REQUEST_CONTENT_LENGTH
  ) {
    return apiError("INVALID_MEDIA", "Analyze request payload is too large.", {
      status: 413,
    });
  }

  return null;
}

async function readBoundedJson(request: Request) {
  const text = await readBoundedBodyText(request);

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Invalid JSON");
  }
}

async function readBoundedBodyText(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) {
    return await request.text();
  }

  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_ANALYZE_REQUEST_CONTENT_LENGTH) {
      await reader.cancel();
      throw new ApiError(
        "INVALID_MEDIA",
        "Analyze request payload is too large.",
        413,
      );
    }

    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

async function runPreflightChecks({
  entitlements,
  requestBody,
  resolvedDeps,
  user,
}: {
  entitlements: (typeof PLAN_ENTITLEMENTS)[PlanTier];
  requestBody: AnalyzeRequestBody;
  resolvedDeps: ResolvedAnalyzeRouteDeps;
  user: CurrentUser;
}) {
  try {
    const authorized = await resolvedDeps.authorizeAnalysisRequest(
      user,
      requestBody,
    );
    if (!authorized) {
      return apiError("FORBIDDEN", "You cannot analyze the submitted project.");
    }

    const dailyCount = await resolvedDeps.getDailyAnalysisCount({
      since: startOfUtcDay(resolvedDeps.now()),
      userId: user.id,
    });

    if (dailyCount >= entitlements.dailyAnalyses) {
      return apiError(
        "QUOTA_EXCEEDED",
        `Your plan allows ${entitlements.dailyAnalyses} analyses per day.`,
      );
    }
  } catch (error) {
    const apiFailure = toApiError(
      error,
      "INTERNAL_ERROR",
      "Analyze request preflight failed.",
    );

    return apiError(apiFailure.code, apiFailure.message, {
      status: apiFailure.status,
    });
  }

  return null;
}

async function runGeminiAnalysis({
  analysisId,
  createdAt,
  planTier,
  requestBody,
  resolvedDeps,
  user,
}: {
  analysisId: string;
  createdAt: string;
  planTier: PlanTier;
  requestBody: AnalyzeRequestBody;
  resolvedDeps: ResolvedAnalyzeRouteDeps;
  user: CurrentUser;
}): Promise<
  | { ok: true; result: z.infer<typeof AnalysisResultSchema> }
  | { ok: false; response: Response }
> {
  try {
    const generated = await resolvedDeps.generateAnalysis({
      frames: requestBody.frames,
      model: requestBody.model,
    });
    const result = parseAnalysisResultSchema({
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

    return { ok: true, result };
  } catch (error) {
    const apiFailure = toApiError(
      error,
      "MODEL_FAILED",
      "Motion analysis failed. Try again shortly.",
    );
    resolvedDeps.abuseGuard.recordModelFailure(user.id);
    await recordFailureAuditSafely(resolvedDeps.audit, {
      analysisId,
      planTier,
      reason: apiFailure.code,
      requestBody,
      user,
    });

    return {
      ok: false,
      response: apiError(apiFailure.code, apiFailure.message, {
        status: apiFailure.status,
      }),
    };
  }
}

function parseAnalysisResultSchema(input: unknown) {
  try {
    return AnalysisResultSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError("SCHEMA_FAILED", "Analysis result did not match schema.");
    }

    throw error;
  }
}

function toApiError(
  error: unknown,
  fallbackCode: "INTERNAL_ERROR" | "MODEL_FAILED",
  fallbackMessage: string,
) {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new ApiError("SCHEMA_FAILED", "Analysis result did not match schema.");
  }

  return new ApiError(fallbackCode, fallbackMessage);
}

async function recordFailureAuditSafely(
  audit: AuditRecorder,
  {
    analysisId,
    planTier,
    reason,
    requestBody,
    user,
  }: {
    analysisId: string;
    planTier: PlanTier;
    reason: string;
    requestBody: AnalyzeRequestBody;
    user: CurrentUser;
  },
) {
  try {
    await audit.record({
      actorId: user.id,
      eventType: "analysis.failed",
      metadata: {
        frameCount: requestBody.frames.length,
        model: requestBody.model,
        planTier,
        reason,
      },
      targetId: analysisId,
      targetType: "analysis",
      workspaceId: requestBody.workspaceId,
    });
  } catch {
    // Preserve the original API error even if failure audit persistence fails.
  }
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
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
