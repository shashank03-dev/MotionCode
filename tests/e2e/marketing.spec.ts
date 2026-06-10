import { expect, test } from "@playwright/test";

test.describe("marketing surface", () => {
  test("landing renders the March marketing surface with in-page pricing", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.locator("nav").first();
    const initialNavBox = await nav.boundingBox();
    const navClassName = await nav.getAttribute("class");
    expect(navClassName).toContain("motioncode-march-nav");
    expect(navClassName).toMatch(/\brounded-/);
    expect(navClassName).toMatch(/\bbackdrop-blur/);

    const navChrome = await nav.evaluate((node) => {
      const styles = getComputedStyle(node);
      const radiusValues = styles.borderRadius
        .match(/[\d.]+px/g)
        ?.map((value) => Number.parseFloat(value)) ?? [0];

      return {
        backdropFilter: styles.backdropFilter,
        borderRadius: Math.max(...radiusValues),
      };
    });

    expect(navChrome.borderRadius).toBeGreaterThanOrEqual(24);
    expect(navChrome.backdropFilter).toMatch(/blur\((?!0px)/);

    await expect(
      nav.getByRole("link", { name: /^Features$/i }),
    ).toHaveAttribute("href", "#features");
    await expect(
      nav.getByRole("link", { name: /^How it Works$/i }),
    ).toHaveAttribute("href", "#how-it-works");
    await expect(
      nav.getByRole("link", { name: /^Pricing$/i }),
    ).toHaveAttribute("href", "#pricing");
    await expect(
      nav.getByRole("link", { name: /Try Free/i }),
    ).toHaveAttribute("href", "/app");
    await expect(page.locator('a[href="/examples"]')).toHaveCount(0);

    const hero = page.locator("section").first();

    await expect(
      hero.getByText("Turn any animation", { exact: true }),
    ).toBeVisible();
    await expect(
      hero.getByText("into production", { exact: true }),
    ).toBeVisible();
    await expect(hero.getByText("code.", { exact: true })).toBeVisible();
    await expect(page.getByText("TRUSTED BY DEVELOPERS AT")).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Start for free/i }),
    ).toHaveAttribute("href", "/app");
    await expect(
      page.getByRole("link", { name: /See it work/i }),
    ).toHaveAttribute("href", "#features");
    await expect(
      page.getByRole("link", { name: /Launch Converter/i }),
    ).toHaveAttribute("href", "/app");

    await expect(
      page.locator("#features").getByText("Everything you need to ship motion."),
    ).toBeVisible();
    await expect(
      page
        .locator("#how-it-works")
        .getByText("Three steps to production-ready code"),
    ).toBeVisible();

    const pricing = page.locator("#pricing");
    await expect(
      pricing.getByRole("heading", { name: /Pricing built for motion teams/i }),
    ).toBeVisible();
    await expect(pricing.getByRole("heading", { name: /^Preview$/i })).toBeVisible();
    await expect(pricing.getByRole("heading", { name: /^Pro$/i })).toBeVisible();
    await expect(pricing.getByRole("heading", { name: /^Studio$/i })).toBeVisible();
    await expect(pricing.getByTestId("price-preview")).toContainText("₹0");
    await expect(pricing.getByTestId("price-pro")).toContainText("₹100");
    await expect(pricing.getByTestId("price-studio")).toContainText("₹500");
    await expect(pricing.getByTestId("price-pro")).toHaveCSS(
      "animation-name",
      /price/i,
    );
    await expect(pricing.getByText("Priority analysis queue")).toBeVisible();
    await expect(pricing.getByText("Team workspaces")).toBeVisible();
    await expect(
      pricing.getByRole("button", { name: /Pay with Razorpay/i }).first(),
    ).toBeVisible();

    const proCard = pricing.getByTestId("pricing-card-pro");
    await proCard.hover();
    await expect(proCard).toHaveAttribute("data-hovered", "true");

    const finalCta = page.getByTestId("final-cta");
    await expect(finalCta.getByRole("heading", { name: /Start converting/i })).toBeVisible();

    const scrolledNavBox = await nav.boundingBox();
    expect(initialNavBox).not.toBeNull();
    expect(scrolledNavBox).not.toBeNull();
    expect(
      Math.abs((scrolledNavBox?.height ?? 0) - (initialNavBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);

    const sectionOrder = await page.evaluate(() => {
      const pricingTop = document.querySelector("#pricing")?.getBoundingClientRect().top ?? 0;
      const ctaTop = document.querySelector('[data-testid="final-cta"]')?.getBoundingClientRect().top ?? 0;
      return pricingTop < ctaTop;
    });
    expect(sectionOrder).toBe(true);
  });

  test("landing uses real partner logos and readable footer links", async ({
    page,
  }) => {
    await page.goto("/");

    const logoStrip = page.getByTestId("logo-strip");
    const marquee = logoStrip.locator(".motioncode-logo-marquee");
    const logos = logoStrip.locator("img");
    expect(await logos.count()).toBeGreaterThanOrEqual(8);
    await expect(marquee).toHaveCSS("animation-play-state", "running");

    for (const brand of [
      "Vercel",
      "Razorpay",
      "Linear",
      "Figma",
      "Notion",
      "Loom",
      "Raycast",
      "Resend",
    ]) {
      const logo = logoStrip.getByRole("img", { name: `${brand} logo` }).first();
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute("src", /cdn\.simpleicons\.org/);
    }

    await logoStrip.hover();
    await expect(marquee).toHaveCSS("animation-play-state", "paused");

    const footer = page.locator("footer");
    await expect(footer.getByText("MotionCode").first()).toBeVisible();
    await expect(footer.getByText("Intelligence for motion.")).toBeVisible();
    await expect(footer.getByRole("link", { name: /^Pricing$/i })).toHaveCSS(
      "color",
      "rgb(216, 207, 188)",
    );
    await expect(footer.getByRole("link", { name: /GitHub/i })).toHaveCSS(
      "color",
      "rgb(216, 207, 188)",
    );
    await expect(
      footer.getByText("© 2026 MotionCode. All rights reserved."),
    ).toHaveCSS("color", "rgb(255, 251, 244)");
  });

  test("support, privacy, and terms routes render and examples is removed", async ({ page }) => {
    const routes = [
      { path: "/support", heading: /Sign in required/i },
      { path: "/privacy", heading: /^Privacy$/i },
      { path: "/terms", heading: /^Terms$/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
    }

    await page.goto("/examples");
    await expect(
      page.getByRole("heading", { name: /This page is not available/i }),
    ).toBeVisible();
  });

  test("landing hero includes an interactive motion lab preview", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const glowMetrics = await page.getByTestId("hero-mouse-glow").evaluate((node) => {
      const styles = getComputedStyle(node);
      const width = Number.parseFloat(styles.width);
      const height = Number.parseFloat(styles.height);

      return { height, width };
    });
    expect(Math.max(glowMetrics.width, glowMetrics.height)).toBeLessThanOrEqual(
      420,
    );

    const heroSignalChip = page.locator(".hero-signal-chip").first();
    await expect(heroSignalChip).toBeVisible();
    await expect(heroSignalChip).toContainText(/motion intelligence platform/i);

    const chipReadability = await heroSignalChip.evaluate((node) => {
      const styles = getComputedStyle(node);
      const colorParts =
        styles.color
          .match(/rgba?\(([^)]+)\)/)?.[1]
          .split(",")
          .map((value) => Number.parseFloat(value.trim())) ?? [];

      return {
        colorAlpha: colorParts[3] ?? 1,
        filter: styles.filter,
        fontSize: Number.parseFloat(styles.fontSize),
        opacity: Number.parseFloat(styles.opacity),
      };
    });
    expect(chipReadability.colorAlpha).toBeGreaterThanOrEqual(0.9);
    expect(chipReadability.filter).not.toContain("blur");
    expect(chipReadability.fontSize).toBeGreaterThanOrEqual(12);
    expect(chipReadability.opacity).toBeGreaterThanOrEqual(0.9);

    const preview = page.getByTestId("motion-lab-preview");

    await expect(preview).toBeVisible();
    await expect(preview.getByText("frame sampler")).toBeVisible();
    await expect(preview.getByText("curve solver")).toBeVisible();
    await expect(preview.getByText("export stack")).toBeVisible();
    await expect(preview.getByText("morph vector")).toBeVisible();

    const beforeTransform = await preview.evaluate(
      (node) => getComputedStyle(node).transform,
    );

    await preview.hover();

    await expect(preview).toHaveAttribute("data-hovered", "true");
    await expect(preview).toHaveCSS("border-color", "rgba(216, 207, 188, 0.42)");

    await expect
      .poll(
        () => preview.evaluate((node) => getComputedStyle(node).transform),
        { message: "motion lab preview should move on hover" },
      )
      .not.toBe(beforeTransform);

    const panelBoxes = await Promise.all(
      ["motion-lab-sampler", "motion-lab-curve", "motion-lab-export"].map(
        async (testId) => {
          const box = await page.getByTestId(testId).boundingBox();
          expect(box).not.toBeNull();
          return box!;
        },
      ),
    );
    const overlaps = (
      a: NonNullable<Awaited<ReturnType<typeof preview.boundingBox>>>,
      b: NonNullable<Awaited<ReturnType<typeof preview.boundingBox>>>,
    ) =>
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;
    expect(overlaps(panelBoxes[0], panelBoxes[1])).toBe(false);
    expect(overlaps(panelBoxes[0], panelBoxes[2])).toBe(false);
    expect(overlaps(panelBoxes[1], panelBoxes[2])).toBe(false);
  });

  test("feature cards stay active, interactive, and readable", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.getByTestId("feature-card");
    await expect(cards).toHaveCount(5);
    await expect(cards.first()).toHaveAttribute("data-active", "true");
    await expect(cards.first()).toHaveCSS("border-radius", "10px");
    await expect(
      cards.first().locator(".motioncode-feature-card-title"),
    ).toHaveCSS("font-weight", "700");

    await cards.nth(1).scrollIntoViewIfNeeded();
    await cards.nth(1).hover();
    const hoverTransform = await cards.nth(1).evaluate(
      (node) => getComputedStyle(node).transform,
    );
    expect(hoverTransform).not.toBe("none");

    const snippet = page.getByTestId("feature-code-snippet").first();
    await expect(snippet).toHaveCSS("color", "rgb(255, 251, 244)");
    await expect(snippet).toHaveCSS("animation-name", /terminal/i);
  });
});
