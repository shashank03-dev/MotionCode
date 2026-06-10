import { afterEach, describe, expect, it } from "vitest";

import { canUseForFree, usagesLeft } from "@/lib/rateLimit";

const STORAGE_KEY = "motioncode_usage";

afterEach(() => {
  localStorage.clear();
});

function today() {
  return new Date().toISOString().split("T")[0];
}

describe("client free analysis counter", () => {
  it("uses the public free limit by default", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        count: 1,
        date: today(),
      }),
    );

    expect(canUseForFree()).toBe(false);
    expect(usagesLeft()).toBe(0);
  });

  it("accepts an effective limit for internal beta testers", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        count: 1,
        date: today(),
      }),
    );

    expect(canUseForFree(3)).toBe(true);
    expect(usagesLeft(3)).toBe(2);
  });
});
