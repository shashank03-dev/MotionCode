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

    const header = page.locator("header").first();
    const nav = header.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav).toBeVisible();
    const initialNavHeight = await stableHeight(nav);

    // Section links collapse into the menu below md; their hrefs are still
    // wired (mobile-nav.spec.ts covers the open menu).
    await expect(
      nav.getByRole("link", { name: /^Features$/i, includeHidden: true }),
    ).toHaveAttribute("href", "#features");
    await expect(
      nav.getByRole("link", { name: /^How it works$/i, includeHidden: true }),
    ).toHaveAttribute("href", "#how");
    await expect(
      nav.getByRole("link", { name: /^Pricing$/i, includeHidden: true }),
    ).toHaveAttribute("href", "#pricing");
    await expect(
      nav.getByRole("link", { name: /^Support$/i, includeHidden: true }),
    ).toHaveAttribute("href", "/support");
    await expect(nav.getByRole("link", { name: /^Try Free$/i })).toHaveAttribute(
      "href",
      "/app",
    );

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

    // How it works: the first act's caption is the one shown on load (pinned
    // stage on desktop, stacked on small screens); the others are present.
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
    // Tier copy is derived from PLAN_ENTITLEMENTS (lib/pricing.ts).
    await expect(pricing.getByText("Editable code studio with export")).toBeVisible();
    await expect(pricing.getByText("1 analysis a day")).toBeVisible();
    await expect(pricing.getByRole("link", { name: /^Start free$/i })).toHaveAttribute("href", "/app");
    await expect(
      pricing.getByRole("link", { name: /Compare every limit/i }),
    ).toHaveAttribute("href", "/pricing#compare");
    await expect(pricing.getByRole("link", { name: /^Go Pro$/i })).toBeVisible();
    await expect(pricing.getByRole("link", { name: /^Go Team$/i })).toBeVisible();

    // CTA eyebrow is a mono label (span), not a heading: the closing plate's
    // real h2 is "Ship motion with confidence." (components/chrono/finale.tsx).
    await expect(page.getByText("Ready when you are", { exact: true })).toBeVisible();
    const ctaHeading = page.getByRole("heading", {
      name: /Ship motion with confidence/i,
    });
    await expect(ctaHeading).toBeVisible();

    // Scrolled: the bar contracts into a frosted floating capsule without
    // changing height.
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(header).toHaveAttribute("data-scrolled", "true");
    await expect(nav).toHaveAttribute("data-capsule", "true");
    await expect(async () => {
      const chrome = await nav.evaluate((node) => {
        const styles = getComputedStyle(node);
        return { backdrop: styles.backdropFilter, radius: parseFloat(styles.borderTopLeftRadius) };
      });
      expect(chrome.backdrop).toMatch(/blur\((?!0px)/);
      expect(chrome.radius).toBeGreaterThanOrEqual(12);
    }).toPass();
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
    // Reduced-motion and small-screen users get the stacked sequence instead
    // of the pinned, scroll-scrubbed stage: the same three acts laid out
    // statically, with no scroll-driven transforms.
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#how");

    const fallback = page.locator("section", {
      has: page.getByRole("heading", { name: "From reference to shipped", exact: true }),
    });
    await expect(fallback).toBeVisible();
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
    // The pinned stage is not rendered at all under reduced motion.
    await expect(page.locator("[data-how-pinned]")).toBeHidden();
  });

  test("reduced motion on desktop also drops the pinned sequence", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("[data-how-pinned]")).toBeHidden();
    await expect(page.locator("[data-how-stacked]")).toBeVisible();
  });

  test("landing ticker and readable footer links", async ({
    page,
  }) => {
    await page.goto("/");

    // Credibility strip: a caption plus a reel of role marks (each mark
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
    // utility bar, same hrefs in components/chrono/footer.tsx), so pin the
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

  test("desktop nav: product menu, sliding pill and scrollspy", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });

    // Product menu: keyboard-operable disclosure next to "Features".
    const trigger = nav.getByRole("button", { name: "Product menu" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = nav.getByRole("region", { name: "Product" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: /Chronograph/ })).toHaveAttribute("href", "#top");
    await expect(panel.getByRole("link", { name: /Code bench/ }).first()).toHaveAttribute("href", "#playground");
    await expect(panel.getByRole("link", { name: /Compare plans/ })).toHaveAttribute("href", "/pricing#compare");
    await expect(panel.getByRole("link", { name: /Open the analyzer/ })).toHaveAttribute("href", "/app");
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Hovering "Features" opens it too; leaving closes it.
    await page.mouse.move(700, 700);
    await nav.getByRole("link", { name: /^Features$/ }).hover();
    await expect(panel).toBeVisible();
    await page.mouse.move(700, 700);
    await expect(panel).toHaveCount(0);

    // Scrollspy: the link for the section under the reading line is current.
    await page.evaluate(() => document.querySelector("#pricing")?.scrollIntoView());
    await expect(nav.getByRole("link", { name: /^Pricing$/ })).toHaveAttribute("aria-current", "location");
    await expect(nav.getByRole("link", { name: /^How it works$/ })).not.toHaveAttribute("aria-current", "location");
  });

  test("pricing page compares every limit and answers billing questions", async ({
    page,
  }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: "Access tiers for motion analysis." }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Pay with Razorpay/i })).toHaveCount(2);
    await expect(page.getByText("Most popular")).toBeVisible();

    const table = page.locator("#compare table");
    await expect(table).toBeVisible();
    const row = (label: string) => table.getByRole("row", { name: new RegExp(`^${label}`) });
    await expect(row("Frames per analysis")).toContainText("6");
    await expect(row("Frames per analysis")).toContainText("12");
    await expect(row("Frames per analysis")).toContainText("16");
    await expect(row("Max upload")).toContainText("250 MB");
    await expect(row("Code studio")).toContainText("Read-only");

    const faq = page.locator("details", { hasText: "How does billing work?" });
    await expect(faq.getByText(/processed by Razorpay/)).toBeHidden();
    await faq.locator("summary").click();
    await expect(faq.getByText(/processed by Razorpay/)).toBeVisible();
    await expect(
      page.locator("details", { hasText: "Do you offer refunds?" }).getByRole("link", { includeHidden: true }),
    ).toHaveAttribute("href", "/refunds");
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

  test("landing hero renders the chronograph plate and its readout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // Reduced motion: the plate is the static SVG still and the intro is
    // settled, so visibility reads are deterministic.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const hero = page.locator("section#top");
    await expect(
      hero.getByText("Motion reference → production code"),
    ).toBeVisible();
    const heroHeading = hero.getByRole("heading", { level: 1 });
    await expect(heroHeading).toContainText("Motion,");
    await expect(heroHeading).toContainText("decoded.");

    // One still per breakpoint; exactly one is shown.
    await expect(
      hero.locator("[data-chronograph='still'] svg").filter({ visible: true }),
    ).toHaveCount(1);
    // Readout beside the plate: source clip, frame rate, and the live curve.
    await expect(hero.getByText("reference.mp4")).toBeVisible();
    await expect(hero.getByText("24 fps")).toBeVisible();
    await expect(hero.getByText("cubic-bezier(0.16, 1, 0.3, 1)")).toBeVisible();
    await expect(hero.getByRole("button", { name: "Copy" })).toBeVisible();
  });

  test("bench regenerates code from the chosen curve and target", async ({
    page,
  }) => {
    await page.goto("/#playground");

    const bench = page.locator("#playground");
    await expect(
      bench.getByRole("heading", { name: /One spec\. Every format\./ }),
    ).toBeVisible();

    const code = bench.locator("pre");
    await expect(code).toContainText("@keyframes mc-motion");
    await expect(code).toContainText("cubic-bezier(0.16, 1, 0.3, 1)");

    await bench.getByRole("button", { name: /Back out/i }).click();
    await expect(code).toContainText("cubic-bezier(0.34, 1.56, 0.64, 1)");

    await bench.getByRole("tab", { name: "GSAP" }).click();
    await expect(code).toContainText('gsap.fromTo(".card"');
    await expect(code).toContainText('ease: "back.out(1.7)"');

    await bench.getByRole("button", { name: /Standard/i }).click();
    await expect(code).toContainText('import { CustomEase } from "gsap/CustomEase";');

    await bench.getByRole("tab", { name: "Framer Motion" }).click();
    await expect(code).toContainText("ease: [0.2, 0, 0, 1]");

    await bench.locator("input[type='range']").evaluate((input: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "800");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(code).toContainText("duration: 0.8,");
  });

  test("capability index renders its titles", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#features");
    await expect(section).toBeVisible();
    await expect(section.getByText("Capabilities", { exact: true })).toBeVisible();
    await expect(
      section.getByRole("heading", { name: "Everything between a clip and clean code" }),
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
