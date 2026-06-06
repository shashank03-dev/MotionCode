import { describe, expect, it } from "vitest";
import { z } from "zod";
import { publicErrorMessage, publicErrorStatus } from "@/lib/server/errors";

describe("publicErrorMessage", () => {
  it("hides missing Gemini API key details", () => {
    expect(publicErrorMessage(new Error("GEMINI_API_KEY is required"))).toBe(
      "Analysis is temporarily unavailable.",
    );
  });

  it("returns the daily limit message", () => {
    expect(publicErrorMessage(new Error("Daily analysis limit exceeded"))).toBe(
      "Daily analysis limit reached.",
    );
  });

  it("returns a safe Gemini provider message", () => {
    expect(publicErrorMessage(new Error("Gemini returned no text response"))).toBe(
      "The analysis provider returned an error. Try again with fewer frames.",
    );
  });

  it("returns the default safe message", () => {
    expect(publicErrorMessage(new Error("Unexpected internal detail"))).toBe(
      "Analysis is temporarily unavailable.",
    );
  });
});

describe("publicErrorStatus", () => {
  it("keeps malformed JSON errors as client errors", () => {
    expect(publicErrorStatus(new SyntaxError("Unexpected token"))).toBe(400);
  });

  it("keeps schema validation errors as client errors", () => {
    const result = z
      .object({ frames: z.array(z.string()) })
      .safeParse({ frames: [1] });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(publicErrorStatus(result.error)).toBe(400);
    }
  });

  it("returns server errors for provider and quota dependency failures", () => {
    expect(publicErrorStatus(new Error("Gemini returned no text response"))).toBe(
      500,
    );
    expect(publicErrorStatus(new Error("Usage quota store unavailable"))).toBe(500);
  });
});
