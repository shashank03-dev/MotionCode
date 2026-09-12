import { expect, type Page, test } from "@playwright/test";

/**
 * Mobile smoke at 360px (Pixel 7 width).
 *
 * Each route pins the viewport explicitly so the spec means the same thing on
 * every Playwright project (desktop-chromium, pixel-7, iphone-14, ipad-mini).
 * Assertions stay minimal and fast: main heading visible + no horizontal
 * overflow. Geometry reads go through expect().toPass() because a cold dev
 * server can report transient overflow before styles settle.
 */
async function assertNoHorizontalOverflow(page: Page, route: string) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(async () => {
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(
      metrics.scrollWidth,
      `horizontal overflow on ${route}: ${metrics.scrollWidth}px > ${metrics.viewportWidth}px`,
    ).toBeLessThanOrEqual(metrics.viewportWidth);
  }).toPass({ timeout: 5000, intervals: [250, 500, 1000] });
}

test.describe("mobile smoke at 360px", () => {
  test("pricing renders its tier heading without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: "Access tiers for motion analysis." }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page, "/pricing");
  });

  test("support renders its hero heading without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/support");
    await expect(
      page.getByRole("heading", { name: "Account-scoped help for MotionCode." }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page, "/support");
  });

  test("invalid share link renders a not-found heading without overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/share/definitely-not-a-real-token");
    await expect(
      page.getByRole("heading", { name: "Share link not found" }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page, "/share/[token]");
  });

  test("anonymous dashboard redirects to sign-in without overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/, {
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await assertNoHorizontalOverflow(page, "/dashboard -> /login");
  });

  test("anonymous onboarding redirects to sign-in without overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login\?next=%2Fonboarding$/, {
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await assertNoHorizontalOverflow(page, "/onboarding -> /login");
  });
});
