import { describe, expect, it } from "vitest";
import { publicErrorMessage } from "@/lib/server/errors";

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
