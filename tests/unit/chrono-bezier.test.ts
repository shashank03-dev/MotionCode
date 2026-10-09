import { describe, expect, it } from "vitest";

import {
  EASING_PRESETS,
  bezierAt,
  bezierPath,
  formatBezier,
  timecode,
  toCss,
  toFramer,
  toGsap,
  type MotionSpec,
} from "@/lib/chrono/bezier";

describe("bezierAt", () => {
  it("is the identity for a linear curve", () => {
    for (const x of [0, 0.1, 0.25, 0.5, 0.9, 1]) {
      expect(bezierAt([0, 0, 1, 1], x)).toBeCloseTo(x, 5);
    }
  });

  it("pins the endpoints and clamps out-of-range input", () => {
    const curve = [0.16, 1, 0.3, 1] as const;
    expect(bezierAt(curve, 0)).toBe(0);
    expect(bezierAt(curve, 1)).toBe(1);
    expect(bezierAt(curve, -2)).toBe(0);
    expect(bezierAt(curve, 3)).toBe(1);
  });

  it("matches the browser's `ease` keyword at its midpoint", () => {
    // cubic-bezier(.25,.1,.25,1) at x=.5 ≈ .8024 (reference: WebKit UnitBezier).
    expect(bezierAt([0.25, 0.1, 0.25, 1], 0.5)).toBeCloseTo(0.8024, 3);
  });

  it("is monotonic for every built-in preset without overshoot handles", () => {
    for (const preset of EASING_PRESETS.filter((p) => p.curve[1] <= 1 && p.curve[3] <= 1)) {
      let prev = -Infinity;
      for (let i = 0; i <= 50; i++) {
        const y = bezierAt(preset.curve, i / 50);
        expect(y).toBeGreaterThanOrEqual(prev - 1e-6);
        prev = y;
      }
    }
  });

  it("overshoots for a back-out curve", () => {
    const peak = Math.max(
      ...Array.from({ length: 101 }, (_, i) => bezierAt([0.34, 1.56, 0.64, 1], i / 100)),
    );
    expect(peak).toBeGreaterThan(1);
  });
});

describe("formatting", () => {
  it("formats a curve as CSS without trailing zeros", () => {
    expect(formatBezier([0.16, 1, 0.3, 1])).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
    expect(formatBezier([0, 0, 1, 1])).toBe("cubic-bezier(0, 0, 1, 1)");
  });

  it("draws an SVG path from the bottom-left to the top-right of the box", () => {
    expect(bezierPath([0, 0, 1, 1], 100, 50)).toBe(
      "M0.00,50.00 C0.00,50.00 100.00,0.00 100.00,0.00",
    );
  });

  it("formats 24fps timecodes", () => {
    expect(timecode(0)).toBe("00:00");
    expect(timecode(0.5)).toBe("01:12");
    expect(timecode(1)).toBe("03:00");
    expect(timecode(2)).toBe("03:00");
  });
});

describe("code generation", () => {
  const spec: MotionSpec = {
    target: ".card",
    property: "translateY",
    from: 148,
    to: 0,
    durationMs: 420,
    curve: [0.16, 1, 0.3, 1],
    gsapEase: "expo.out",
  };

  it("emits CSS keyframes with the exact curve and a reduced-motion guard", () => {
    const css = toCss(spec);
    expect(css).toContain("transform: translateY(148px)");
    expect(css).toContain("animation: mc-motion 420ms cubic-bezier(0.16, 1, 0.3, 1) both;");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("emits GSAP with a named ease when one matches, CustomEase otherwise", () => {
    expect(toGsap(spec)).toContain('ease: "expo.out"');
    expect(toGsap(spec)).toContain("duration: 0.42");
    const custom = toGsap({ ...spec, gsapEase: undefined, curve: [0.2, 0, 0, 1] });
    expect(custom).toContain('CustomEase.create("mc", "0.2,0,0,1")');
    expect(custom).toContain('import { CustomEase } from "gsap/CustomEase";');
    expect(toGsap(spec)).not.toContain("CustomEase");
  });

  it("emits Framer Motion with the bezier array", () => {
    const framer = toFramer(spec);
    expect(framer).toContain("initial={{ y: 148 }}");
    expect(framer).toContain("ease: [0.16, 1, 0.3, 1]");
  });
});
