export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogRecord = {
  event: string;
  level: LogLevel;
  timestamp: string;
  [key: string]: unknown;
};

export type LogSink = (record: LogRecord) => void;

export type ServerLogger = {
  debug: (event: string, context?: Record<string, unknown>) => void;
  error: (event: string, context?: Record<string, unknown>) => void;
  info: (event: string, context?: Record<string, unknown>) => void;
  log: (
    level: LogLevel,
    event: string,
    context?: Record<string, unknown>,
  ) => void;
  warn: (event: string, context?: Record<string, unknown>) => void;
};

type LoggerOptions = {
  now?: () => Date;
  sink?: LogSink;
};

const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|password|secret|token|api[_-]?key|session|email|phone|raw[_-]?body|base64/i;
const MAX_STRING_LENGTH = 600;
const MAX_DEPTH = 6;

export function createServerLogger(options: LoggerOptions = {}): ServerLogger {
  const sink = options.sink ?? defaultLogSink;
  const now = options.now ?? (() => new Date());

  function log(
    level: LogLevel,
    event: string,
    context: Record<string, unknown> = {},
  ) {
    sink({
      event,
      level,
      timestamp: now().toISOString(),
      ...sanitizeLogContext(context),
    });
  }

  return {
    debug: (event, context) => log("debug", event, context),
    error: (event, context) => log("error", event, context),
    info: (event, context) => log("info", event, context),
    log,
    warn: (event, context) => log("warn", event, context),
  };
}

export function sanitizeLogContext(
  context: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeLogValue(context, 0, new WeakSet()) as Record<string, unknown>;
}

function sanitizeLogValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncate(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      message: truncate(value.message),
      name: value.name,
      stack: value.stack ? truncate(value.stack, 2_000) : undefined,
    };
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[circular]";
  }

  if (depth >= MAX_DEPTH) {
    return "[max-depth]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? "[redacted]"
        : sanitizeLogValue(entry, depth + 1, seen),
    ]),
  );
}

function truncate(value: string, maxLength = MAX_STRING_LENGTH) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function defaultLogSink(record: LogRecord) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const serialized = JSON.stringify(record);
  if (record.level === "error") {
    console.error(serialized);
    return;
  }

  if (record.level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const serverLogger = createServerLogger();
