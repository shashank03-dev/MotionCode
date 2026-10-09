<div align="center">

<img src="public/brand/motioncode-mark.svg" alt="MotionCode" width="96" height="96" />

# MotionCode

### Turn motion into production code.

Drop in a video or GIF of a UI animation. Get a normalized motion spec and
ready-to-ship **CSS**, **GSAP**, and **Framer Motion** code in seconds.

<br />

[![Live](https://img.shields.io/badge/live-motioncode.live-ff5b1f?style=for-the-badge&labelColor=0b0b0a)](https://motioncode.live)
[![Next.js](https://img.shields.io/badge/Next.js-16-ff5b1f?style=for-the-badge&logo=next.js&logoColor=white&labelColor=0b0b0a)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-ff5b1f?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0b0b0a)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-ff5b1f?style=for-the-badge&labelColor=0b0b0a)](LICENSE)

</div>

---

## What it does

Reverse-engineering an animation by eye is slow and imprecise. MotionCode does it
for you. Give it a short motion reference and it extracts representative frames,
analyzes the movement server-side, and returns a **motion spec** you can trust plus
starter code in the framework you actually use.

```
 video / gif ──▶ frame extraction ──▶ motion analysis ──▶ normalized spec ──▶ code
                                       (Gemini · OpenAI)          (CSS · GSAP · Framer Motion)
```

The interface is built to feel like a focused motion lab: dark, high-contrast,
instrumented, and sharp. Every result is a visible artifact - frames, timing,
easing, and code - not a vague description.

## Features

- **Reference to spec** - upload a clip, get normalized timing, easing, and keyframe data.
- **Multi-framework export** - the same motion emitted as CSS, GSAP (`.ts`), and Framer Motion (`.tsx`).
- **Live preview** - a sandboxed player renders the generated animation before you copy it.
- **Workspaces** - organize saved analyses and projects; reopen generated code without re-running anything.
- **Accounts & billing** - Supabase auth (Google OAuth + magic link) with Razorpay subscription tiers.
- **Built for confidence** - WCAG AA contrast, visible focus states, and reduced-motion fallbacks throughout.

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, CSS variables, design-system kit |
| Motion | GSAP, Framer Motion, OGL (WebGL) |
| Editor | CodeMirror 6 |
| Data & auth | Supabase (Postgres, Auth, SSR) |
| Analysis | Google Gemini (default), OpenAI (optional) |
| Payments | Razorpay subscriptions |
| Validation | Zod |
| Testing | Vitest (unit), Playwright (e2e) |

## Getting started

**Requirements:** Node.js 24+ and npm.

```bash
# 1. Clone
git clone https://github.com/shashank03-dev/MotionCode.git
cd MotionCode

# 2. Install
npm install

# 3. Configure environment
cp .env.local.example .env.local
#    then fill in the values below

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.local.example` and set the following. Supabase and a Gemini key are the
minimum needed to run the analysis flow; Razorpay is only required for paid checkout.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | App origin used for OAuth and magic-link callbacks |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client credentials |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access |
| `GEMINI_API_KEY` | Default motion-analysis provider |
| `OPENAI_API_KEY` | Optional alternate analysis provider |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Billing (optional) |
| `ANALYTICS_SALT` | Hashing salt for analytics identifiers (required in prod) |

See `.env.local.example` for the full, commented list including provider setup notes.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run check` | typecheck + lint + test + build (run before pushing) |

## Project structure

```
app/            App Router routes (marketing, auth, dashboard, workbench, api)
components/     UI kit and feature components (motion, workspace, billing, ...)
lib/            Analysis pipeline, exporters, preview sandbox, Supabase, contracts
public/brand/   Logo and brand assets
supabase/       Database schema and migrations
tests/          Unit and e2e tests
```

The analysis pipeline lives in `lib/` - `extractFrames.ts` pulls frames, the
`app/api/analyze` route runs the model, and `lib/exporters` turns the resulting
spec into per-framework code.

## Brand — Chronograph

<table>
  <tr>
    <td align="center"><code>#0b0b0a</code><br/>Carbon</td>
    <td align="center"><code>#edebe4</code><br/>Bone</td>
    <td align="center"><code>#e8e4d8</code><br/>Paper</td>
    <td align="center"><code>#ff5b1f</code><br/>Safelight</td>
  </tr>
</table>

MotionCode is an instrument that photographs time. The design language borrows
from Marey's geometric chronophotography — dots, lines, exposures — plus the
darkroom and the lab bench: a warm carbon canvas, bone ink, one inverted paper
plate per page, and a single safelight accent reserved for signal (CTAs,
playheads, focus, live state). Typefaces: **Geist** (UI and display),
**Instrument Serif** italic (one accent word per headline), **Geist Mono**
(timecodes, labels, code). The mark is a chronophotographic exposure: five
samples of one point easing out, the resting sample lit. Full rules in
[`docs/design/chronograph.md`](docs/design/chronograph.md).

## License

Released under the [MIT License](LICENSE).

<div align="center">
<br />
<sub>Built for designers and frontend engineers who'd rather ship the animation than measure it frame by frame.</sub>
</div>
