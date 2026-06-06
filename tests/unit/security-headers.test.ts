import { describe, expect, it } from "vitest";

import nextConfig, {
  buildContentSecurityPolicy,
  securityHeaders,
} from "@/next.config.mjs";

describe("Next.js security headers", () => {
  it("configures security headers for every route", async () => {
    const headersConfig = nextConfig.headers;

    expect(typeof headersConfig).toBe("function");
    if (!headersConfig) {
      throw new Error("Expected Next config headers function.");
    }

    const headers = await headersConfig();

    expect(headers).toEqual([
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]);
    expect(headerValue("X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerValue("X-Frame-Options")).toBe("DENY");
    expect(headerValue("Permissions-Policy")).toContain("camera=()");
  });

  it("keeps CSP compatible with Supabase and Stripe without exposing Gemini", () => {
    const csp = buildContentSecurityPolicy("https://motioncode.supabase.co");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://motioncode.supabase.co");
    expect(csp).toContain("wss://motioncode.supabase.co");
    expect(csp).toContain("https://js.stripe.com");
    expect(csp).not.toMatch(/gemini|generativelanguage/i);
  });
});

function headerValue(key: string) {
  return securityHeaders.find((header) => header.key === key)?.value;
}
