import type { PlanTier } from "@/lib/contracts/plans";

import {
  hashAnalyticsIdentifier,
  trackServerAnalyticsEvent,
  type AnalyticsSink,
} from "./analytics";
import {
  createServerLogger,
  serverLogger,
  type LogSink,
  type ServerLogger,
} from "./logger";

type ObservabilityOptions = {
  analyticsSink?: AnalyticsSink;
  logger?: ServerLogger;
  logSink?: LogSink;
  now?: () => Date;
};

export type AnalysisObservation = {
  analysisId?: string | null;
  frameCount?: number | null;
  model?: string | null;
  outcome: "started" | "completed" | "failed" | "rejected";
  planTier?: PlanTier | null;
  projectId?: string | null;
  reason?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
};

export type BillingWebhookObservation = {
  eventId?: string | null;
  outcome: "processed" | "failed" | "rejected";
  paymentEventType?: string | null;
  reason?: string | null;
  userId?: string | null;
};

export type AuthErrorObservation = {
  action: string;
  reason: string;
  route: string;
  userId?: string | null;
};

export type ShareAccessObservation = {
  outcome: "granted" | "inactive" | "not_found" | "failed";
  projectId?: string | null;
  reason?: string | null;
  token?: string | null;
  tokenHash?: string | null;
  workspaceId?: string | null;
};

export async function observeAnalysis(
  observation: AnalysisObservation,
  options: ObservabilityOptions = {},
) {
  const eventName = `analysis.${observation.outcome}`;
  const logger = resolveLogger(options);

  logger.log(observation.outcome === "completed" ? "info" : "warn", eventName, {
    analysisId: observation.analysisId,
    frameCount: observation.frameCount,
    model: observation.model,
    planTier: observation.planTier,
    projectId: observation.projectId,
    reason: observation.reason,
    userId: observation.userId,
    workspaceId: observation.workspaceId,
  });

  await trackServerAnalyticsEvent(
    {
      name: eventName,
      projectId: observation.projectId,
      properties: {
        analysisId: observation.analysisId,
        frameCount: observation.frameCount,
        model: observation.model,
        outcome: observation.outcome,
        planTier: observation.planTier,
        reason: observation.reason,
      },
      userId: observation.userId,
      workspaceId: observation.workspaceId,
    },
    {
      now: options.now,
      sink: options.analyticsSink,
    },
  );
}

export async function observeBillingWebhook(
  observation: BillingWebhookObservation,
  options: ObservabilityOptions = {},
) {
  const eventName = `billing.webhook.${observation.outcome}`;
  const logger = resolveLogger(options);

  logger.log(observation.outcome === "processed" ? "info" : "warn", eventName, {
    eventId: observation.eventId,
    paymentEventType: observation.paymentEventType,
    reason: observation.reason,
    userId: observation.userId,
  });

  await trackServerAnalyticsEvent(
    {
      name: eventName,
      properties: {
        eventId: observation.eventId,
        outcome: observation.outcome,
        paymentEventType: observation.paymentEventType,
        reason: observation.reason,
      },
      userId: observation.userId,
    },
    {
      now: options.now,
      sink: options.analyticsSink,
    },
  );
}

export async function observeAuthError(
  observation: AuthErrorObservation,
  options: ObservabilityOptions = {},
) {
  const eventName = "auth.error";
  const logger = resolveLogger(options);

  logger.warn(eventName, {
    action: observation.action,
    reason: observation.reason,
    route: observation.route,
    userId: observation.userId,
  });

  await trackServerAnalyticsEvent(
    {
      name: eventName,
      properties: {
        action: observation.action,
        reason: observation.reason,
        route: observation.route,
      },
      userId: observation.userId,
    },
    {
      now: options.now,
      sink: options.analyticsSink,
    },
  );
}

export async function observeShareAccess(
  observation: ShareAccessObservation,
  options: ObservabilityOptions = {},
) {
  const eventName = `share.access.${observation.outcome}`;
  const logger = resolveLogger(options);
  const shareTokenHash =
    observation.tokenHash ??
    (observation.token ? hashAnalyticsIdentifier(observation.token) : undefined);

  logger.log(observation.outcome === "granted" ? "info" : "warn", eventName, {
    projectId: observation.projectId,
    reason: observation.reason,
    shareTokenHash,
    workspaceId: observation.workspaceId,
  });

  await trackServerAnalyticsEvent(
    {
      name: eventName,
      projectId: observation.projectId,
      properties: {
        outcome: observation.outcome,
        reason: observation.reason,
        shareTokenHash,
      },
      workspaceId: observation.workspaceId,
    },
    {
      now: options.now,
      sink: options.analyticsSink,
    },
  );
}

function resolveLogger(options: ObservabilityOptions) {
  if (options.logger) {
    return options.logger;
  }

  if (options.logSink) {
    return createServerLogger({ now: options.now, sink: options.logSink });
  }

  return serverLogger;
}
