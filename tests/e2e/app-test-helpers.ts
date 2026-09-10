import { expect, type Page, type Request } from "@playwright/test";

export const tinyGif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

export type AppDiagnostics = {
  consoleErrors: string[];
  failedRequests: string[];
  pageErrors: string[];
};

export function installAppDiagnostics(page: Page): AppDiagnostics {
  const diagnostics: AppDiagnostics = {
    consoleErrors: [],
    failedRequests: [],
    pageErrors: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      diagnostics.consoleErrors.push(message.text());
    }
  });
  page.on("requestfailed", (request) => {
    diagnostics.failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown failure"}`,
    );
  });
  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  return diagnostics;
}

export async function assertAppDiagnostics(
  page: Page,
  diagnostics: AppDiagnostics,
) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(diagnostics.consoleErrors, "browser console errors").toEqual([]);
  expect(diagnostics.failedRequests, "failed requests").toEqual([]);
  expect(diagnostics.pageErrors, "uncaught page errors").toEqual([]);
  expect(
    overflow.scrollWidth,
    `horizontal overflow: ${overflow.scrollWidth}px > ${overflow.viewportWidth}px`,
  ).toBeLessThanOrEqual(overflow.viewportWidth);
}

export async function openInteractiveApp(page: Page) {
  await mockSupabaseBrowserRequests(page);
  await page.goto("/app");
  await expect(page.getByRole("dialog", { name: /sign in to start/i })).toBeVisible();

  // Wait for React hydration before touching the DOM: AppAuthGate's client
  // effect locks body scroll on mount, so a hidden overflow proves effects
  // have run. Operating earlier lets hydration restore everything we remove
  // (the gate comes back and the shell goes inert again).
  await page.waitForFunction(() => document.body.style.overflow === "hidden");

  // The server-rendered anonymous path already contains the same analyzer
  // shell used by the authenticated path. Removing only the gate and its inert
  // presentation lets process tests exercise that shell without signing into a
  // real Supabase account or changing production authentication behavior.
  await page.evaluate(() => {
    document.querySelector('[role="dialog"][aria-labelledby="app-auth-title"]')
      ?.parentElement?.remove();
    const shell = document.querySelector("[inert]");
    shell?.removeAttribute("inert");
    shell?.classList.remove("pointer-events-none", "select-none", "blur-sm");
    document.body.style.overflow = "";
  });

  // The gate must stay gone: if hydration (or a re-render) restores it, every
  // click below would be intercepted by the sign-in overlay.
  await expect(page.getByRole("dialog", { name: /sign in to start/i })).toHaveCount(0);

  await expect(page.getByTestId("upload-dropzone")).toBeVisible();
  const firstVisibleWorkbenchShell = Date.now();
  await expect(page.getByTestId("process-canvas")).toBeVisible();

  return { firstVisibleWorkbenchShell };
}

export async function mockSupabaseBrowserRequests(page: Page) {
  await page.route("**/auth/v1/settings", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ external: { google: false } }),
      contentType: "application/json",
      status: 200,
    });
  });
}

export function isAnalyzeRequest(request: Request) {
  return (
    request.method() === "POST" &&
    new URL(request.url()).pathname === "/api/analyze"
  );
}
