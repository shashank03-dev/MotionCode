import { describe, expect, it, vi } from "vitest";

import {
  generateShareToken,
  isWellFormedShareToken,
  resolveSharedProjectByToken,
} from "@/lib/server/shareLinks";

describe("share token validation", () => {
  it("accepts every token we generate", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(isWellFormedShareToken(generateShareToken())).toBe(true);
    }
  });

  it("rejects tokens we could never have issued", () => {
    expect(isWellFormedShareToken("definitely-not-a-real-token")).toBe(false);
    expect(isWellFormedShareToken("a".repeat(42))).toBe(false);
    expect(isWellFormedShareToken(`${"a".repeat(42)}=`)).toBe(false);
  });

  it("resolves malformed tokens to not-found without querying the database", async () => {
    const from = vi.fn(() => {
      throw new Error("database should not be queried");
    });
    await expect(
      resolveSharedProjectByToken("definitely-not-a-real-token", {
        client: { from } as never,
      }),
    ).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
});
