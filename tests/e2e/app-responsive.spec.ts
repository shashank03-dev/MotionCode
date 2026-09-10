import { test } from "@playwright/test";

import {
  assertAppDiagnostics,
  installAppDiagnostics,
  openInteractiveApp,
} from "./app-test-helpers";

const viewports = [320, 375, 768, 1024, 1440];

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
});

