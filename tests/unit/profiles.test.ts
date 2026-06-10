import { describe, expect, it, vi } from "vitest";

import { ensureProfileForUser } from "@/lib/server/profiles";

describe("ensureProfileForUser", () => {
  it("inserts required profile fields and syncs available provider metadata", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const client = {
      from: vi.fn(() => ({ upsert })),
    };

    await ensureProfileForUser(
      {
        email: "founder@example.com",
        id: "user_123",
        user_metadata: {
          avatar_url: "https://example.com/avatar.png",
          full_name: "Founder",
        },
      } as never,
      client as never,
    );

    expect(client.from).toHaveBeenCalledWith("profiles");
    expect(upsert).toHaveBeenCalledWith(
      {
        avatar_url: "https://example.com/avatar.png",
        display_name: "Founder",
        email: "founder@example.com",
        id: "user_123",
      },
      { onConflict: "id" },
    );
  });

  it("preserves existing optional profile fields when metadata is absent", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const client = {
      from: vi.fn(() => ({ upsert })),
    };

    await ensureProfileForUser(
      {
        email: "founder@example.com",
        id: "user_123",
        user_metadata: {},
      } as never,
      client as never,
    );

    expect(upsert).toHaveBeenCalledWith(
      {
        email: "founder@example.com",
        id: "user_123",
      },
      { onConflict: "id" },
    );
  });
});
