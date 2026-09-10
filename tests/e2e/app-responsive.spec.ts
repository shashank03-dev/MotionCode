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

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      console.log("[app-baseline] responsive", JSON.stringify({ width, ...metrics }));
    });
  }

  test("stacks the result studio vertically at 375px without pane overlap", async ({
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

    // Below 768px the studio split switches from horizontal to vertical.
    await expect(page.locator('[data-panel-group-direction="vertical"]')).toBeVisible();

    const editorPane = page.getByRole("region", { name: "Generated code editor" });
    const previewPane = page.getByRole("region", { name: "Live preview" });
    await expect(editorPane).toBeVisible();
    await expect(previewPane).toBeVisible();

    const overlap = await page.evaluate(() => {
      const editor = document.querySelector('section[aria-label="Generated code editor"]');
      const preview = document.querySelector('section[aria-label="Live preview"]');
      if (!(editor instanceof HTMLElement) || !(preview instanceof HTMLElement)) {
        return "missing-pane";
      }
      const a = editor.getBoundingClientRect();
      const b = preview.getBoundingClientRect();
      const horizontalOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const verticalOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return horizontalOverlap > 1 && verticalOverlap > 1
        ? `overlap ${horizontalOverlap}x${verticalOverlap}`
        : "no-overlap";
    });
    expect(overlap).toBe("no-overlap");

    await assertAppDiagnostics(page, diagnostics);
  });
});

