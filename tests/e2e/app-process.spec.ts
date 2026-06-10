import { expect, type Page, type Request, type Route, test } from "@playwright/test";

const tinyGif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

const analysisResult = {
  assetId: "asset_e2e",
  createdAt: "2026-06-10T00:00:00.000Z",
  frameCount: 1,
  id: "analysis_e2e",
  model: "gemini-2.5-flash",
  outputs: [
    {
      code: ".motion-target { opacity: 1; transform: translateY(0); }",
      dependencies: [],
      framework: "css",
      setupNotes: ["Attach the class to the animated element."],
      warnings: [],
    },
    {
      code: "gsap.to('.motion-target', { y: 0, opacity: 1, duration: 0.48 });",
      dependencies: ["gsap"],
      framework: "gsap",
      setupNotes: [],
      warnings: [],
    },
    {
      code: "const variants = { visible: { y: 0, opacity: 1 } };",
      dependencies: ["framer-motion"],
      framework: "framer-motion",
      setupNotes: [],
      warnings: [],
    },
    {
      code: "useSpring({ y: 0, opacity: 1 });",
      dependencies: ["@react-spring/web"],
      framework: "react-spring",
      setupNotes: [],
      warnings: [],
    },
  ],
  projectId: "project_e2e",
  spec: {
    accessibilityNote: "Respect reduced motion and avoid transform loops.",
    delayMs: 0,
    description: "The element enters with a short upward settle.",
    durationMs: 480,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    element: "motion target",
    gpuAccelerated: true,
    implementationNotes: ["Prefer transform and opacity."],
    intent: "entrance",
    keyframesDetected: 3,
    loops: false,
    performanceScore: 94,
  },
  versionId: "version_e2e",
};

const quotaErrorMessage =
  "Daily limit reached. Upgrade with Razorpay for higher capacity.";

test.describe("application processing states", () => {
  test("shows the processing visualizer during analysis and then renders results", async ({
    page,
  }) => {
    const releaseAnalyze = createDeferred();

    await page.route("**/api/analyze", async (route) => {
      await releaseAnalyze.promise;
      await fulfillJson(route, 200, { data: analysisResult, ok: true });
    });

    await page.goto("/app");
    await uploadTinyGif(page, "tiny-motion.gif");

    await expect(page.getByRole("button", { name: /^Analyze$/ })).toBeEnabled();

    const requestPromise = page.waitForRequest(isAnalyzeRequest);
    const responsePromise = page.waitForResponse(
      (response) => isAnalyzeRequest(response.request()) && response.status() === 200,
    );
    await page.getByRole("button", { name: /^Analyze$/ }).click();

    const analyzeRequest = await requestPromise;
    expectAnalyzeRequest(analyzeRequest);
    await expect(page.getByRole("button", { name: /Analyzing/i })).toBeDisabled();
    await expect(page.getByTestId("process-canvas")).toHaveAttribute(
      "data-stage",
      "analyzing",
    );
    await expectProgressVisualization(page, {
      activeState: "active",
      stage: "analyzing",
      valueRange: [0, 100],
    });
    await expect(page.getByTestId("process-scan-beam")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vector solve" })).toBeVisible();

    releaseAnalyze.resolve();
    await responsePromise;

    await expect(
      page.getByRole("heading", { name: "Motion spec" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Description" }),
    ).toHaveValue("The element enters with a short upward settle.");
    await expect(
      page.getByRole("button", { name: "Copy code" }),
    ).toBeVisible();
    await expect(
      page.getByText("Analysis complete / 1 frames / entrance detected"),
    ).toBeVisible();
  });

  test("surfaces quota failures from the analyze API", async ({ page }) => {
    await page.route("**/api/analyze", async (route) => {
      await fulfillJson(route, 429, {
        code: "RATE_LIMITED",
        message: quotaErrorMessage,
        ok: false,
      });
    });

    await page.goto("/app");
    await uploadTinyGif(page, "quota-motion.gif");

    const requestPromise = page.waitForRequest(isAnalyzeRequest);
    const responsePromise = page.waitForResponse(
      (response) => isAnalyzeRequest(response.request()) && response.status() === 429,
    );
    await page.getByRole("button", { name: /^Analyze$/ }).click();

    const analyzeRequest = await requestPromise;
    expectAnalyzeRequest(analyzeRequest);
    await responsePromise;

    await expect(page.getByTestId("process-canvas")).toHaveAttribute(
      "data-stage",
      "error",
    );
    await expectProgressVisualization(page, {
      activeState: "blocked",
      stage: "error",
      valueRange: [0, 100],
    });
    await expect(page.locator("#right-panel")).toContainText(quotaErrorMessage);
    await expect(page.getByRole("link", { name: /View pricing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Retry analysis/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Motion spec" }),
    ).toHaveCount(0);
  });
});

async function uploadTinyGif(page: Page, name: string) {
  await page
    .getByTestId("upload-dropzone")
    .locator('input[type="file"]')
    .setInputFiles({
      buffer: tinyGif,
      mimeType: "image/gif",
      name,
    });

  await expect(page.getByTestId("frame-strip")).toContainText("1 frame");
}

function isAnalyzeRequest(request: Request) {
  return (
    request.method() === "POST" &&
    new URL(request.url()).pathname === "/api/analyze"
  );
}

function expectAnalyzeRequest(request: Request) {
  const body = request.postDataJSON() as {
    assetId?: string;
    frames?: string[];
    model?: string;
    projectId?: string;
    versionId?: string;
  };

  expect(body.model).toBe("gemini-2.5-flash");
  expect(body.assetId).toEqual(expect.stringMatching(UUID_PATTERN));
  expect(body.projectId).toEqual(expect.stringMatching(UUID_PATTERN));
  expect(body.versionId).toEqual(expect.stringMatching(UUID_PATTERN));
  expect(body.frames).toHaveLength(1);
  expect(body.frames?.[0]).toEqual(expect.any(String));
  expect(body.frames?.[0]?.length).toBeGreaterThan(0);
}

async function fulfillJson(
  route: Route,
  status: number,
  payload: Record<string, unknown>,
) {
  await route.fulfill({
    body: JSON.stringify(payload),
    contentType: "application/json",
    status,
  });
}

async function expectProgressVisualization(
  page: Page,
  {
    activeState,
    stage,
    valueRange,
  }: {
    activeState: "active" | "blocked";
    stage: "analyzing" | "error";
    valueRange: [number, number];
  },
) {
  const canvas = page.getByTestId("process-canvas");
  await expect(canvas).toHaveAttribute("data-stage", stage);

  const progress = canvas.getByRole("progressbar", {
    name: /Process progress \d+ percent/,
  });
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuemin", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "100");

  const valueNow = await progress.getAttribute("aria-valuenow");
  expect(valueNow).toEqual(expect.stringMatching(/^\d+$/));
  expect(Number(valueNow)).toBeGreaterThanOrEqual(valueRange[0]);
  expect(Number(valueNow)).toBeLessThanOrEqual(valueRange[1]);

  const phases = canvas.locator('[aria-label="Processing phases"]');
  await expect(phases).toContainText("Frames");
  await expect(phases).toContainText("Vectors");
  await expect(phases).toContainText("Code lanes");
  await expect(phases).toContainText("A11y audit");
  await expect(phases.locator(`[data-state="${activeState}"]`)).toHaveCount(1);

  await expect(
    canvas.getByRole("meter", { name: /Perf meter \d+ percent/ }),
  ).toBeVisible();
  await expect(
    canvas.getByRole("meter", { name: /A11y meter \d+ percent/ }),
  ).toBeVisible();
}

function createDeferred() {
  let resolve = () => {};
  const promise = new Promise<void>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
