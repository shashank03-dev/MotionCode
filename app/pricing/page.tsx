import Link from "next/link";
import { FREE_LIMIT } from "@/lib/usageLimits";

const plans = [
  {
    name: "Free",
    price: "$0",
    eyebrow: "Open beta",
    description: "Start converting motion into code without setup or a card.",
    features: [
      `${FREE_LIMIT} free analyses per day`,
      "CSS, GSAP, Framer Motion, and React Spring output",
      "Frame extraction from MP4, WebM, MOV, and GIF",
      "Performance and accessibility scorecards",
    ],
    cta: "Start free",
    href: "/app",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Coming soon",
    eyebrow: "For heavier motion work",
    description: "A planned upgrade path for teams with frequent exports.",
    features: [
      "Higher analysis limits after account support ships",
      "Plan-aware model routing after billing support ships",
      "Saved export history on the roadmap",
      "Early access to new export targets",
    ],
    cta: "Join waitlist",
    href: "/app",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        padding: "96px 10vw",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "96px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--accent)",
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            textDecoration: "none",
          }}
        >
          MotionCode
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/#features"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            Features
          </Link>
          <Link
            href="/app"
            style={{
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              padding: "8px 20px",
              textDecoration: "none",
            }}
          >
            Try free
          </Link>
        </div>
      </nav>

      <section>
        <div
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Plans
        </div>
        <h1
          style={{
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(48px, 8vw, 112px)",
            lineHeight: 1,
            margin: "16px 0 24px",
          }}
        >
          Pricing
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            lineHeight: 1.7,
            maxWidth: "560px",
            margin: 0,
          }}
        >
          Choose the MotionCode plan that matches how often you turn animations
          into production-ready code.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "64px",
        }}
      >
        {plans.map((plan) => (
          <article
            key={plan.name}
            style={{
              border: `1px solid ${
                plan.highlighted ? "var(--accent-border)" : "var(--border)"
              }`,
              background: plan.highlighted ? "var(--accent-dim)" : "transparent",
              padding: "32px",
              minHeight: "420px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                color: plan.highlighted ? "var(--accent)" : "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {plan.eyebrow}
            </div>
            <h2
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontSize: "32px",
                margin: "20px 0 8px",
              }}
            >
              {plan.name}
            </h2>
            <div
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                fontSize: "24px",
                marginBottom: "20px",
              }}
            >
              {plan.price}
            </div>
            <p
              style={{
                color: "var(--muted)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {plan.description}
            </p>
            <ul
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                lineHeight: 1.9,
                listStyle: "none",
                margin: "32px 0",
                padding: 0,
              }}
            >
              {plan.features.map((feature) => (
                <li key={feature} style={{ color: "var(--muted)" }}>
                  <span style={{ color: "var(--accent)" }}>+</span> {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              style={{
                background: plan.highlighted ? "var(--accent)" : "transparent",
                border: "1px solid var(--accent)",
                color: plan.highlighted ? "var(--bg)" : "var(--accent)",
                display: "inline-block",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                marginTop: "auto",
                padding: "14px 24px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
