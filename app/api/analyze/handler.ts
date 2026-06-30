import { randomUUID } from "node:crypto";

import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import { isOpenAiAnalysisEnabled as getOpenAiAnalysisGate } from "@/lib/contracts/launch";
import {
  PLAN_ENTITLEMENTS,
  type PlanTier,
} from "@/lib/contracts/plans";
import {
  authorizeAnalysisRequestWithSupabase,
  createSupabaseAuditRecorder,
  createSupabaseUsageEventRecorder,
  releaseDailyAnalysisUsageWithSupabase,
  reserveDailyAnalysisUsageWithSupabase,
  type AnalysisAuthorizationDecision,
  type AuditRecorder,
  type DailyAnalysisReleaseInput,
  type DailyAnalysisReservationInput,
  type UsageEventRecorder,
} from "@/lib/server/audit";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { getDefaultAnalyzeAbuseGuard, type AnalyzeAbuseGuard } from "@/lib/server/abuse";
import {
  getEntitlementSummary as getEntitlementSummaryForUser,
  resolvePlanTierForUser,
  type EntitlementSummary,
} from "@/lib/server/entitlements";
import {
  AnalysisResultSchema,
  analyzeFramesWithGemini,
  type GeminiAnalysis,
  type GeminiAnalyzeInput,
} from "@/lib/server/gemini";
import {
  analyzeFramesWithOpenAI,
  DEFAULT_OPENAI_ANALYSIS_MODEL,
  type OpenAIAnalyzeInput,
} from "@/lib/server/openai";
import { observeAnalysis, observeAuthError } from "@/lib/server/observability";
import { getCurrentUser as getSupabaseCurrentUser } from "@/lib/supabase/server";
import type { AnalysisModel } from "@/lib/contracts/motion";

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

type AnalyzeEntitlementSummary = Pick<
  EntitlementSummary,
  "entitlements" | "planTier"
>;
type SavedAnalyzeRequestBody = AnalyzeRequestBody &
  Required<Pick<AnalyzeRequestBody, "assetId" | "projectId" | "versionId">>;

type AnalysisResourceIds = {
  assetId: string;
  projectId: string;
  versionId: string;
};

export type AnalyzeRouteDeps = {
  abuseGuard?: AnalyzeAbuseGuard;
  audit?: AuditRecorder;
  authorizeAnalysisRequest?: (
    user: CurrentUser,
    requestBody: SavedAnalyzeRequestBody,
  ) => Promise<AnalysisAuthorizationDecision>;
  generateAnalysis?: (input: GeminiAnalyzeInput) => Promise<GeminiAnalysis>;
  generateOpenAiAnalysis?: (input: OpenAIAnalyzeInput) => Promise<GeminiAnalysis>;
  getCurrentUser?: () => Promise<CurrentUser | null>;
  getEntitlementSummary?: (
    user: CurrentUser,
  ) => Promise<AnalyzeEntitlementSummary>;
  getPlanTier?: (user: CurrentUser) => Promise<PlanTier>;
  idGenerator?: () => string;
  isOpenAiAnalysisEnabled?: () => boolean;
  now?: () => Date;
  releaseDailyAnalysisUsage?: (
    input: DailyAnalysisReleaseInput,
  ) => Promise<boolean>;
  reserveDailyAnalysisUsage?: (
    input: DailyAnalysisReservationInput,
  ) => Promise<boolean>;
  usage?: UsageEventRecorder;
};

export async function handleAnalyzeRequest(
  request: Request,
  deps: AnalyzeRouteDeps = {},
) {
  const contentLengthDecision = checkContentLength(request);
  if (contentLengthDecision) {
    await observeAnalysis({
      outcome: "rejected",
      reason: "content_length_exceeded",
    });

    return contentLengthDecision;
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    await observeAnalysis({
      outcome: "rejected",
      reason: error instanceof ApiError ? error.code : "invalid_json",
    });

    if (error instanceof ApiError) {
      return apiError(error.code, error.message, { status: error.status });
    }

    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  if (body === null) {
    await observeAnalysis({
      outcome: "rejected",
      reason: "empty_body",
    });

    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const resolvedDeps = resolveAnalyzeDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    await observeAuthError({
      action: "analysis",
      reason: "missing_session",
      route: "/api/analyze",
    });
    await observeAnalysis({
      outcome: "rejected",
      reason: "UNAUTHENTICATED",
    });

    return apiError("UNAUTHENTICATED", "Sign in to analyze motion.");
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    await observeAnalysis({
      outcome: "rejected",
      reason: hasFrameValidationIssue(parsed.error)
        ? "INVALID_MEDIA"
        : "INVALID_REQUEST",
      userId: user.id,
    });

    return apiError(
      hasFrameValidationIssue(parsed.error) ? "INVALID_MEDIA" : "INVALID_REQUEST",
      hasFrameValidationIssue(parsed.error)
        ? "Frames must be base64 encoded JPEG images."
        : "Invalid analyze request.",
    );
  }

  const requestBody = parsed.data;
  const entitlementSummary = await resolvedDeps.getEntitlementSummary(user);
  const { entitlements, planTier } = entitlementSummary;

  if (!entitlements.allowedModels.includes(requestBody.model)) {
    await observeAnalysis({
      model: requestBody.model,
      outcome: "rejected",
      planTier,
      projectId: requestBody.projectId ?? null,
      reason: "BILLING_REQUIRED",
      userId: user.id,
      workspaceId: requestBody.workspaceId ?? null,
    });

    return apiError(
      "BILLING_REQUIRED",
      `${planTier} plan does not include ${requestBody.model}.`,
    );
  }

  const analysisProvider = resolveAnalysisProvider({
    planTier,
    requestBody,
    resolvedDeps,
  });

  const preflight = await runPreflightChecks({
    requestBody,
    resolvedDeps,
    user,
  });
  if (!preflight.ok) {
    await observeAnalysis({
      frameCount: requestBody.frames.length,
      model: analysisProvider.model,
      outcome: "rejected",
      planTier,
      projectId: requestBody.projectId ?? null,
      reason: "preflight_failed",
      userId: user.id,
      workspaceId: requestBody.workspaceId ?? null,
    });

    return preflight.response;
  }

  const canonicalWorkspaceId = preflight.workspaceId;

  const abuseDecision = resolvedDeps.abuseGuard.check({
    entitlements,
    frameCount: requestBody.frames.length,
    payloadBytes: calculateFramePayloadBytes(requestBody.frames),
    userId: user.id,
  });

  if (!abuseDecision.ok) {
    await observeAnalysis({
      frameCount: requestBody.frames.length,
      model: analysisProvider.model,
      outcome: "rejected",
      planTier,
      projectId: requestBody.projectId ?? null,
      reason: abuseDecision.code,
      userId: user.id,
      workspaceId: canonicalWorkspaceId,
    });

    return apiError(
      abuseDecision.code,
      abuseDecision.message,
      retryHeaders(abuseDecision.retryAfterMs),
    );
  }

  const reservation = await reserveAnalysisUsage({
    analysisProvider,
    entitlements,
    planTier,
    requestBody,
    resolvedDeps,
    user,
    workspaceId: canonicalWorkspaceId,
  });
  if (!reservation.ok) {
    return reservation.response;
  }

  const analysisId = resolvedDeps.idGenerator();
  const resourceIds = resolveAnalysisResourceIds(
    requestBody,
    resolvedDeps.idGenerator,
  );
  const createdAt = resolvedDeps.now().toISOString();
  await observeAnalysis({
    analysisId,
    frameCount: requestBody.frames.length,
    model: analysisProvider.model,
    outcome: "started",
    planTier,
    projectId: requestBody.projectId ?? null,
    userId: user.id,
    workspaceId: canonicalWorkspaceId,
  });

  const generatedResult = await runModelAnalysis({
    analysisId,
    analysisProvider,
    createdAt,
    planTier,
    resourceIds,
    requestBody,
    resolvedDeps,
    user,
    workspaceId: canonicalWorkspaceId,
  });

  if (!generatedResult.ok) {
    await releaseReservationSafely(resolvedDeps.releaseDailyAnalysisUsage, {
      since: startOfUtcDay(resolvedDeps.now()),
      userId: user.id,
    });

    return generatedResult.response;
  }

  try {
    await Promise.all([
      resolvedDeps.usage.record({
        eventType: "analysis.completed",
        frameCount: requestBody.frames.length,
        model: analysisProvider.model,
        planTier,
        projectId: requestBody.projectId ?? null,
        userId: user.id,
        workspaceId: canonicalWorkspaceId,
      }),
      resolvedDeps.audit.record({
        actorId: user.id,
        eventType: "analysis.completed",
        metadata: {
          frameCount: requestBody.frames.length,
          model: analysisProvider.model,
          planTier,
          projectId: requestBody.projectId ?? null,
        },
        targetId: analysisId,
        targetType: "analysis",
        workspaceId: canonicalWorkspaceId,
      }),
    ]);
  } catch (error) {
    const persistenceError = toApiError(
      error,
      "INTERNAL_ERROR",
      "Failed to persist analysis usage.",
    );
    await releaseReservationSafely(resolvedDeps.releaseDailyAnalysisUsage, {
      since: startOfUtcDay(resolvedDeps.now()),
      userId: user.id,
    });
    await recordFailureAuditSafely(resolvedDeps.audit, {
      analysisId,
      analysisModel: analysisProvider.model,
      planTier,
      reason: persistenceError.code,
      requestBody,
      user,
      workspaceId: canonicalWorkspaceId,
    });
    await observeAnalysis({
      analysisId,
      frameCount: requestBody.frames.length,
      model: analysisProvider.model,
      outcome: "failed",
      planTier,
      projectId: requestBody.projectId ?? null,
      reason: persistenceError.code,
      userId: user.id,
      workspaceId: canonicalWorkspaceId,
    });

    return apiError(persistenceError.code, persistenceError.message, {
      status: persistenceError.status,
    });
  }

  await observeAnalysis({
    analysisId,
    frameCount: requestBody.frames.length,
    model: analysisProvider.model,
    outcome: "completed",
    planTier,
    projectId: requestBody.projectId ?? null,
    userId: user.id,
    workspaceId: canonicalWorkspaceId,
  });

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
    generateOpenAiAnalysis:
      deps.generateOpenAiAnalysis ?? analyzeFramesWithOpenAI,
    getCurrentUser: deps.getCurrentUser ?? getSupabaseCurrentUser,
    getEntitlementSummary:
      deps.getEntitlementSummary ?? createDefaultEntitlementSummaryResolver(deps),
    getPlanTier: deps.getPlanTier ?? resolvePlanTierForUser,
    idGenerator: deps.idGenerator ?? randomUUID,
    isOpenAiAnalysisEnabled:
      deps.isOpenAiAnalysisEnabled ?? (() => getOpenAiAnalysisGate()),
    now: deps.now ?? (() => new Date()),
    releaseDailyAnalysisUsage:
      deps.releaseDailyAnalysisUsage ?? releaseDailyAnalysisUsageWithSupabase,
    reserveDailyAnalysisUsage:
      deps.reserveDailyAnalysisUsage ?? reserveDailyAnalysisUsageWithSupabase,
    usage: deps.usage ?? createSupabaseUsageEventRecorder(),
  };
}

function createDefaultEntitlementSummaryResolver(deps: AnalyzeRouteDeps) {
  return async (user: CurrentUser): Promise<AnalyzeEntitlementSummary> => {
    if (deps.getPlanTier) {
      const planTier = await deps.getPlanTier(user);
      return {
        entitlements: PLAN_ENTITLEMENTS[planTier],
        planTier,
      };
    }

    const summary = await getEntitlementSummaryForUser(user.id);
    return {
      entitlements: summary.entitlements,
      planTier: summary.planTier,
    };
  };
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

function hasSavedAnalysisResources(
  requestBody: AnalyzeRequestBody,
): requestBody is SavedAnalyzeRequestBody {
  return Boolean(
    requestBody.assetId && requestBody.projectId && requestBody.versionId,
  );
}

function resolveAnalysisResourceIds(
  requestBody: AnalyzeRequestBody,
  idGenerator: () => string,
): AnalysisResourceIds {
  if (hasSavedAnalysisResources(requestBody)) {
    return {
      assetId: requestBody.assetId,
      projectId: requestBody.projectId,
      versionId: requestBody.versionId,
    };
  }

  return {
    assetId: idGenerator(),
    projectId: idGenerator(),
    versionId: idGenerator(),
  };
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
  requestBody,
  resolvedDeps,
  user,
}: {
  requestBody: AnalyzeRequestBody;
  resolvedDeps: ResolvedAnalyzeRouteDeps;
  user: CurrentUser;
}): Promise<
  | { ok: true; workspaceId: string | null }
  | { ok: false; response: Response }
> {
  if (!hasSavedAnalysisResources(requestBody)) {
    return { ok: true, workspaceId: null };
  }

  try {
    const authorization = await resolvedDeps.authorizeAnalysisRequest(
      user,
      requestBody,
    );
    if (!authorization) {
      return {
        ok: false,
        response: apiError(
          "FORBIDDEN",
          "You cannot analyze the submitted project.",
        ),
      };
    }

    return { ok: true, workspaceId: authorization.workspaceId };
  } catch (error) {
    const apiFailure = toApiError(
      error,
      "INTERNAL_ERROR",
      "Analyze request preflight failed.",
    );

    return {
      ok: false,
      response: apiError(apiFailure.code, apiFailure.message, {
        status: apiFailure.status,
      }),
    };
  }
}

async function reserveAnalysisUsage({
  analysisProvider,
  entitlements,
  planTier,
  requestBody,
  resolvedDeps,
  user,
  workspaceId,
}: {
  analysisProvider: ResolvedAnalysisProvider;
  entitlements: (typeof PLAN_ENTITLEMENTS)[PlanTier];
  planTier: PlanTier;
  requestBody: AnalyzeRequestBody;
  resolvedDeps: ResolvedAnalyzeRouteDeps;
  user: CurrentUser;
  workspaceId: string | null;
}): Promise<{ ok: true } | { ok: false; response: Response }> {
  try {
    const reserved = await resolvedDeps.reserveDailyAnalysisUsage({
      dailyLimit: entitlements.dailyAnalyses,
      eventType: "analysis.started",
      frameCount: requestBody.frames.length,
      model: analysisProvider.model,
      planTier,
      projectId: requestBody.projectId ?? null,
      since: startOfUtcDay(resolvedDeps.now()),
      userId: user.id,
      workspaceId,
    });

    if (!reserved) {
      await observeAnalysis({
        frameCount: requestBody.frames.length,
        model: analysisProvider.model,
        outcome: "rejected",
        planTier,
        projectId: requestBody.projectId ?? null,
        reason: "QUOTA_EXCEEDED",
        userId: user.id,
        workspaceId,
      });

      return {
        ok: false,
        response: apiError(
          "QUOTA_EXCEEDED",
          formatDailyAnalysisLimitMessage(entitlements.dailyAnalyses),
        ),
      };
    }

    return { ok: true };
  } catch {
    await observeAnalysis({
      frameCount: requestBody.frames.length,
      model: analysisProvider.model,
      outcome: "failed",
      planTier,
      projectId: requestBody.projectId ?? null,
      reason: "usage_reservation_failed",
      userId: user.id,
      workspaceId,
    });

    return {
      ok: false,
      response: apiError("INTERNAL_ERROR", "Failed to reserve analysis usage."),
    };
  }
}

type ResolvedAnalysisProvider = {
  generate: () => Promise<GeminiAnalysis>;
  model: AnalysisModel;
};

function resolveAnalysisProvider({
  planTier,
  requestBody,
  resolvedDeps,
}: {
  planTier: PlanTier;
  requestBody: AnalyzeRequestBody;
  resolvedDeps: ResolvedAnalyzeRouteDeps;
}): ResolvedAnalysisProvider {
  if (planTier === "free" || !resolvedDeps.isOpenAiAnalysisEnabled()) {
    return {
      generate: () =>
        resolvedDeps.generateAnalysis({
          frames: requestBody.frames,
          model: requestBody.model,
        }),
      model: requestBody.model,
    };
  }

  return {
    generate: () =>
      resolvedDeps.generateOpenAiAnalysis({
        frames: requestBody.frames,
        model: DEFAULT_OPENAI_ANALYSIS_MODEL,
      }),
    model: DEFAULT_OPENAI_ANALYSIS_MODEL,
  };
}

async function runModelAnalysis({
  analysisId,
  analysisProvider,
  createdAt,
  planTier,
  resourceIds,
  requestBody,
  resolvedDeps,
  user,
  workspaceId,
}: {
  analysisId: string;
  analysisProvider: ResolvedAnalysisProvider;
  createdAt: string;
  planTier: PlanTier;
  resourceIds: AnalysisResourceIds;
  requestBody: AnalyzeRequestBody;
  resolvedDeps: ResolvedAnalyzeRouteDeps;
  user: CurrentUser;
  workspaceId: string | null;
}): Promise<
  | { ok: true; result: z.infer<typeof AnalysisResultSchema> }
  | { ok: false; response: Response }
> {
  try {
    const generated = await analysisProvider.generate();
    const result = parseAnalysisResultSchema({
      assetId: resourceIds.assetId,
      createdAt,
      frameCount: requestBody.frames.length,
      id: analysisId,
      model: analysisProvider.model,
      outputs: generated.outputs,
      projectId: resourceIds.projectId,
      spec: generated.spec,
      versionId: resourceIds.versionId,
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
      analysisModel: analysisProvider.model,
      planTier,
      reason: apiFailure.code,
      requestBody,
      user,
      workspaceId,
    });
    await observeAnalysis({
      analysisId,
      frameCount: requestBody.frames.length,
      model: analysisProvider.model,
      outcome: "failed",
      planTier,
      projectId: requestBody.projectId ?? null,
      reason: apiFailure.code,
      userId: user.id,
      workspaceId,
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

async function releaseReservationSafely(
  release: (input: DailyAnalysisReleaseInput) => Promise<boolean>,
  input: DailyAnalysisReleaseInput,
) {
  try {
    await release(input);
  } catch {
    // Best-effort rollback: preserve the original failure response to the
    // caller even if releasing the reserved quota slot fails.
  }
}

async function recordFailureAuditSafely(
  audit: AuditRecorder,
  {
    analysisId,
    analysisModel,
    planTier,
    reason,
    requestBody,
    user,
    workspaceId,
  }: {
    analysisId: string;
    analysisModel: AnalysisModel;
    planTier: PlanTier;
    reason: string;
    requestBody: AnalyzeRequestBody;
    user: CurrentUser;
    workspaceId: string | null;
  },
) {
  try {
    await audit.record({
      actorId: user.id,
      eventType: "analysis.failed",
      metadata: {
        frameCount: requestBody.frames.length,
        model: analysisModel,
        planTier,
        reason,
      },
      targetId: analysisId,
      targetType: "analysis",
      workspaceId,
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

function formatDailyAnalysisLimitMessage(limit: number) {
  const noun = limit === 1 ? "analysis" : "analyses";
  return `Your plan allows ${limit} ${noun} per day.`;
}
