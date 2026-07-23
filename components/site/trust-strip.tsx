import { Marquee } from "@/components/motion/marquee";
import { TRUST_MARKS } from "@/lib/content";

export function TrustStrip() {
  return (
    <section className="border-y border-hairline bg-panel/40 py-6">
      <div className="container-page">
        <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">
          Built for the people who ship motion
        </p>
        <Marquee items={[...TRUST_MARKS, ...TRUST_MARKS]} />
      </div>
    </section>
  );
}
