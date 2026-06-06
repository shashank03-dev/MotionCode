import { expect, test } from "@playwright/test";

const unsupportedClaims =
  /Lottie|Puter|FFmpeg|Monaco|react-dropzone|trusted by|trust logo|SOC 2|HIPAA/i;

test.describe("marketing surface", () => {
  test("landing links the public product routes without banned claims", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /MotionCode turns short animation clips/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Open app/i }).first()).toHaveAttribute(
      "href",
      "/app",
    );
    await expect(page.getByRole("link", { name: /Examples/i }).first()).toHaveAttribute(
      "href",
      "/examples",
    );
    await expect(page.getByRole("link", { name: /Pricing/i }).first()).toHaveAttribute(
      "href",
      "/#pricing",
    );
    await expect(page.getByRole("link", { name: /Support/i }).first()).toHaveAttribute(
      "href",
      "/support",
    );
    await expect(page.getByRole("link", { name: /Privacy/i }).first()).toHaveAttribute(
      "href",
      "/privacy",
    );
    await expect(page.getByRole("link", { name: /Terms/i }).first()).toHaveAttribute(
      "href",
      "/terms",
    );

    await expect(page.locator("body")).not.toContainText(unsupportedClaims);
  });

  test("examples, support, privacy, and terms routes render", async ({ page }) => {
    const routes = [
      { path: "/examples", heading: /Sample motion specs and starter code/i },
      { path: "/support", heading: /Get useful details ready/i },
      { path: "/privacy", heading: /^Privacy$/i },
      { path: "/terms", heading: /^Terms$/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await expect(page.locator("body")).not.toContainText(unsupportedClaims);
    }
  });
});
