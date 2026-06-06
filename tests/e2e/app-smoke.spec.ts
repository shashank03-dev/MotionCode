import { expect, type Page, test } from "@playwright/test";

const onePixelGif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

async function tabToUploadControl(page: Page) {
  const uploadControl = page.getByLabel("Upload animation file");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.keyboard.press("Tab");

    const isFocused = await uploadControl.evaluate(
      (element) => element === document.activeElement,
    );

    if (isFocused) {
      return;
    }
  }
}

test("app route renders upload workflow", async ({ page }) => {
  await page.goto("/app");

  await tabToUploadControl(page);
  await expect(page.getByLabel("Upload animation file")).toBeFocused();
  await expect(page.getByText("Drop animation here")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze" })).toBeDisabled();
  await expect(page.getByText("3 free analyses remaining today")).toBeVisible();
});

test("invalid replacement upload clears stale frames", async ({ page }) => {
  await page.goto("/app");

  const uploadControl = page.getByLabel("Upload animation file");

  await uploadControl.setInputFiles({
    name: "motion.gif",
    mimeType: "image/gif",
    buffer: onePixelGif,
  });

  await expect(page.getByText("EXTRACTED FRAMES (1)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze" })).toBeEnabled();

  await uploadControl.setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not media"),
  });

  await expect(
    page.getByText("Unsupported format. Use MP4, WebM, MOV, or GIF."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze" })).toBeDisabled();
});

test("og image exists", async ({ request }) => {
  const response = await request.get("/og-image.svg");

  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});

test("pricing route exists", async ({ page }) => {
  await page.goto("/pricing");

  await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
});
