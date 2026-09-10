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
  test("landing renders the marketing surface with in-page pricing", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
    const navClassName = await nav.getAttribute("class");
    expect(navClassName).toContain("glass-pill");
    expect(navClassName).toMatch(/\brounded-full\b/);

    // Retry the computed-style read: on a cold dev server the glass styles
    // can land a beat after first paint, so a one-shot read may see 0.
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
      nav.getByRole("link", { name: /^How it works$/i }),
    ).toHaveAttribute("href", "#how");
    await expect(
      nav.getByRole("link", { name: /^Pricing$/i }),
    ).toHaveAttribute("href", "#pricing");
    await expect(
      nav.getByRole("link", { name: /^Support$/i }),
    ).toHaveAttribute("href", "/support");
    await expect(
      nav.getByRole("link", { name: /Start analyzing/i }),
    ).toHaveAttribute("href", "/app");

    const hero = page.locator("section#top");
    const heroHeading = hero.getByRole("heading", { level: 1 });
    await expect(heroHeading).toContainText("Motion,");
    await expect(heroHeading).toContainText("decoded.");
    await expect(
      hero.getByText("Motion reference → production code"),
    ).toBeVisible();
    await expect(hero.getByText(/Drop in a video or GIF/)).toBeVisible();

    await expect(
      hero.getByRole("link", { name: /Analyze a motion/i }),
    ).toHaveAttribute("href", "/app");
    await expect(
      hero.getByRole("link", { name: /See it work/i }),
    ).toHaveAttribute("href", "#playground");

    // Pinned horizontal sequence: only the first beat is in view on load,
    // the rest live offscreen in the 300%-wide track, so assert the first
    // beat visible and the others present.
    const how = page.locator("#how");
    await expect(
      how.getByRole("heading", { name: "Drop a motion reference" }),
    ).toBeVisible();
    await expect(how).toContainText("Frames extracted, motion read");
    await expect(how).toContainText("Spec and code, ready to paste");

    const pricing = page.locator("#pricing");
    await expect(pricing.getByText("Pricing", { exact: true })).toBeVisible();
    await expect(
      pricing.getByRole("heading", { name: /Start free\. Scale when it ships\./ }),
    ).toBeVisible();
    await expect(pricing.getByRole("heading", { name: /^Free$/ })).toBeVisible();
    await expect(pricing.getByRole("heading", { name: /^Pro$/ })).toBeVisible();
    await expect(pricing.getByRole("heading", { name: /^Team$/ })).toBeVisible();
    await expect(pricing.getByText("$0", { exact: true })).toBeVisible();
    await expect(pricing.getByText("$18", { exact: true })).toBeVisible();
    await expect(pricing.getByText("$49", { exact: true })).toBeVisible();
    await expect(pricing.getByText("Most popular")).toBeVisible();
    await expect(pricing.getByText("Easing curve editor")).toBeVisible();
    await expect(pricing.getByRole("link", { name: /^Go Pro$/i })).toBeVisible();
    await expect(pricing.getByRole("link", { name: /^Go Team$/i })).toBeVisible();

    // CTA eyebrow is a mono label (span), not a heading: the section's
    // real h2 is "Ship motion with confidence." (see components/site/cta.tsx).
    await expect(page.getByText("Ready when you are", { exact: true })).toBeVisible();
    const ctaHeading = page.getByRole("heading", {
      name: /Ship motion with confidence/i,
    });
    await expect(ctaHeading).toBeVisible();

    const scrolledNavHeight = await stableHeight(nav);
    expect(Math.abs(scrolledNavHeight - initialNavHeight)).toBeLessThanOrEqual(2);

    const sectionOrder = await page.evaluate(() => {
      const pricingTop = document.querySelector("#pricing")?.getBoundingClientRect().top ?? 0;
      const headings = [...document.querySelectorAll("h2")];
      const cta = headings.find((h) => /Ship motion with confidence/i.test(h.textContent ?? ""));
      return pricingTop < (cta?.getBoundingClientRect().top ?? 0);
    });
    expect(sectionOrder).toBe(true);
  });

  test("process section respects reduced motion for decorative effects", async ({
    page,
  }) => {
    // Reduced-motion and small-screen users get the stacked fallback instead
    // of the pinned horizontal scroll-jack: the same three steps laid out
    // statically, with no scroll-driven transforms.
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#how");

    const fallback = page.locator("section", {
      has: page.getByRole("heading", { name: "From reference to shipped" }),
    });
    await expect(fallback).toBeVisible();
    await expect(
      fallback.getByRole("heading", { name: "From reference to shipped" }),
    ).toBeVisible();
    for (const title of [
      "Drop a motion reference",
      "Frames extracted, motion read",
      "Spec and code, ready to paste",
    ]) {
      await expect(
        fallback.getByRole("heading", { name: title }),
      ).toBeVisible();
    }
    for (const kicker of ["01 — Reference", "02 — Analyze", "03 — Ship"]) {
      await expect(fallback.getByText(kicker, { exact: true })).toBeVisible();
    }
  });

  test("landing uses real partner logos and readable footer links", async ({
    page,
  }) => {
    await page.goto("/");

    // Credibility strip: a caption plus a marquee of role marks (each mark
    // rendered twice for a seamless loop).
    const strip = page.locator("section", {
      hasText: "Built for the people who ship motion",
    });
    await expect(strip).toBeVisible();
    for (const mark of [
      "PRODUCT DESIGN",
      "DESIGN ENGINEERING",
      "MOTION SYSTEMS",
      "DESIGN SYSTEMS",
      "FRONTEND PLATFORM",
      "CREATIVE DEV",
    ]) {
      await expect(strip.getByText(mark, { exact: true }).first()).toBeVisible();
    }

    const marquee = strip.locator(".animate-marquee").first();
    await expect(marquee).toHaveCSS("animation-play-state", "running");

    // Hover the static outer track (not the moving content): group-hover
    // pauses the animation, and the outer box doesn't move under the cursor.
    await strip.locator(".group").first().hover();
    await expect(marquee).toHaveCSS("animation-play-state", "paused");

    const footer = page.locator("footer");
    await expect(
      footer.getByText(/From motion reference to production animation code/),
    ).toBeVisible();
    // Pricing and Support each appear twice in the footer (column + bottom
    // utility bar, same hrefs in components/site/footer.tsx), so pin the
    // first match; Contact/Privacy/Terms appear once.
    await expect(
      footer.getByRole("link", { name: /^Pricing$/i }).first(),
    ).toHaveAttribute("href", "/pricing");
    await expect(
      footer.getByRole("link", { name: /^Support$/i }).first(),
    ).toHaveAttribute("href", "/support");
    await expect(
      footer.getByRole("link", { name: /^Contact$/i }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      footer.getByRole("link", { name: /^Privacy$/i }),
    ).toHaveAttribute("href", "/privacy");
    await expect(
      footer.getByRole("link", { name: /^Terms$/i }),
    ).toHaveAttribute("href", "/terms");
    await expect(footer.getByText(/Made for motion/)).toBeVisible();
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

  test("landing hero renders the ambient artifact panel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // The hero's intro is gated on prefers-reduced-motion; with motion on,
    // the copy is still settling when measured, which makes visibility reads
    // flaky. Emulate the reduced-motion state so the hero is measured settled.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const hero = page.locator("section#top");
    await expect(
      hero.getByText("Motion reference → production code"),
    ).toBeVisible();
    const heroHeading = hero.getByRole("heading", { level: 1 });
    await expect(heroHeading).toContainText("Motion,");
    await expect(heroHeading).toContainText("decoded.");

    // Live artifact beside the copy: reference viewport, analysis state,
    // and the extracted-frames readout.
    await expect(hero.getByText("reference.mp4")).toBeVisible();
    await expect(hero.getByText("Analyzing")).toBeVisible();
    await expect(hero.getByText("extracted frames")).toBeVisible();
  });

  test("capability cards render their titles", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#features");
    await expect(section).toBeVisible();
    await expect(section.getByText("Capabilities")).toBeVisible();
    await expect(
      section.getByText("Everything between a clip and clean code"),
    ).toBeVisible();

    const cards = section.locator("h3");
    await expect(cards).toHaveCount(6);
    for (const title of [
      "Frame extraction",
      "Normalized motion spec",
      "Multi-target code",
      "Easing detection",
      "Workspaces",
      "Reduced-motion output",
    ]) {
      await expect(section.getByText(title, { exact: true })).toBeVisible();
    }
  });
});
