import { createHash } from "node:crypto";

import { serverLogger } from "./logger";

export type AnalyticsProperties = Record<string, unknown>;

export type ServerAnalyticsEvent = {
  name: string;
  occurredAt: string;
  projectHash?: string;
  properties: AnalyticsProperties;
  userHash?: string;
  workspaceHash?: string;
};

export type ServerAnalyticsInput = {
  name: string;
  occurredAt?: Date;
  projectId?: string | null;
  properties?: AnalyticsProperties;
  userId?: string | null;
  workspaceId?: string | null;
};

export type AnalyticsSink = (
  event: ServerAnalyticsEvent,
) => Promise<void> | void;

type AnalyticsOptions = {
  now?: () => Date;
  sink?: AnalyticsSink;
};

const ANALYTICS_SALT = "motioncode-server-analytics-v1";
const SENSITIVE_PROPERTY_PATTERN =
  /authorization|cookie|password|secret|token|api[_-]?key|session|email|phone|raw|base64/i;
const MAX_ANALYTICS_STRING_LENGTH = 300;
const MAX_ANALYTICS_DEPTH = 4;

let warnedAboutDefaultSalt = false;

function resolveAnalyticsSalt() {
  const configured = process.env.ANALYTICS_SALT;
  const isPlaceholder =
    !configured || /placeholder|replace|example/i.test(configured);

  if (isPlaceholder) {
    if (process.env.NODE_ENV === "production" && !warnedAboutDefaultSalt) {
      warnedAboutDefaultSalt = true;
      serverLogger.warn(
        "ANALYTICS_SALT is unset or a placeholder in production; " +
          "identifier hashes are predictable. Set a strong ANALYTICS_SALT.",
      );
    }
    return ANALYTICS_SALT;
  }

  return configured;
}

export function hashAnalyticsIdentifier(
  value: string,
  salt = resolveAnalyticsSalt(),
) {
  return `sha256:${createHash("sha256")
    .update(salt)
    .update(":")
    .update(value)
    .digest("hex")}`;
}

export function createAnalyticsEvent(
  input: ServerAnalyticsInput,
  options: Pick<AnalyticsOptions, "now"> = {},
): ServerAnalyticsEvent {
  const occurredAt = input.occurredAt ?? options.now?.() ?? new Date();

  return {
    name: input.name,
    occurredAt: occurredAt.toISOString(),
    projectHash: input.projectId
      ? hashAnalyticsIdentifier(input.projectId)
      : undefined,
    properties: sanitizeAnalyticsProperties(input.properties ?? {}),
    userHash: input.userId ? hashAnalyticsIdentifier(input.userId) : undefined,
    workspaceHash: input.workspaceId
      ? hashAnalyticsIdentifier(input.workspaceId)
      : undefined,
  };
}

export async function trackServerAnalyticsEvent(
  input: ServerAnalyticsInput,
  options: AnalyticsOptions = {},
) {
  const event = createAnalyticsEvent(input, options);

  try {
    if (options.sink) {
      await options.sink(event);
      return;
    }

    serverLogger.info("analytics.event", event);
  } catch (error) {
    serverLogger.warn("analytics.emit_failed", {
      analyticsEvent: event.name,
      error,
    });
  }
}

export function sanitizeAnalyticsProperties(
  properties: AnalyticsProperties,
): AnalyticsProperties {
  return sanitizeAnalyticsValue(properties, 0, new WeakSet()) as AnalyticsProperties;
}

function sanitizeAnalyticsValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > MAX_ANALYTICS_STRING_LENGTH
      ? `${value.slice(0, MAX_ANALYTICS_STRING_LENGTH)}...`
      : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
    };
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[circular]";
  }

  if (depth >= MAX_ANALYTICS_DEPTH) {
    return "[max-depth]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) =>
      sanitizeAnalyticsValue(entry, depth + 1, seen),
    );
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_PROPERTY_PATTERN.test(key)
        ? "[redacted]"
        : sanitizeAnalyticsValue(entry, depth + 1, seen),
    ]),
  );
}
