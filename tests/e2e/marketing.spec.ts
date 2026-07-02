import { expect, test, type Locator } from "@playwright/test";

// Reads an element's rendered height, retrying until it lays out to a non-null
// box. On a cold dev server a one-shot boundingBox() can momentarily be null.
async function stableHeight(locator: Locator): Promise<number> {
  let height = 0;
  await expect(async () => {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    height = box!.height;
  }).toPass();
  return height;
}

test.describe("marketing surface", () => {
  test("landing renders the March marketing surface with in-page pricing", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
    const navClassName = await nav.getAttribute("class");
    expect(navClassName).toContain("motioncode-march-nav");
    expect(navClassName).toMatch(/\brounded-/);
    expect(navClassName).toMatch(/\bbackdrop-blur/);

    // Retry the computed-style read: on a cold dev server the rounded/backdrop
    // styles can land a beat after first paint, so a one-shot read may see 0.
    await expect(async () => {
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
    }).toPass();

    // Capture the resting nav height only after the glass-nav styling above has
    // resolved; on a cold dev server the first paint can lag, and measuring too
    // early yields a null or partially-styled box.
    const initialNavHeight = await stableHeight(nav);

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
    await expect(
      page.getByText("Fits beside the tools motion teams already use"),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Start for free/i }),
    ).toHaveAttribute("href", "/app");
    await expect(
      page.getByRole("link", { name: /See it work/i }),
    ).toHaveAttribute("href", "#motion-bridge");
    await expect(
      page.getByRole("link", { name: /Launch Converter/i }),
    ).toHaveAttribute("href", "/app");

    await expect(
      page.locator("#features").getByText("Everything one clip becomes"),
    ).toBeVisible();
    await expect(
      page
        .locator("#how-it-works")
        .getByText("From reference clip to reviewable motion code"),
    ).toBeVisible();

    const process = page.locator("#how-it-works");
    const processList = process.getByRole("list", { name: "MotionCode process" });
    await expect(processList).toHaveCSS("display", "grid");
    await expect(process.getByRole("listitem")).toHaveCount(3);
    await expect(
      process.getByRole("heading", { name: "Capture the reference" }),
    ).toBeVisible();
    await expect(
      process.getByRole("heading", { name: "Map the motion" }),
    ).toBeVisible();
    await expect(
      process.getByRole("heading", { name: "Review and export" }),
    ).toBeVisible();
    await expect(process.getByText("duration 640ms")).toBeVisible();
    await expect(process.getByText("Code + fallbacks + notes")).toBeVisible();

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

    const scrolledNavHeight = await stableHeight(nav);
    expect(Math.abs(scrolledNavHeight - initialNavHeight)).toBeLessThanOrEqual(2);

    const sectionOrder = await page.evaluate(() => {
      const pricingTop = document.querySelector("#pricing")?.getBoundingClientRect().top ?? 0;
      const ctaTop = document.querySelector('[data-testid="final-cta"]')?.getBoundingClientRect().top ?? 0;
      return pricingTop < ctaTop;
    });
    expect(sectionOrder).toBe(true);
  });

  test("process section respects reduced motion for decorative effects", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#how-it-works");

    const process = page.locator("#how-it-works");
    await expect(
      process.getByRole("heading", {
        name: "From reference clip to reviewable motion code",
      }),
    ).toBeVisible();

    // toHaveCSS auto-retries, so it tolerates a cold dev server still applying
    // styles on first paint (a one-shot getComputedStyle read can return "").
    await expect(
      process.locator(".motioncode-process-rail span").first(),
    ).toHaveCSS("animation-name", "none");
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

    // Logos are decorative (alt="" aria-hidden) in the redesigned strip, so
    // assert each brand icon is present by its simpleicons CDN source rather
    // than by an accessible name.
    for (const icon of [
      "vercel",
      "razorpay",
      "linear",
      "figma",
      "notion",
      "loom",
      "raycast",
      "resend",
    ]) {
      const logo = logoStrip
        .locator(`img[src*="cdn.simpleicons.org/${icon}/"]`)
        .first();
      await expect(logo).toBeAttached();
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

  test("landing hero renders the ambient motion lab background", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // The hero's GSAP intro is gated on prefers-reduced-motion; with motion on,
    // the glow/chip/panels are still settling when measured, which makes the
    // size and opacity reads flaky. Emulate the reduced-motion state (as the
    // sibling process-rail test does) so the ambient layer is measured settled.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const glow = page.getByTestId("hero-mouse-glow");
    // Retry the size read: the decorative glow is aria-hidden and its clamped
    // width/height can resolve a beat after first paint on a cold dev server,
    // so a one-shot getComputedStyle read may still see an unset dimension.
    await expect(async () => {
      const glowMetrics = await glow.evaluate((node) => {
        const styles = getComputedStyle(node);
        return {
          height: Number.parseFloat(styles.height),
          width: Number.parseFloat(styles.width),
        };
      });
      expect(Number.isFinite(glowMetrics.width)).toBe(true);
      expect(Number.isFinite(glowMetrics.height)).toBe(true);
      expect(
        Math.max(glowMetrics.width, glowMetrics.height),
      ).toBeLessThanOrEqual(420);
    }).toPass();

    const heroSignalChip = page.locator(".hero-signal-chip").first();
    await expect(heroSignalChip).toBeVisible();
    await expect(heroSignalChip).toContainText(/motion intelligence platform/i);

    // Retry: the chip can be re-rendered during hydration, so a one-shot
    // getComputedStyle read may resolve against a transiently detached node.
    await expect(async () => {
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
    }).toPass();

    const preview = page.getByTestId("motion-lab-preview");

    await expect(preview).toBeVisible();
    await expect(preview.getByText("frame sampler")).toBeVisible();
    await expect(preview.getByText("curve solver")).toBeVisible();
    await expect(preview.getByText("export stack")).toBeVisible();
    await expect(preview.getByText("morph vector")).toBeVisible();

    // The motion lab is now an ambient background layer: it sits behind the
    // headline (lower z-index, non-interactive) so the copy stays clickable.
    await expect(async () => {
      const layering = await preview.evaluate((node) => {
        const styles = getComputedStyle(node);
        return {
          pointerEvents: styles.pointerEvents,
          zIndex: Number.parseInt(styles.zIndex, 10),
        };
      });
      expect(layering.pointerEvents).toBe("none");
      expect(layering.zIndex).toBeLessThan(10);
    }).toPass();

    const overlaps = (
      a: NonNullable<Awaited<ReturnType<typeof preview.boundingBox>>>,
      b: NonNullable<Awaited<ReturnType<typeof preview.boundingBox>>>,
    ) =>
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;
    // Retry: panel boxes can read null until the ambient layer finishes laying out.
    await expect(async () => {
      const panelBoxes = await Promise.all(
        ["motion-lab-sampler", "motion-lab-curve", "motion-lab-export"].map(
          async (testId) => {
            const box = await page.getByTestId(testId).boundingBox();
            expect(box).not.toBeNull();
            return box!;
          },
        ),
      );
      expect(overlaps(panelBoxes[0], panelBoxes[1])).toBe(false);
      expect(overlaps(panelBoxes[0], panelBoxes[2])).toBe(false);
      expect(overlaps(panelBoxes[1], panelBoxes[2])).toBe(false);
    }).toPass();
  });

  test("capability timeline renders its cards and live read head", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#features");
    await expect(section).toBeVisible();

    const cards = page.getByTestId("capability-card");
    await expect(cards).toHaveCount(5);

    // The card under the read head is the live one on load.
    await expect(cards.first()).toHaveAttribute("data-active", "true");

    // Titles are bold, readable, and resolve to their real (decoded) text.
    // The DecryptedText effect renders a visually-hidden copy for screen readers
    // plus an aria-hidden animated copy, so the raw text content is duplicated.
    // Assert the accessible name — what a screen reader actually announces — which
    // resolves to the single decoded title once the reveal completes.
    const firstTitle = cards.first().locator("h3");
    await expect(firstTitle).toHaveCSS("font-weight", "700");
    await expect(firstTitle).toHaveAccessibleName("Decode the source");
    // Same DecryptedText dual-copy applies to the last card's title.
    await expect(cards.nth(4).locator("h3")).toHaveAccessibleName(
      "Keep it accessible",
    );
  });
});
