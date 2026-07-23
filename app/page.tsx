import { SiteBackground } from "@/components/motion/site-background";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { TrustStrip } from "@/components/site/trust-strip";
import { HowItWorks } from "@/components/site/how-it-works";
import { Features } from "@/components/site/features";
import { SpecShowcase } from "@/components/site/spec-showcase";
import { Playground } from "@/components/site/playground";
import { Pricing } from "@/components/site/pricing";
import { CTA } from "@/components/site/cta";
import { Footer } from "@/components/site/footer";
import { ProgressiveBlur } from "@/components/motion/progressive-blur";

export default function Page() {
  return (
    <>
      <SiteBackground />
      {/* iOS-style gradient blur pinned to the viewport edges: strongest behind
          the nav pill at the top, easing to crisp; a matching band at the base. */}
      <ProgressiveBlur side="top" fixed height="150px" strength={16} layers={5} />
      <ProgressiveBlur side="bottom" fixed height="120px" strength={11} layers={4} />
      {/* Nav lives at the root (not inside main's z-10 context) so its glass
          pill paints above the fixed blur bands. */}
      <Nav />
      <main className="relative z-10">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Features />
        <SpecShowcase />
        <Playground />
        <Pricing />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
