import { Bench } from "@/components/chrono/bench";
import { Capabilities } from "@/components/chrono/capabilities";
import { Finale } from "@/components/chrono/finale";
import { Footer } from "@/components/chrono/footer";
import { Hero } from "@/components/chrono/hero";
import { Manifesto } from "@/components/chrono/manifesto";
import { Nav } from "@/components/chrono/nav";
import { Preloader } from "@/components/chrono/preloader";
import { Pricing } from "@/components/chrono/pricing";
import { Sequence } from "@/components/chrono/sequence";
import { SmoothScroll } from "@/components/chrono/smooth-scroll";
import { Ticker } from "@/components/chrono/ticker";

/**
 * The landing page is a reel of plates:
 *   01 Hero (live chronophotograph) → leader → 02 Sequence (pinned darkroom)
 *   → 03 Manifesto (paper) → Capabilities index → 04 Bench → 05 Pricing
 *   → Finale → Footer.
 */
export default function Page() {
  return (
    <SmoothScroll>
      {/* First visit of a session only — gated pre-paint in app/layout.tsx. */}
      <Preloader />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Ticker />
        <Sequence />
        <Manifesto />
        <Capabilities />
        <Bench />
        <Pricing />
        <Finale />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
