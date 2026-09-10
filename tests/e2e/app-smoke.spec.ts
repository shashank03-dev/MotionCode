import { expect, type Page, test } from "@playwright/test";

import {
  assertAppDiagnostics,
  installAppDiagnostics,
  mockSupabaseBrowserRequests,
} from "./app-test-helpers";

test.describe("application smoke", () => {
  test("anonymous /app shows the auth gate over an inert analyzer", async ({
    page,
  }) => {
    const diagnostics = installAppDiagnostics(page);
    const navigationStart = Date.now();

    await mockSupabaseBrowserRequests(page);
    await page.goto("/app");
    await expect(
      page.getByRole("dialog", { name: /sign in to start/i }),
    ).toBeVisible();
    // The inert presentation wrapper and the analyzer root are distinct
    // elements: the gate overlay sits over `div[inert]`, inside which the
    // shell renders as `#app-root`. Assert both halves, not one selector.
    await expect(page.locator("div[inert]")).toBeVisible();
    await expect(page.locator("#app-root")).toBeVisible();
    const firstVisibleWorkbenchShell = Date.now();
    await assertAppDiagnostics(page, diagnostics);

    console.log(
      "[app-baseline] smoke",
      JSON.stringify({
        navigationStart: 0,
        firstVisibleWorkbenchShell: firstVisibleWorkbenchShell - navigationStart,
        authGateVisible: true,
      }),
    );
  });

  test("public routes render and navigation reaches the app shell", async ({
    page,
  }) => {
    await page.goto("/");

    // Landing hero is a two-line display heading; assert both lines rather
    // than the pre-redesign copy.
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Motion,");
    await expect(hero).toContainText("decoded.");

    await page.getByRole("link", { name: /Start analyzing/i }).first().click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 20_000 });
    // Anonymous /app renders the shell inside div[inert], which removes the
    // subtree from the accessibility tree - so assert the brand h1 and the
    // canvas internals via DOM locators, not getByRole. The gate itself is
    // still verified visible via its dialog role.
    await expect(page.getByRole("dialog", { name: /sign in to start/i })).toBeVisible();
    await expect(page.locator("#app-root h1.sr-only")).toContainText(
      "MotionCode animation converter",
    );
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
    // "Frame sampling" is a phase-context span, not a heading; the idle h2
    // reads "Upload motion to begin". Both live inside the inert shell, so
    // use DOM locators.
    await expect(page.getByTestId("process-canvas").locator("h2")).toContainText(
      "Upload motion to begin",
    );
    await expect(
      page.getByTestId("process-canvas").locator('[aria-label="Current processing context"]'),
    ).toContainText("Frame sampling");
  });

  test("protected dashboard sends anonymous visitors to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/, {
      timeout: 20_000,
    });
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

  const progress = canvas.locator('[role="progressbar"]');
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute("aria-label", /Process progress \d+ percent/);
  await expect(progress).toHaveAttribute("aria-valuemin", String(min));
  await expect(progress).toHaveAttribute("aria-valuemax", String(max));
  await expect(progress).toHaveAttribute("aria-valuenow", String(value));

  const phases = canvas.locator('[aria-label="Processing phases"]');
  await expect(phases).toContainText("Frames");
  await expect(phases).toContainText("Vectors");
  await expect(phases).toContainText("Code lanes");
  await expect(phases).toContainText("A11y audit");
}
