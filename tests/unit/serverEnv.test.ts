import { describe, expect, it } from "vitest";
import { readServerEnv } from "@/lib/server/env";

describe("readServerEnv", () => {
  it("returns the Gemini API key when present", () => {
    expect(readServerEnv({ GEMINI_API_KEY: "test-key" })).toEqual({
      geminiApiKey: "test-key",
    });
  });

  it("trims the Gemini API key", () => {
    expect(readServerEnv({ GEMINI_API_KEY: " test-key " })).toEqual({
      geminiApiKey: "test-key",
    });
  });

  it("rejects missing Gemini API key", () => {
    expect(() => readServerEnv({})).toThrow("GEMINI_API_KEY is required");
  });

  it("rejects a whitespace-only Gemini API key", () => {
    expect(() => readServerEnv({ GEMINI_API_KEY: "   " })).toThrow(
      "GEMINI_API_KEY is required",
    );
  });
});
