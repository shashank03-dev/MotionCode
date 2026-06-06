import { describe, expect, it, vi } from "vitest";

import { hashAnalyticsIdentifier } from "@/lib/server/analytics";
import {
  observeAnalysis,
  observeAuthError,
  observeBillingWebhook,
  observeShareAccess,
} from "@/lib/server/observability";

describe("server observability hooks", () => {
  it("records analysis lifecycle events with hashed identities", async () => {
    const analyticsSink = vi.fn();
    const logSink = vi.fn();

    await observeAnalysis(
      {
        analysisId: "analysis_123",
        frameCount: 2,
        model: "gemini-2.5-flash",
        outcome: "completed",
        planTier: "pro",
        projectId: "project_123",
        userId: "user_123",
        workspaceId: "workspace_123",
      },
      { analyticsSink, logSink },
    );

    expect(analyticsSink).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "analysis.completed",
        projectHash: hashAnalyticsIdentifier("project_123"),
        userHash: hashAnalyticsIdentifier("user_123"),
      }),
    );
    expect(logSink).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "analysis.completed",
        level: "info",
        projectId: "project_123",
        userId: "user_123",
      }),
    );
  });

  it("records billing webhooks, auth errors, and share access without raw tokens", async () => {
    const analyticsSink = vi.fn();
    const logSink = vi.fn();
    const options = { analyticsSink, logSink };

    await observeBillingWebhook(
      {
        eventId: "evt_123",
        stripeEventType: "customer.subscription.updated",
        outcome: "processed",
        userId: "user_123",
      },
      options,
    );
    await observeAuthError(
      {
        action: "callback",
        reason: "exchange_failed",
        route: "/auth/callback",
      },
      options,
    );
    await observeShareAccess(
      {
        outcome: "not_found",
        token: "raw-share-token",
      },
      options,
    );

    const analyticsPayload = JSON.stringify(analyticsSink.mock.calls);
    const logPayload = JSON.stringify(logSink.mock.calls);

    expect(analyticsPayload).toContain("billing.webhook.processed");
    expect(analyticsPayload).toContain("auth.error");
    expect(analyticsPayload).toContain("share.access.not_found");
    expect(analyticsPayload).not.toContain("raw-share-token");
    expect(logPayload).not.toContain("raw-share-token");
  });
});
