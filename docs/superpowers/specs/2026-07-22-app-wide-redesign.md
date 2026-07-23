# MotionCode App-Wide Redesign — Design System

Date: 2026-07-22
Status: Implemented

## Goal

Rebuild every product page in the single design language established by the
marketing landing page, so the app and the site read as one product. The prior
app surfaces had drifted: green-tinted off-blacks left over from an earlier
theme, electric-blue used as ordinary body/nav text, mono headings everywhere,
and per-page ad-hoc surfaces.

## Anchor

The landing page (`app/page.tsx` + `components/site/*`), itself anchored on the
design-md references for **Framer** (pure-black void, kinetic grotesk, single
electric accent), **Linear** (restraint, achromatic + one accent, hairline
borders), **Runway** (cinematic motion-as-UI), and **Stripe** (section
choreography).

## Tokens (single source: `app/globals.css` `:root`)

| Role | Value |
| --- | --- |
| Canvas | `#000000` |
| Surface / panel | `#0a0b0d` |
| Elevated | `#101216` |
| Hairline border | `rgba(255,255,255,0.08)` |
| Accent (only) | `#0099ff` |
| Ink / 2 / 3 | `#f7f8f8` / `#a6a6a6` / `#6e7278` |
| Danger | `#E8705F` |

Tailwind exposes these as `canvas`, `panel`, `elevated`, `hairline`,
`hairline-strong`, `ink`, `ink-2`, `ink-3`, `accent`, `accent-dim`,
`accent-border`, `accent-glow`.

### Accent discipline

Accent is reserved for **CTAs, focus rings, active state, and live signal**.
It is never a body-text, nav-idle, label, or icon-default color. There is exactly
one accent — no secondary blues.

### Type

- **PP Neue Montreal** (`font-display`) — headings.
- **SF Pro** (`font-sans`) — body/UI.
- **JetBrains Mono** (`font-mono`) — eyebrows, technical labels, spec numbers,
  IDs, timestamps.

### Motion

Signature easing `cubic-bezier(.2,.8,.2,1)`; framer-motion `whileInView`
reveals; GSAP ScrollTrigger reserved for marketing. App surfaces stay calm.
Every animated surface has a `prefers-reduced-motion` fallback.

## Shared kit

`components/ui/kit.tsx` — `Eyebrow`, `PageHeader`, `Panel`, `StatTile`, `Input`,
`Textarea`, `Field`, `Pill`, `SectionLabel`, `EmptyState`.
`components/ui/app-background.tsx` — calm static grid + single accent bloom for
authenticated surfaces.

Pages compose from the kit. Do not hand-roll surfaces or hardcode colors.

## Analyze progress — WebGL particle field

`components/app/MotionParticleField.tsx` replaces the previous grid of animated
status blocks in `/app`. One GPU particle cloud (6k points, `ogl`) morphs
through the real pipeline, driven by actual analysis progress:

```
0 scatter → 1 filmstrip → 2 vectors → 3 easing curve → 4 code → 5 lattice
```

`progress` (0–100) maps continuously across the five transitions; per-particle
stagger makes the cloud reorganize rather than teleport. Accent brightness peaks
while the easing curve resolves — the product's signature moment. Falls back to
a static grid under reduced-motion or missing WebGL.

`ProcessCanvas` keeps the header, progress read-out, a thin rail of *real*
sampled frames, a text phase rail, and the error/retry states.

## Verification

`npm run typecheck`, `eslint .`, `vitest run` (227 tests), `next build` — all
clean. Consistency audit: 0 green-tinted colors, 0 off-brand palette classes,
0 secondary accents, accent-as-body-text only on genuine active states.
