import { expect, type Page, test } from "@playwright/test";

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
    await expect(page.getByTestId("upload-dropzone")).toContainText(
      "Drop animation here",
    );
    await expect(page.getByTestId("process-canvas")).toHaveAttribute(
      "data-stage",
      "idle",
    );
    await expectProgressVisualization(page, {
      max: 100,
      min: 0,
      stage: "idle",
      value: 0,
    });
    await expect(
      page.getByRole("heading", { name: "Frame sampling" }),
    ).toBeVisible();
  });

  test("protected dashboard sends anonymous visitors to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});

async function expectProgressVisualization(
  page: Page,
  {
    max,
    min,
    stage,
    value,
  }: { max: number; min: number; stage: string; value: number },
) {
  const canvas = page.getByTestId("process-canvas");
  await expect(canvas).toHaveAttribute("data-stage", stage);

  const progress = canvas.getByRole("progressbar", {
    name: /Process progress \d+ percent/,
  });
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuemin", String(min));
  await expect(progress).toHaveAttribute("aria-valuemax", String(max));
  await expect(progress).toHaveAttribute("aria-valuenow", String(value));

  const phases = canvas.locator('[aria-label="Processing phases"]');
  await expect(phases).toContainText("Frames");
  await expect(phases).toContainText("Vectors");
  await expect(phases).toContainText("Code lanes");
  await expect(phases).toContainText("A11y audit");
}
