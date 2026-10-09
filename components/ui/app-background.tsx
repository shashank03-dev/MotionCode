/**
 * Calm, static backdrop for the authenticated product surfaces — the darkroom
 * with the lights down. A faint frame grid fading at the edges and one dim
 * safelight lamp glow, nothing that moves: daily-use tools should read as an
 * instrument, not a show. Purely decorative and inert.
 */
export function AppBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 grid-fade opacity-30 sm:opacity-60" />
      {/* the safelight lamp, far off upper-right */}
      <div className="absolute right-[-24rem] top-[-26rem] size-[46rem] rounded-full bg-[radial-gradient(circle,rgba(255,91,31,0.07),transparent_70%)] blur-2xl" />
      {/* warm floor for depth */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-[linear-gradient(to_top,rgba(237,235,228,0.015),transparent)]" />
    </div>
  );
}
