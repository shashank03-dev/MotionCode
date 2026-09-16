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
  test("landing renders its hero heading without overflow at 360px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Motion,");
    await expect(hero).toContainText("decoded.");
    await assertNoHorizontalOverflow(page, "/ @360");
  });

  test("landing renders its hero heading without overflow at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Motion,");
    await expect(hero).toContainText("decoded.");
    await assertNoHorizontalOverflow(page, "/ @390");
  });

  test("landing renders its hero heading without overflow at 768px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Motion,");
    await expect(hero).toContainText("decoded.");
    await assertNoHorizontalOverflow(page, "/ @768");
  });

  test("landing footer Pricing link meets 44px touch target at 360px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");
    const pricingLink = page.locator("footer").getByRole("link", {
      name: "Pricing",
    });
    await expect(pricingLink.first()).toBeVisible();
    await expect(async () => {
      const boxes = await pricingLink.evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
      expect(boxes.length).toBeGreaterThan(0);
      for (const height of boxes) {
        expect(height).toBeGreaterThanOrEqual(44);
      }
    }).toPass({ timeout: 5000, intervals: [250, 500, 1000] });
  });

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
