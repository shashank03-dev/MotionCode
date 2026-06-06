import nextConfig from "../../next.config.mjs";
import { describe, expect, it } from "vitest";

type SecurityHeader = {
  key: string;
  value: string;
};

type HeaderRoute = {
  source: string;
  headers: SecurityHeader[];
};

type HeaderConfig = {
  headers?: () => HeaderRoute[] | Promise<HeaderRoute[]>;
};

async function readGlobalHeaders(): Promise<Map<string, string>> {
  const headers = (nextConfig as HeaderConfig).headers;

  expect(headers).toBeTypeOf("function");

  const routes = await headers!();
  const route = routes.find((entry) => entry.source === "/:path*");

  expect(route).toBeDefined();

  return new Map(route!.headers.map(({ key, value }) => [key, value]));
}

describe("security headers", () => {
  it("sets a Content-Security-Policy baseline", async () => {
    const headers = await readGlobalHeaders();
    const csp = headers.get("Content-Security-Policy");

    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("media-src 'self' blob: data:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("sets a strict referrer policy", async () => {
    const headers = await readGlobalHeaders();

    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("restricts sensitive browser permissions", async () => {
    const headers = await readGlobalHeaders();

    expect(headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self), clipboard-write=(self)",
    );
  });

  it("blocks framing with X-Frame-Options", async () => {
    const headers = await readGlobalHeaders();

    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });
});
