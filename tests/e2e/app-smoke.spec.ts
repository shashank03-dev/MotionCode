import { expect, test } from "@playwright/test";

test("app route renders upload workflow", async ({ page }) => {
  await page.goto("/app");

  await expect(page.getByText("Drop animation here")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze" })).toBeDisabled();
  await expect(page.getByText("3 free analyses remaining today")).toBeVisible();
});

test("pricing route exists", async ({ page }) => {
  await page.goto("/pricing");

  await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
});
