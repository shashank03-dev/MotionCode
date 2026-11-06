// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeFramesWithGemini } from "@/lib/server/gemini";

const input = { frames: ["jpeg"], model: "gemini-2.5-flash" as const };
const success = () => Response.json({
  candidates: [{ content: { parts: [{ text: JSON.stringify({ intent: "entrance" }) }] } }],
});
const busy = () => Response.json({ error: { message: "high demand" } }, { status: 503 });
const run = (fetcher: typeof fetch, model = input.model as "gemini-2.5-flash" | "gemini-2.5-pro") =>
  analyzeFramesWithGemini({ ...input, model }, { apiKey: "test-key", fetch: fetcher });

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("GEMINI_FLASH_MODEL", "test-flash");
  vi.stubEnv("GEMINI_PRO_MODEL", "test-pro");
  vi.stubEnv("GEMINI_FLASH_FALLBACK_MODEL", "test-lite-backup");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("Gemini transient failures", () => {
  it("recovers from an overloaded model with delayed retries", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(busy()).mockResolvedValueOnce(busy())
      .mockImplementation(async () => success());
    const result = run(fetcher);
    const assertion = expect(result).resolves.toMatchObject({ spec: { intent: "entrance" } });
    await vi.advanceTimersByTimeAsync(999);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops after bounded failures across both lightweight models and returns a temporary-unavailability error", async () => {
    const fetcher = vi.fn(async () => busy());
    const assertion = expect(run(fetcher)).rejects.toMatchObject({
      code: "MODEL_FAILED", status: 503, message: expect.stringContaining("temporarily busy"),
    });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetcher).toHaveBeenCalledTimes(6);
  });

  it.each([400, 401, 403, 404, 429])("does not retry HTTP %s for Flash", async (status) => {
    const fetcher = vi.fn(async () => Response.json({ error: { message: "rejected" } }, { status }));
    await expect(run(fetcher)).rejects.toMatchObject({ code: status === 429 ? "QUOTA_EXCEEDED" : "MODEL_FAILED" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retries a failed network connection", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockImplementation(async () => success());
    const assertion = expect(run(fetcher)).resolves.toHaveProperty("spec");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("aborts stalled requests and bounds primary plus fallback to 90 seconds", async () => {
    const started = Date.now();
    const fetcher = vi.fn((_url: unknown, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true });
    }));
    const assertion = expect(run(fetcher, "gemini-2.5-pro")).rejects.toMatchObject({ code: "MODEL_FAILED", status: 503 });
    await vi.runAllTimersAsync();
    await assertion;
    expect(Date.now() - started).toBeLessThanOrEqual(90_000);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains the Pro-to-Flash fallback after temporary failures", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(busy()).mockResolvedValueOnce(busy())
      .mockResolvedValueOnce(busy()).mockImplementation(async () => success());
    const assertion = expect(run(fetcher, "gemini-2.5-pro")).resolves.toHaveProperty("spec");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      ...Array(3).fill(expect.stringContaining("/test-pro:")), expect.stringContaining("/test-flash:"),
    ]);
  });
});
