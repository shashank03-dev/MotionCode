import { FEATURES } from "@/lib/content";
import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

/**
 * Capabilities as a catalogue index rather than a card grid: ruled rows,
 * plate numbers, and a small instrument glyph per row that runs its motion
 * on hover (and gently, once, as the row develops into view).
 */

function Glyph({ index }: { index: number }) {
  const common = "h-10 w-16 shrink-0 text-ink-3 transition-colors duration-500 group-hover:text-ink";
  switch (index) {
    case 0: // frame extraction — a strip of frames, one lit
      return (
        <svg viewBox="0 0 64 40" className={common} aria-hidden fill="none">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={2 + i * 15.5}
              y="10"
              width="13"
              height="20"
              rx="1.5"
              stroke="currentColor"
              className="glyph-frame"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </svg>
      );
    case 1: // normalized spec — braces holding three keys
      return (
        <svg viewBox="0 0 64 40" className={common} aria-hidden fill="none" stroke="currentColor">
          <path d="M12 6c-5 0-5 4-5 8s-3 6-4 6c1 0 4 2 4 6s0 8 5 8M52 6c5 0 5 4 5 8s3 6 4 6c-1 0-4 2-4 6s0 8-5 8" />
          {[13, 20, 27].map((y, i) => (
            <line key={y} x1="20" x2={44 - i * 6} y1={y} y2={y} className="glyph-line" style={{ animationDelay: `${i * 140}ms` }} />
          ))}
        </svg>
      );
    case 2: // multi-target — one source, three outputs
      return (
        <svg viewBox="0 0 64 40" className={common} aria-hidden fill="none" stroke="currentColor">
          <circle cx="8" cy="20" r="3" />
          {[8, 20, 32].map((y, i) => (
            <path key={y} d={`M11 20 C 30 20, 30 ${y}, 50 ${y}`} className="glyph-draw" style={{ animationDelay: `${i * 120}ms` }} pathLength={1} />
          ))}
          {[8, 20, 32].map((y) => (
            <rect key={`r${y}`} x="51" y={y - 3} width="10" height="6" rx="1" />
          ))}
        </svg>
      );
    case 3: // easing detection — the curve with its handles
      return (
        <svg viewBox="0 0 64 40" className={common} aria-hidden fill="none" stroke="currentColor">
          <path d="M4 36 L14 4" strokeOpacity="0.4" />
          <path d="M60 4 L40 4" strokeOpacity="0.4" />
          <path d="M4 36 C 14 4, 40 4, 60 4" className="glyph-draw" pathLength={1} strokeWidth="1.5" />
          <circle cx="14" cy="4" r="2" className="fill-carbon" />
          <circle cx="40" cy="4" r="2" className="fill-carbon" />
        </svg>
      );
    case 4: // workspaces — stacked folders
      return (
        <svg viewBox="0 0 64 40" className={common} aria-hidden fill="none" stroke="currentColor">
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${10 + i * 6} ${30 - i * 7} v-14 h10 l3 3 h${22 - i * 2} v11 z`}
              className="glyph-lift"
              style={{ animationDelay: `${i * 110}ms` }}
            />
          ))}
        </svg>
      );
    default: // reduced motion — the same move, without the travel
      return (
        <svg viewBox="0 0 64 40" className={common} aria-hidden fill="none" stroke="currentColor">
          <line x1="6" x2="58" y1="20" y2="20" strokeDasharray="2 4" />
          <rect x="8" y="12" width="16" height="16" rx="4" strokeOpacity="0.35" />
          <rect x="40" y="12" width="16" height="16" rx="4" className="glyph-fade" />
        </svg>
      );
  }
}

export function Capabilities() {
  return (
    <section id="features" className="relative py-28 sm:py-36">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <Reveal>
            <p className="eyebrow">Capabilities</p>
            <h2 className="display-lg mt-4 max-w-[15ch]">
              Everything between a clip and <span className="serif-em">clean code</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-[17px] leading-relaxed text-ink-2 lg:justify-self-end">
              MotionCode does the tedious part — reading motion frame by frame —
              so the spec you ship is precise, portable and honest to the source.
            </p>
          </Reveal>
        </div>

        <ol className="mt-16 border-t border-hairline-strong">
          {FEATURES.map((feature, i) => (
            <li key={feature.title} data-testid="capability-card">
              <Reveal
                delay={i * 0.04}
                className={cn(
                  "group relative grid grid-cols-[2.5rem_1fr] items-start gap-x-4 gap-y-3 border-b border-hairline py-7 transition-colors duration-500",
                  "md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.3fr)_4rem] md:items-center md:gap-8 md:py-9",
                  "hover:bg-bone/[0.025]",
                )}
              >
                <span className="font-mono text-[12px] tabular-nums text-ink-3 transition-colors duration-500 group-hover:text-accent md:pl-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[clamp(1.5rem,2.4vw,2.1rem)] leading-tight tracking-[-0.04em] transition-transform duration-700 ease-expo md:group-hover:translate-x-2">
                  {feature.title}
                </h3>
                <p className="col-start-2 max-w-lg text-[15px] leading-relaxed text-ink-2 md:col-start-auto">
                  {feature.body}
                </p>
                <span className="hidden justify-self-end md:block">
                  <Glyph index={i} />
                </span>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
