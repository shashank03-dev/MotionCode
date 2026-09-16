import { expect, type Page, test } from "@playwright/test";

/**
 * Hamburger contract for the landing Nav (/) and SiteHeader (/pricing).
 *
 * Both headers share the same behavior: trigger toggles aria-expanded,
 * opening focuses the first menu link, Escape refocuses the trigger,
 * backdrop click closes, link click closes, and crossing to >=768px closes
 * via matchMedia. Backdrop lives in a body portal (tabIndex -1) so it is
 * located as a direct body child to disambiguate from the trigger, which
 * also reads "Close menu" while open.
 */

function trigger(page: Page) {
  return page.locator("header button[aria-expanded]");
}

function menu(page: Page) {
  return page.locator("header nav div.glass-card");
}

function backdrop(page: Page) {
  return page.locator("body > button[aria-label='Close menu']");
}

async function expectOpen(page: Page, firstLinkLabel: string) {
  const btn = trigger(page);
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await expect(btn).toHaveAttribute("aria-label", "Open menu");

  await btn.click();

  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(btn).toHaveAttribute("aria-label", "Close menu");
  await expect(backdrop(page)).toBeVisible();
  const panel = menu(page);
  await expect(panel).toBeVisible();
  const firstLink = panel.locator("a").first();
  await expect(firstLink).toContainText(firstLinkLabel);
  await expect(firstLink).toBeFocused();
}

async function expectClosed(page: Page) {
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(menu(page)).toHaveCount(0);
  await expect(backdrop(page)).toHaveCount(0);
}

test.describe("landing hamburger at 360px", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");
    await expect(trigger(page)).toBeVisible();
  });

  test("opens with aria-expanded, backdrop, and first-link focus", async ({
    page,
  }) => {
    await expectOpen(page, "Features");
  });

  test("Escape closes and refocuses the trigger", async ({ page }) => {
    const btn = trigger(page);
    await btn.click();
    await expect(menu(page)).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(menu(page)).toHaveCount(0);
    await expect(btn).toBeFocused();
  });

  test("backdrop click closes the menu", async ({ page }) => {
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();

    await backdrop(page).click();

    await expectClosed(page);
  });

  test("link click closes the menu", async ({ page }) => {
    await trigger(page).click();
    const panel = menu(page);
    await expect(panel).toBeVisible();

    await panel.locator("a").first().click();

    await expectClosed(page);
  });

  test("resize to 768 closes the menu", async ({ page }) => {
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();

    await page.setViewportSize({ width: 768, height: 640 });

    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false", {
      timeout: 5000,
    });
    await expect(menu(page)).toHaveCount(0);
    await expect(backdrop(page)).toHaveCount(0);
  });
});

test.describe("SiteHeader hamburger on /pricing", () => {
  test("opens with the same contract", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: "Access tiers for motion analysis." }),
    ).toBeVisible();

    await expectOpen(page, "Features");
  });
});
