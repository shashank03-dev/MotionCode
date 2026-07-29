"use client";

import dynamic from "next/dynamic";

/**
 * The living page background: a topographic contour dot-grid fixed behind all
 * content, strong in the hero and quiet elsewhere (handled inside ContourGrid
 * via scroll). The cursor aura is mounted inside the hero itself (see Hero) so
 * it stays bounded to that section and scrolls with it.
 *
 * ContourGrid is loaded lazily and client-only, which keeps `ogl` (the WebGL
 * renderer) out of the landing page's initial bundle — the grid is decorative,
 * so nothing about first paint should wait on it.
 *
 * The static `grid-fade` layer below is deliberately NOT part of that lazy
 * chunk: it renders on the first frame and the canvas fades in over it, so the
 * background never pops in from nothing.
 */
const ContourGrid = dynamic(
  () => import("./contour-grid").then((m) => m.ContourGrid),
  { ssr: false },
);

export function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 grid-fade opacity-60" />
      <ContourGrid />
    </div>
  );
}
