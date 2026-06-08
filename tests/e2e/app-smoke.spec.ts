import { expect, test } from "@playwright/test";

test.describe("application smoke", () => {
  test("public routes render and navigation reaches the app shell", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByText("Turn any animation", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("into production", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("code.", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: /Start for free/i }).first().click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 20_000 });
    await expect(page.getByText("</> MotionCode")).toBeVisible();
    await expect(page.getByText("Drop animation here")).toBeVisible();
  });

  test("protected dashboard sends anonymous visitors to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
