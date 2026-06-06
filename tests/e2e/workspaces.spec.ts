import { expect, test } from "@playwright/test";

test("anonymous visitors are sent to login before opening a workspace", async ({
  page,
}) => {
  await page.goto("/workspaces/22222222-2222-4222-8222-222222222222");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
