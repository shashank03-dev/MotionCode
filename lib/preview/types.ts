import type { OutputFramework } from "@/lib/contracts/motion";

/** A single message surfaced from inside the preview iframe. */
export type ConsoleLevel = "log" | "info" | "warn" | "error";

export type ConsoleEntry = {
  id: number;
  level: ConsoleLevel;
  text: string;
  at: number;
};

/** Messages the iframe posts back to the parent window. */
export type PreviewMessage =
  | { source: "motioncode-preview"; type: "ready"; runId: number }
  | {
      source: "motioncode-preview";
      type: "console";
      level: ConsoleLevel;
      text: string;
      runId: number;
    }
  | {
      source: "motioncode-preview";
      type: "error";
      text: string;
      runId: number;
    };

export type PreviewInput = {
  framework: OutputFramework;
  code: string;
  /** Structured spec used as a fallback harness (duration/easing/etc.). */
  spec: {
    durationMs: number;
    delayMs: number;
    easing: string;
    loops: boolean;
    element: string;
    intent: string;
  };
  /** Monotonic id so the parent can match async messages to a run. */
  runId: number;
};

export function isPreviewMessage(value: unknown): value is PreviewMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as {
    source?: unknown;
    type?: unknown;
    runId?: unknown;
    text?: unknown;
    level?: unknown;
  };
  if (candidate.source !== "motioncode-preview") return false;
  if (
    candidate.type !== "ready" &&
    candidate.type !== "console" &&
    candidate.type !== "error"
  ) {
    return false;
  }
  if (typeof candidate.runId !== "number") return false;
  if ("text" in candidate && candidate.text !== undefined) {
    if (typeof candidate.text !== "string") return false;
  }
  if ("level" in candidate && candidate.level !== undefined) {
    if (
      candidate.level !== "log" &&
      candidate.level !== "info" &&
      candidate.level !== "warn" &&
      candidate.level !== "error"
    ) {
      return false;
    }
  }
  return true;
}
