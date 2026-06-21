import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_NEXT_PATH,
  getAuthRedirectOrigin,
  loginPathForNext,
  normalizeAuthNextPath,
} from "@/lib/auth/redirects";

describe("auth redirect helpers", () => {
  it("keeps same-site relative paths including query strings", () => {
    expect(normalizeAuthNextPath("/app")).toBe("/app");
    expect(normalizeAuthNextPath("/dashboard")).toBe("/dashboard");
    expect(normalizeAuthNextPath("/workspaces/workspace_123")).toBe(
      "/workspaces/workspace_123",
    );
    expect(normalizeAuthNextPath("/projects/project_123?tab=versions")).toBe(
      "/projects/project_123?tab=versions",
    );
  });

  it("rejects external, protocol-relative, and empty next values", () => {
    expect(normalizeAuthNextPath("https://evil.test/dashboard")).toBe(
      DEFAULT_AUTH_NEXT_PATH,
    );
    expect(normalizeAuthNextPath("//evil.test/dashboard")).toBe(
      DEFAULT_AUTH_NEXT_PATH,
    );
    expect(normalizeAuthNextPath("dashboard")).toBe(DEFAULT_AUTH_NEXT_PATH);
    expect(normalizeAuthNextPath("")).toBe(DEFAULT_AUTH_NEXT_PATH);
    expect(normalizeAuthNextPath(null)).toBe(DEFAULT_AUTH_NEXT_PATH);
  });

  it("rejects paths that collapse into a protocol-relative redirect", () => {
    expect(normalizeAuthNextPath("/..//evil.test")).toBe(DEFAULT_AUTH_NEXT_PATH);
    expect(normalizeAuthNextPath("/./..//evil.test/path")).toBe(
      DEFAULT_AUTH_NEXT_PATH,
    );
    expect(normalizeAuthNextPath("/\\evil.test")).toBe(DEFAULT_AUTH_NEXT_PATH);
  });

  it("omits the next query for the default app destination", () => {
    expect(loginPathForNext("/app")).toBe("/login");
    expect(loginPathForNext(null)).toBe("/login");
  });

  it("preserves non-default protected destinations on the login URL", () => {
    expect(loginPathForNext("/dashboard")).toBe("/login?next=%2Fdashboard");
    expect(loginPathForNext("/workspaces/workspace_123")).toBe(
      "/login?next=%2Fworkspaces%2Fworkspace_123",
    );
  });

  it("prefers localhost origins during local development even with a configured site url", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://motioncode.live";

    expect(getAuthRedirectOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(getAuthRedirectOrigin("http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000",
    );
  });

  it("uses the configured site url for non-local origins", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://motioncode.live";

    expect(getAuthRedirectOrigin("https://preview.motioncode.live")).toBe(
      "https://motioncode.live",
    );
  });
});
