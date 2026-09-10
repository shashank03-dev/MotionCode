import { expect, test } from "@playwright/test";

import {
  assertAppDiagnostics,
  installAppDiagnostics,
  isAnalyzeRequest,
  mockSupabaseBrowserRequests,
  openInteractiveApp,
  tinyGif,
} from "./app-test-helpers";

const analysisResult = {
  assetId: "asset_performance_e2e",
  createdAt: "2026-06-10T00:00:00.000Z",
  frameCount: 1,
  id: "analysis_performance_e2e",
  model: "gemini-2.5-flash",
  outputs: [
    {
      code: ".motion-target { opacity: 1; transform: translateY(0); }",
      dependencies: [],
      framework: "css",
      setupNotes: [],
      warnings: [],
    },
  ],
  projectId: "project_performance_e2e",
  spec: {
    accessibilityNote: "Respect reduced motion.",
    delayMs: 0,
    description: "The element enters with a short upward settle.",
    durationMs: 480,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    element: "motion target",
    gpuAccelerated: true,
    implementationNotes: [],
    intent: "entrance",
    keyframesDetected: 3,
    loops: false,
    performanceScore: 94,
  },
  versionId: "version_performance_e2e",
};

test.describe("application performance baseline", () => {
  test("measures the anonymous auth-gated shell", async ({ page }) => {
    const diagnostics = installAppDiagnostics(page);
    const navigationStart = Date.now();

    await mockSupabaseBrowserRequests(page);
    await page.goto("/app");
    await expect(page.getByRole("dialog", { name: /sign in to start/i })).toBeVisible();
    await expect(page.locator("[inert]#app-root")).toBeVisible();
    const firstVisibleWorkbenchShell = Date.now();
    await assertAppDiagnostics(page, diagnostics);

    console.log(
      "[app-baseline] anonymous",
      JSON.stringify({
        navigationStart: 0,
        firstVisibleWorkbenchShell: firstVisibleWorkbenchShell - navigationStart,
        authGateVisible: true,
        consoleErrors: diagnostics.consoleErrors.length,
        failedRequests: diagnostics.failedRequests.length,
        pageErrors: diagnostics.pageErrors.length,
      }),
    );
  });

  test("measures the mocked upload-to-preview journey", async ({ page }) => {
    const diagnostics = installAppDiagnostics(page);
    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        body: JSON.stringify({ data: analysisResult, ok: true }),
        contentType: "application/json",
        status: 200,
      });
    });

    const navigationStart = Date.now();
    const { firstVisibleWorkbenchShell } = await openInteractiveApp(page);

    const fileInput = page.getByTestId("upload-dropzone").locator('input[type="file"]');
    await fileInput.setInputFiles({
      buffer: tinyGif,
      mimeType: "image/gif",
      name: "performance-motion.gif",
    });
    await expect(page.getByRole("alertdialog", { name: /won.t be saved/i })).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Continue" }).click();
    const uploadSelection = Date.now();

    await expect(page.getByTestId("frame-strip")).toContainText("1 frame");
    const extractionCompletion = Date.now();

    const analyzeRequest = page.waitForRequest(isAnalyzeRequest);
    const analysisStart = Date.now();
    await page.getByRole("button", { name: /^Analyze$/ }).click();
    await analyzeRequest;

    await expect(page.getByRole("heading", { name: "motion target" })).toBeVisible();
    const resultVisibility = Date.now();
    let previewReadiness: number | null = null;
    let previewTimeout: number | null = null;
    try {
      await expect(page.getByText("READY ·", { exact: false })).toBeVisible({
        timeout: 8_000,
      });
      previewReadiness = Date.now() - navigationStart;
    } catch {
      previewTimeout = Date.now() - navigationStart;
    }

    await assertAppDiagnostics(page, diagnostics);
    console.log(
      "[app-baseline] authenticated-style journey",
      JSON.stringify({
        navigationStart: 0,
        firstVisibleWorkbenchShell: firstVisibleWorkbenchShell - navigationStart,
        uploadSelection: uploadSelection - navigationStart,
        extractionCompletion: extractionCompletion - navigationStart,
        analysisStart: analysisStart - navigationStart,
        resultVisibility: resultVisibility - navigationStart,
        previewReadiness,
        previewTimeout,
        consoleErrors: diagnostics.consoleErrors.length,
        failedRequests: diagnostics.failedRequests.length,
        pageErrors: diagnostics.pageErrors.length,
      }),
    );
  });
});
