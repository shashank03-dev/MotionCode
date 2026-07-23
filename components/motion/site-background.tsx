import { ContourGrid } from "./contour-grid";

/**
 * The living page background: a topographic contour dot-grid fixed behind all
 * content, strong in the hero and quiet elsewhere (handled inside ContourGrid
 * via scroll). The cursor aura is mounted inside the hero itself (see Hero) so
 * it stays bounded to that section and scrolls with it.
 */
export function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <ContourGrid />
    </div>
  );
}
