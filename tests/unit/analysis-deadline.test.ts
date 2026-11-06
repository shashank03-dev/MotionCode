// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ANALYSIS_TIMEOUT_MS, withAnalysisDeadline } from "@/lib/analysisDeadline";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("ends a stalled operation and aborts the underlying request", async () => {
  let requestSignal: AbortSignal | undefined;
  const result = withAnalysisDeadline((signal) => {
    requestSignal = signal;
    return new Promise(() => {});
  });
  const assertion = expect(result).rejects.toThrow("Analysis took too long");
  await vi.advanceTimersByTimeAsync(ANALYSIS_TIMEOUT_MS);
  await assertion;
  expect(requestSignal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it("preserves explicit cancellation even if the operation never settles", async () => {
  const controller = new AbortController();
  const result = withAnalysisDeadline(() => new Promise(() => {}), controller.signal);
  const assertion = expect(result).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});

it("does not start an already-cancelled operation", async () => {
  const controller = new AbortController();
  controller.abort();
  const operation = vi.fn();
  await expect(withAnalysisDeadline(operation, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(operation).not.toHaveBeenCalled();
});

it("cleans up the deadline after successful analysis", async () => {
  await expect(withAnalysisDeadline(async () => "code")).resolves.toBe("code");
  expect(vi.getTimerCount()).toBe(0);
});

it("preserves server errors and cleans up the deadline", async () => {
  await expect(withAnalysisDeadline(async () => { throw new Error("Model busy"); })).rejects.toThrow("Model busy");
  expect(vi.getTimerCount()).toBe(0);
});
