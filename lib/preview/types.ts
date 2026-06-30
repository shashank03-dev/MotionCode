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
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { source?: unknown }).source === "motioncode-preview"
  );
}
