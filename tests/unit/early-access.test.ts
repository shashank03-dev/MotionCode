import { describe, expect, it, vi } from "vitest";

import type { PlanTier } from "@/lib/contracts/plans";

const user = { email: "founder@example.com", id: "user_123" };

describe("early access API", () => {
  it("rejects anonymous requests", async () => {
    const { handleEarlyAccessRequest } = await import("@/lib/server/earlyAccess");

    const response = await handleEarlyAccessRequest(
      new Request("https://motioncode.test/api/early-access", {
        body: JSON.stringify({ desiredPlan: "pro" }),
        method: "POST",
      }),
      {
        getCurrentUser: vi.fn(async () => null),
        upsertSignup: vi.fn(),
      },
    );

    expect(response.status).toBe(401);
  });

  it("records a pro early access request for the current user", async () => {
    const upsertSignup = vi.fn(async () => ({
      desiredPlan: "pro" as Extract<PlanTier, "pro" | "studio">,
      status: "requested" as const,
    }));
    const { handleEarlyAccessRequest } = await import("@/lib/server/earlyAccess");

    const response = await handleEarlyAccessRequest(
      new Request("https://motioncode.test/api/early-access", {
        body: JSON.stringify({ desiredPlan: "pro" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      {
        getCurrentUser: vi.fn(async () => user),
        upsertSignup,
      },
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      data: { desiredPlan: "pro", status: "requested" },
      ok: true,
    });
    expect(upsertSignup).toHaveBeenCalledWith({
      desiredPlan: "pro",
      email: "founder@example.com",
      source: "pricing",
      userId: "user_123",
    });
  });

  it("rejects plans outside Pro and Studio", async () => {
    const { handleEarlyAccessRequest } = await import("@/lib/server/earlyAccess");
    const upsertSignup = vi.fn();

    const response = await handleEarlyAccessRequest(
      new Request("https://motioncode.test/api/early-access", {
        body: JSON.stringify({ desiredPlan: "free" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      {
        getCurrentUser: vi.fn(async () => user),
        upsertSignup,
      },
    );

    expect(response.status).toBe(400);
    expect(upsertSignup).not.toHaveBeenCalled();
  });
});
