import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Skeleton, SkeletonPage, SkeletonText } from "@/components/ui/skeleton";

describe("skeleton primitives", () => {
  it("hides decorative shapes from assistive tech", () => {
    // Individual wells carry no meaning; announcing each one would read to a
    // screen reader as a wall of empty boxes.
    const markup = renderToStaticMarkup(<Skeleton />);

    expect(markup).toContain('aria-hidden="true"');
  });

  it("carries the shimmer class that the reduced-motion CSS keys off", () => {
    // globals.css suppresses `.mc-skeleton::after` under prefers-reduced-motion,
    // so losing this class would silently un-mute the animation.
    const markup = renderToStaticMarkup(<Skeleton />);

    expect(markup).toContain("mc-skeleton");
  });

  it("gives the page wrapper a single polite status label", () => {
    const markup = renderToStaticMarkup(
      <SkeletonPage label="Loading dashboard">
        <Skeleton />
      </SkeletonPage>,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-label="Loading dashboard"');
  });

  it("ends a text block on a short line so it reads as copy, not a slab", () => {
    const markup = renderToStaticMarkup(<SkeletonText lines={3} />);

    const wells = markup.match(/mc-skeleton/g) ?? [];
    expect(wells).toHaveLength(3);
    // Last line is short; the others run full width.
    expect(markup).toContain("w-2/5");
    expect(markup).toContain("w-full");
  });

  it("applies the requested shape without dropping caller classes", () => {
    const markup = renderToStaticMarkup(
      <Skeleton shape="pill" className="h-10 w-44" />,
    );

    expect(markup).toContain("rounded-full");
    expect(markup).toContain("h-10");
    expect(markup).toContain("w-44");
  });
});
