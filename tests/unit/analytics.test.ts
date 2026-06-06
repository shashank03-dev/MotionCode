import { describe, expect, it, vi } from "vitest";

import {
  createAnalyticsEvent,
  hashAnalyticsIdentifier,
  trackServerAnalyticsEvent,
} from "@/lib/server/analytics";

describe("privacy-safe server analytics", () => {
  it("hashes stable identifiers and removes sensitive properties", () => {
    const event = createAnalyticsEvent({
      name: "analysis.completed",
      properties: {
        email: "designer@example.com",
        frameCount: 4,
        model: "gemini-2.5-flash",
        rawToken: "share-token",
      },
      userId: "user_123",
      workspaceId: "workspace_123",
    });

    expect(event.userHash).toBe(hashAnalyticsIdentifier("user_123"));
    expect(event.workspaceHash).toBe(hashAnalyticsIdentifier("workspace_123"));
    expect(JSON.stringify(event)).not.toContain("user_123");
    expect(JSON.stringify(event)).not.toContain("designer@example.com");
    expect(JSON.stringify(event)).not.toContain("share-token");
    expect(event.properties).toEqual({
      email: "[redacted]",
      frameCount: 4,
      model: "gemini-2.5-flash",
      rawToken: "[redacted]",
    });
  });

  it("emits normalized analytics through the provided sink", async () => {
    const sink = vi.fn();

    await trackServerAnalyticsEvent(
      {
        name: "billing.subscription.updated",
        properties: {
          planTier: "pro",
          status: "active",
        },
        userId: "user_123",
      },
      { sink },
    );

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "billing.subscription.updated",
        userHash: hashAnalyticsIdentifier("user_123"),
      }),
    );
  });
});
