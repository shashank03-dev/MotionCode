import { expect, test } from "@playwright/test";

import {
  assertAppDiagnostics,
  installAppDiagnostics,
  isAnalyzeRequest,
  openInteractiveApp,
  tinyGif,
} from "./app-test-helpers";

const viewports = [320, 375, 768, 1024, 1440];

const analysisResult = {
  assetId: "asset_responsive_e2e",
  createdAt: "2026-06-10T00:00:00.000Z",
  frameCount: 1,
  id: "analysis_responsive_e2e",
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
  projectId: "project_responsive_e2e",
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
  versionId: "version_responsive_e2e",
};

test.describe("application responsive baseline", () => {
  for (const width of viewports) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const diagnostics = installAppDiagnostics(page);

      await openInteractiveApp(page);
      await assertAppDiagnostics(page, diagnostics);

      // Geometry reads go through expect().toPass(): on a cold dev server
      // the first paint can report a transient overflow before styles settle.
      await page.waitForLoadState("networkidle").catch(() => {});
      await expect(async () => {
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
        expect(
          metrics.scrollWidth,
          `horizontal overflow at ${width}px: ${metrics.scrollWidth}px > ${metrics.viewportWidth}px`,
        ).toBeLessThanOrEqual(metrics.viewportWidth);
      }).toPass({ timeout: 5000, intervals: [250, 500, 1000] });
    });
  }

  test("uses code/preview tabs at 375px with inactive pane hidden", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    const diagnostics = installAppDiagnostics(page);
    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        body: JSON.stringify({ data: analysisResult, ok: true }),
        contentType: "application/json",
        status: 200,
      });
    });

    await openInteractiveApp(page);

    const fileInput = page.getByTestId("upload-dropzone").locator('input[type="file"]');
    await fileInput.setInputFiles({
      buffer: tinyGif,
      mimeType: "image/gif",
      name: "responsive-motion.gif",
    });
    await expect(page.getByRole("alertdialog", { name: /won.t be saved/i })).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Continue" }).click();
    await expect(page.getByTestId("frame-strip")).toContainText("1 frame");

    const analyzeRequest = page.waitForRequest(isAnalyzeRequest);
    await page.getByRole("button", { name: /^Analyze$/ }).click();
    await analyzeRequest;

    await expect(page.getByRole("heading", { name: "motion target" })).toBeVisible();

    // Below 768px the studio switches from the resizable split to
    // Code/Preview tabs (AnalyzeStudio isNarrow): both panes stay mounted
    // with the inactive one hidden, so panes cannot overlap by construction.
    // Assert pane visibility first: the region only reports a laid-out box
    // once its tab has rendered.
    const studioView = page.getByRole("tablist", { name: "Studio view" });
    await expect(studioView).toBeVisible();
    const codeTab = studioView.getByRole("tab", { name: "Code" });
    const previewTab = studioView.getByRole("tab", { name: "Preview" });
    await expect(codeTab).toHaveAttribute("aria-selected", "true");

    const editorPane = page.getByRole("region", { name: "Generated code editor" });
    const previewPane = page.getByRole("region", { name: "Live preview" });
    await expect(editorPane).toBeVisible();
    await expect(previewPane).toBeHidden();

    await previewTab.click();
    await expect(previewTab).toHaveAttribute("aria-selected", "true");
    await expect(previewPane).toBeVisible();
    await expect(editorPane).toBeHidden();

    await assertAppDiagnostics(page, diagnostics);
  });
});

