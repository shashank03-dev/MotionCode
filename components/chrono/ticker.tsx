import { TRUST_MARKS } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * A strip of film leader running between plates: sprocket holes top and
 * bottom, the disciplines that ship motion printed along it. Hover to hold
 * the reel.
 */
export function Ticker() {
  const items = [...TRUST_MARKS, ...TRUST_MARKS];
  return (
    <section className="relative border-y border-hairline py-0" aria-label="Built for the people who ship motion">
      <div className="container-page flex items-center justify-between py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
        <span>Built for the people who ship motion</span>
        <span className="hidden sm:inline">Reel · 35mm</span>
      </div>
      <div className="film-edge" aria-hidden />
      <div className="group relative flex overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        {[0, 1].map((dup) => (
          <div
            key={dup}
            aria-hidden={dup === 1}
            className="flex shrink-0 animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused]"
          >
            {items.map((item, i) => (
              <span key={`${dup}-${i}`} className="flex items-center gap-12">
                <span
                  className={cn(
                    "whitespace-nowrap text-[clamp(1.6rem,3vw,2.6rem)] tracking-[-0.04em]",
                    i % 2 ? "serif-em text-ink-2" : "font-medium text-ink",
                  )}
                >
                  {item}
                </span>
                <span className="size-2 rounded-[3px] border border-bone/30" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="film-edge" aria-hidden />
    </section>
  );
}
