# MotionCode Landing Page — Design Spec

Date: 2026-07-21
Status: Approved (build full page, iterate)

## Goal

A from-scratch marketing landing page for MotionCode — the product that turns a
short UI motion reference (video/GIF) into a normalized motion spec + CSS/GSAP/Framer
code. Front-end only, no backend wiring. Lives as an **isolated Next.js app** at
`motioncode/landing/`, served on **localhost:4000**, existing app untouched.

## Core idea

The page does not describe MotionCode — it runs it. Hero and "how it works" are a live
demonstration of the pipeline (reference → frame extraction → detected easing curve →
generated code). Marketing and product proof are the same artifact. ("Lead with the
artifact", per PRODUCT.md.)

## Inspiration (design-md anchor)

- **Framer** — pure-black void, kinetic tight grotesk display, single electric-blue
  accent, pill buttons, frosted glass, product-as-hero.
- **Linear** — `#08090a` restraint, achromatic + single accent, weight 510, moonlight
  thin borders, scroll rhythm/pacing.
- **Runway** — cinematic full-bleed motion as UI, film-title tight display, invisible
  interface (on-theme: a motion/video product).
- **Stripe** — section choreography / light-dark cadence, chromatic depth.

(Live Framer-gallery scrape was requested but the Chrome extension was not connected;
proceeded on the design-md anchor. Can be folded in later.)

## Theme tokens

- Canvas `#000`; elevated panels `#0A0B0D`; hairline borders `rgba(255,255,255,0.06)`.
- Text `#F7F8F8` primary / `#A6A6A6` secondary / `#6E7278` muted.
- Single accent electric blue `#0099FF`; glow `rgba(0,153,255,0.15)`. Accent used only
  on CTAs, focus rings, active curves, motion signal — never decoratively.
- Type: **Neue Montreal** display (Geist/system-grotesk fallback until provided) ·
  **Inter** body (cv01/ss03) · **JetBrains Mono** technical labels + spec numbers.
- Motion: ease `cubic-bezier(.2,.8,.2,1)`, 0.4–0.6s. `whileInView` staggered reveals.
  GSAP ScrollTrigger for the pinned/scrubbed sequence. Restrained WebGL (ogl)
  motion-capture dot-field bg reacting to cursor + scroll velocity. Full
  `prefers-reduced-motion` fallback (static, no WebGL, no scrub).

## Sections

1. Floating blurred pill nav — wordmark + links + blue "Start analyzing" CTA. Sticky.
2. Hero — kinetic headline "Motion, decoded." + value prop + dual CTA; live artifact
   panel (looping reference + frame-extraction scanline → easing curve → code); WebGL
   dot-field behind, cursor-reactive.
3. Thin credibility strip — mono line + generic (non-impersonating) marks.
4. How it works — GSAP-pinned, scrubbed 3-beat sequence (drop → extract+analyze →
   spec+code tabs). The signature scroll piece.
5. Feature bento grid — frame extraction, normalized spec, multi-target code, easing
   detection, workspaces, reduced-motion output. Thin borders, blue ring on hover.
6. Motion-spec showcase — real normalized spec beside rendered animation + code tabs.
7. Playground teaser — hover-scrub a mini motion + its curve.
8. Pricing — Free / Pro / Team dark cards, one blue-ringed. Static.
9. Final CTA band — closing line + primary CTA over soft WebGL glow.
10. Footer — mono micro-labels, columns, wordmark.

## Build shape

- Isolated Next.js 16 App Router app at `landing/`, own `package.json`
  (`dev: next dev -p 4000`), Tailwind 3.4 + token layer, framer-motion 12, gsap +
  @gsap/react, ogl. Resolves packages from the parent `node_modules` (already installed)
  — no reinstall. Existing app untouched.
- Minimal hand-authored UI primitives (button, badge, tabs) styled to the dark theme
  instead of pulling shadcn via CLI (network/interactive) — same base-nova spirit.
- Custom motion components: `WebGLField`, `MotionCurve`, `Filmstrip`, `CodePaper`,
  `ScrollReveal`, `MagneticButton`, `Marquee`.
- No backend; content static; CTAs are placeholder links.

## Verification

`next build` clean + dev server on :4000. Headless visual QA via gstack `browse` skill
(Chrome extension unavailable). Reduced-motion checked.
