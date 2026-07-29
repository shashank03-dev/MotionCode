# Performance & Loading Experience — Design

**Date:** 2026-07-29
**Status:** Approved design, ready for implementation planning

## Problem

Two related problems, one shared goal: the app should *feel* fast and look
premium while it works.

1. **Perceived speed is inconsistent.** Only 3 of 24 routes have a `loading.tsx`
   (`/`, `/dashboard`, `/account`). The other 21 show nothing during server
   work — a blank hold on navigation. The three that exist use a plain
   `bg-white/10 animate-pulse` block, which reads as a generic template rather
   than the Easing Studio design language.
2. **Actual speed is untuned.** The `ogl` WebGL layer (`ContourGrid` site
   background, plus two particle fields totalling ~1,100 lines) is statically
   imported, so `ogl` ships in the initial bundle and its render loops run
   regardless of visibility. No baseline measurement exists.

Separately, the landing page has no brand moment on entry.

## Goals

- Provable Lighthouse and bundle-size improvement, measured before and after.
- Every data-driven route shows an instant, structurally faithful skeleton.
- A landing preloader — particles converging into the MotionCode mark — that
  adds brand impact **without** making repeat visits slower.

## Non-goals

- No redesign of page content or IA. This is loading/perf only.
- No new dependencies. `ogl`, GSAP, and Framer Motion are already present.
- No image pipeline work: marketing pages contain zero `<img>`/`next/image`
  elements, and the only raw `<img>` tags (`FrameStrip`, `ProcessCanvas`,
  `UploadPanel`) point at local blob/data URLs that `next/image` cannot
  optimize — the existing eslint-disable comments document this correctly.
- No Razorpay change: `app/pricing/CheckoutButton.tsx:208` already injects
  `checkout.js` on user interaction, not globally. Verify only.

## Design constraints (existing, must hold)

- **Design system:** one accent used only for CTA/focus/active; no green;
  compose from `components/ui/kit.tsx`; PP Neue Montreal for display.
- **Reduced motion:** already honoured in `contour-grid`, `MotionParticleField`,
  `aura-cursor`, `motion-curve`, `filmstrip`, `magnetic-button`. Everything new
  must honour it too.
- **E2E hooks:** the `/app` particle-field test hooks must survive. The
  `quality` Playwright job is currently green and must stay green.

---

## Part 1 — Landing preloader

### Concept

A full-viewport near-black overlay. Scattered particles fly inward and coalesce
into the MotionCode easing-curve glyph and wordmark, then disperse outward as
the hero reveals underneath. A monospace ticker (frame-sampling metaphor, e.g.
`00 → 24`) reinforces the product identity.

The particle system reuses the existing `ogl` approach rather than introducing
a new renderer.

### Session gate — the critical detail

A preloader that plays on every navigation makes the site slower, which
defeats the purpose. It plays **once per browser session**:

- An inline script in `<head>` reads `sessionStorage['mc:seen-intro']` and
  stamps a class on `<html>` **before first paint**. This is what prevents a
  hydration flash — the overlay must never appear-then-vanish for a returning
  visitor.
- First landing of a session: overlay plays, flag is set.
- Subsequent navigations in that session: overlay never mounts.

### Timing contract

| Bound | Value | Reason |
|---|---|---|
| Minimum | ~1.2s | Below this it reads as a glitch, not an intention. |
| Early exit | on `document.fonts.ready` + hero mounted | Never hold a ready page. |
| Hard cap | ~2.5s | A slow asset can never trap the user. |

Under `prefers-reduced-motion`, the animation is skipped entirely in favour of
a ~200ms fade.

### Accessibility

`aria-hidden` on the decorative canvas; the overlay is `role="status"` with an
accessible label; focus is not trapped; the underlying page is fully
interactive the moment the overlay clears.

---

## Part 2 — Performance overhaul

### Step 0 — Baseline (blocking)

Record before touching code, so gains are provable rather than asserted:

- Lighthouse, mobile and desktop, on `/`, `/pricing`, `/dashboard`, `/app`.
- `ANALYZE=true npm run build` bundle treemap; note initial JS per route.

Numeric targets are set **after** this baseline. Committing to a number before
measuring would be guesswork.

### Step 1 — WebGL layer (largest expected win)

- **Lazy-load** the `ogl`-backed components (`ContourGrid` via
  `SiteBackground`, `MotionParticleField`, `components/auth/particle-field`)
  through `next/dynamic` with `ssr: false`, removing `ogl` from the initial
  bundle.
- **Gate the render loop.** IntersectionObserver plus `document.hidden` so the
  RAF loop pauses when the canvas is offscreen or the tab is backgrounded.
  Currently these loops run continuously.
- **Cap DPR** (~1.5) and degrade gracefully on low-end devices using
  `navigator.hardwareConcurrency` / `deviceMemory` where available.

### Step 2 — Code splitting

- Dynamic-import below-the-fold landing sections so they do not compete with
  first paint.
- Split the CodeMirror editor (`components/app/studio/CodeMirrorEditor.tsx`,
  reached via `EditorPane`). This is an `/app` win, not a landing win —
  CodeMirror is not on the marketing critical path.

### Step 3 — Streaming

Suspense boundaries around slow server work, paired with the Part 3 skeletons,
so shells paint immediately and data streams in.

### Step 4 — Fonts

Verify the two local variable faces (`SF-Pro`, PP Neue Montreal) preload
correctly and produce zero layout shift. `display: swap` is already set.

### Step 5 — Re-measure

Re-run the Step 0 measurements and record before/after in the PR.

---

## Part 3 — Adaptive skeletons

### Shared primitives

New `components/ui/skeleton.tsx` exporting `Skeleton`, `SkeletonText`,
`SkeletonCard`. An accent-tinted shimmer replaces the flat gray pulse; the
shimmer is static under `prefers-reduced-motion`.

### Coverage

"Adaptive" means each skeleton mirrors *that page's* real layout, so the
transition to loaded content is a fill-in rather than a swap.

**Add** (`loading.tsx` per route — 15 of the 21 missing):
`/pricing`, `/billing`, `/login`, `/onboarding`, `/support`,
`/share/[token]`, `/admin`, `/admin/users`, `/app`,
`/projects/[projectId]`, `/projects/[projectId]/versions/[versionId]`,
`/workspaces`, `/workspaces/[workspaceId]`, and the two intercepted modal
routes `@modal/(.)account`, `@modal/(.)billing`.

**Upgrade** to the new primitives: `/`, `/dashboard`, `/account`.

**Deliberately excluded** (the remaining 6): `/terms`, `/privacy`, `/refunds`,
`/shipping`, and — corrected during implementation — `/contact` and
`/projects`. `/contact` renders `LegalPage` with no async work at all, and
`/projects` is a bare `redirect()` to `/workspaces`. A skeleton on either would
paint and then immediately vanish, which is worse than no skeleton.

The two intercepted modal skeletons reuse `RouteModal`, so the dialog frame
(header, backdrop, Escape handling) is interactive while only the body streams.

Workbench skeletons render *inside* the persistent `Workbench` shell from
`app/(workbench)/layout.tsx`, so they cover the inner content area only. Note
that `loading.tsx` does not cover its sibling layout's own data fetch — the
workbench layout awaits `getDashboardData` before any of these appear.

---

## Testing

- **Unit (vitest):** session-gate logic (seen vs. unseen, reduced-motion skip),
  timing-bound behaviour, skeleton reduced-motion rendering.
- **E2E (Playwright):** preloader plays once then hero is visible; second
  navigation in-session skips it; existing `/app` particle-field hooks, auth
  gate, and analyze pipeline still pass.
- **Perf:** before/after Lighthouse and bundle numbers recorded.
- **Gate:** `npm run check` (typecheck, lint, unit, build) must pass.

## Success criteria

1. Measured Lighthouse improvement against the Step 0 baseline.
2. `ogl` absent from the initial landing bundle, verified in the treemap.
3. WebGL render loops verifiably paused when offscreen or tab-hidden.
4. All 15 listed routes show an instant structural skeleton, and the 3 existing
   ones use the new primitives.
5. Preloader: once per session, hard-capped, reduced-motion-safe, and free of
   hydration flash on returning navigations.
6. `npm run check` green; Playwright `quality` job still green.

## Risks

- **Hydration flash** is the main failure mode of the session gate. Mitigated
  by the pre-paint inline script; must be verified manually, not assumed.
- **Dynamic-importing the site background** could cause a visible pop-in on the
  landing page. Mitigate with a matching static backdrop colour underneath so
  the canvas fades in over the correct base rather than over nothing.
- **Preloader vs. speed** is an inherent tension. The session gate plus the
  early-exit and hard-cap bounds are what keep it from becoming a tax.
