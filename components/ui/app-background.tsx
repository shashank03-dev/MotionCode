/**
 * Calm, static backdrop for the authenticated product surfaces.
 *
 * Shares the marketing site's visual DNA — true-black canvas, a faint blueprint
 * grid that fades at the edges, and a single soft electric-blue bloom — but stays
 * intentionally quiet (no WebGL, no scroll animation) so daily-use tools read as
 * instrumented and focused rather than busy. Purely decorative and inert, so it
 * needs no reduced-motion handling.
 */
export function AppBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* blueprint grid, masked to a soft ellipse so it never reaches the edges */}
      <div className="absolute inset-0 grid-fade opacity-40 sm:opacity-70" />
      {/* single accent bloom, upper-right — the only color in the room */}
      <div className="absolute right-[-20rem] top-[-22rem] size-[44rem] rounded-full bg-[radial-gradient(circle,var(--accent-dim),transparent_70%)] blur-2xl" />
      {/* cool floor gradient for depth */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-[linear-gradient(to_top,rgba(255,255,255,0.015),transparent)]" />
    </div>
  );
}
