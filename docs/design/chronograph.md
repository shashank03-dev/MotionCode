# Chronograph — the MotionCode design language

MotionCode is an instrument that photographs time. A clip goes in; frames,
a curve and code come out. The design language borrows from the people who
first did that by hand — Étienne-Jules Marey's *geometric chronophotography*
(a subject exposed many times on one plate, reduced to dots and lines) — and
from the darkroom and lab bench around it.

The one idea to protect: **the spacing of exposures *is* the easing curve.**
Where samples bunch up the motion is slow; where they spread it is fast. Every
signature visual on the site is a variation of that plate.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `carbon` / `--bg` | `#0b0b0a` | Canvas. Warm near-black, never `#000`. |
| `surface` / `elevated` | `#121210` / `#191916` | Panels, wells, raised controls. |
| `bone` / `--text` | `#edebe4` | Ink. Never pure `#fff`. |
| `ink-2` / `ink-3` | `#a5a297` / `#6f6c63` | Secondary copy / labels, metadata. |
| `paper` / `paper-ink` | `#e8e4d8` / `#141310` | The inverted plate (`.plate-paper`). At most one per page. |
| `accent` (safelight) | `#ff5b1f` | **Signal only**: primary CTA, playheads, the moving head of an exposure, focus rings, live dots. Never decorative fills, never ambient washes. |
| `danger` | `#f0506e` | Errors. Kept rose so it never reads as the accent. |

Every colour is defined as an RGB channel token (`--accent-rgb: 255 91 31`)
and exposed to Tailwind with `<alpha-value>`, so `bg-carbon/80` or
`border-accent/40` work everywhere. Hairlines are `--border` /
`--border-strong` (bone at 8.5% / 15%).

Categorical colours (the intent legend in `components/app/intent-colors.ts`)
are a legend, not the brand — they stay distinguishable from safelight.

## Type

- **Geist** — UI and display. Display sizes run tight (`-0.045em` to `-0.06em`)
  at weight 500: `.display-xl`, `.display-lg`, `.display-md`.
- **Instrument Serif, italic** — `.serif-em`. One accent word or phrase per
  headline ("Motion, *decoded.*"). Never a whole paragraph.
- **Geist Mono** — timecodes, plate numbers, eyebrows (`.eyebrow`), specs,
  code. Uppercase + tracked for labels; tabular numerals for anything that
  counts.

## Motion

- Entrance: `--ease-out` = `cubic-bezier(.16, 1, .3, 1)` (expo-out). Scrubbed
  / symmetric moves: `--ease-chrono` = `cubic-bezier(.65, 0, .35, 1)`.
- Smooth scroll is Lenis, driven from GSAP's ticker so ScrollTrigger reads the
  same position (`components/chrono/smooth-scroll.tsx`). Marketing pages only.
- Above-the-fold copy animates with CSS (`.rise`, `.fade-rise`) so it never
  waits on hydration; below-the-fold content develops in with `<Reveal>`.
- **Reduced motion** is a first-class tier, not an afterthought: the hero is a
  static SVG plate, the pinned sequence is replaced by the stacked version,
  scroll-developed text renders fully, and every keyframe is disabled.
- Expensive visuals step down on weak hardware: the hero shader falls back to
  the still plate on low-tier devices (`lib/device-tier.ts`) and on software
  WebGL (SwiftShader / llvmpipe).

## The plates (landing page)

1. **Hero** — `Chronograph`: a single fragment shader (ogl) renders the
   exposures, path, motion smear and safelight bloom; the pointer bends the
   curve's handles and the readout prints the real `cubic-bezier()`.
2. **Ticker** — film leader with sprocket edges.
3. **Sequence** (`#how`) — pinned darkroom: clip → contact sheet → Marey plot →
   generated code, scrubbed by a ScrollTrigger timeline.
4. **Manifesto** — the paper plate; words develop on scroll.
5. **Capabilities** (`#features`) — an instrument bench: a bento of hairline tiles, each with a live SVG instrument (frame gate, resolving spec, wire pulses, a match-confidence donut, fanning workspace, travel vs. crossfade). Rivets and dashed registration rules frame the grid.
6. **Bench** (`#playground`) — real code generation from `lib/chrono/bezier.ts`.
7. **Pricing** (`#pricing`), **Finale**, **Footer** (wordmark as last exposure).

## Building new UI

- Marketing: compose from `components/chrono/*` (`PageHero`, `ExposureRule`,
  `Reveal`, `Nav`, `Footer`).
- Product: compose from `components/ui/kit.tsx` and `components/ui/site-button.tsx`.
  `.glass-card` is the instrument panel surface.
- Corners are restrained (pills for buttons, 12–16px panels, square rules for
  editorial structure). Prefer hairline rules and numbering over boxed cards.
- If a new visual doesn't relate to exposures, curves, frames or timecode, it
  probably doesn't belong.
