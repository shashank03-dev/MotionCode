# MotionCode

**Turn any UI animation into production-ready code.**

MotionCode takes a short motion reference — a screen recording or GIF — extracts representative frames, analyzes the motion server‑side with AI, and returns a normalized motion spec plus starter code for **CSS**, **GSAP**, and **Framer Motion**.

🔗 Live: **[motioncode.live](https://motioncode.live)**

> Status: **free beta.** Analysis runs on Gemini with a per‑user daily quota. Pro and Studio are early‑access tracks; paid checkout (Razorpay) and OpenAI‑backed analysis stay gated behind launch‑phase flags until paid‑readiness gates pass.

---

## Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Security model](#security-model)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

---

## What it does

- **Motion analysis workspace** (`/app`) — upload a video/GIF, the app extracts frames in the browser and sends them to the analysis API.
- **Normalized motion specs + starter code** — duration, easing, transforms, and per‑framework snippets you can copy and ship.
- **Accounts, workspaces & projects** — Supabase‑backed auth (Google OAuth + magic link), saved projects with versions, and team workspaces.
- **Billing** — Pro/Studio tiers via Razorpay (subscriptions), with server‑verified webhooks and launch‑phase gating.
- **Support & admin** — user support tickets (`/support`), an internal admin support queue (`/admin`), and audited plan overrides (`/admin/users`).

## How it works

```
 video / gif
     │  (browser) extract representative frames
     ▼
 POST /api/analyze ──► auth + entitlement + rate-limit preflight
     │                 (Supabase user, daily quota, abuse guard)
     ▼
 Gemini analysis ──► normalized motion spec
     │
     ▼
 CSS · GSAP · Framer Motion snippets ──► saved to project / version
```

Every analysis is authenticated, quota‑checked against an atomic Postgres reservation, and recorded as a usage + audit event.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, `proxy.ts` middleware) |
| Language | TypeScript, React 18 |
| Styling | Tailwind CSS, custom design tokens |
| Animation | GSAP, Framer Motion, OGL (WebGL background) |
| Auth & data | [Supabase](https://supabase.com) (Postgres + Row Level Security + Storage) |
| AI | Google Gemini (beta); OpenAI gated for paid readiness |
| Billing | [Razorpay](https://razorpay.com) subscriptions + verified webhooks |
| Validation | Zod |
| Testing | Vitest (unit), Playwright (e2e) |
| Hosting | Vercel |

## Project structure

```
app/                  Next.js App Router
  api/                Route handlers (analyze, projects, workspaces,
                      share, support, admin, razorpay)
  app/                Motion analysis workspace
  dashboard/ account/ billing/ projects/ workspaces/   Authenticated surfaces
  login/ onboarding/ auth/                              Auth flow
  pricing/ support/ privacy/ terms/ share/             Public surfaces
components/           UI, marketing, dashboard, and React-Bits components
lib/
  auth/               Redirect normalization & safe `next` handling
  server/             Entitlements, rate limiting, Razorpay, Gemini,
                      admin, profiles, audit, env (server-only)
  supabase/           Browser + server Supabase clients
  hooks/              Client hooks (e.g. hydrated reduced-motion)
supabase/migrations/  SQL schema, RLS policies, atomic usage RPC
tests/                unit (vitest) · integration (RLS) · e2e (playwright)
docs/                 Product scope, ops runbooks, environment notes
```

## Getting started

### Prerequisites

- **Node.js 20.19+** and npm
- A **Supabase** project (or local Supabase stack)
- A **Gemini API key** for beta analysis
- Razorpay / OpenAI keys only when validating paid readiness

### Install & run

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Apply the migrations in `supabase/migrations/` (via the Supabase CLI or dashboard). They create the schema, enable **RLS on every table**, keep the `project-assets` bucket private, and install the atomic analysis‑usage RPC.
2. In **Supabase Auth**: set the Site URL and redirect allowlist to include `http://localhost:3000/auth/callback` and your production `/auth/callback`. Enable the **Google** provider and configure its OAuth client; for magic links, configure SMTP.
3. Set the **service role key** only in server environments — never expose it to the browser.

## Environment variables

Copy `.env.local.example` and fill in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical origin for OAuth/magic‑link callbacks (HTTPS in prod) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server‑only admin key (never `NEXT_PUBLIC_`) |
| `GEMINI_API_KEY` | ✅ | Beta motion analysis |
| `MOTIONCODE_LAUNCH_PHASE` | – | `beta` (default) gates paid/OpenAI features |
| `MOTIONCODE_ENABLE_PAID_CHECKOUT` | – | Enables Razorpay checkout when `true` |
| `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT` | – | Test‑mode checkout during beta |
| `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` | – | Enables OpenAI analysis when `true` |
| `OPENAI_API_KEY` | – | OpenAI analysis (paid readiness only) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | – | Razorpay API credentials |
| `RAZORPAY_WEBHOOK_SECRET` | – | HMAC secret for webhook verification |
| `RAZORPAY_PRO_PLAN_ID` / `RAZORPAY_STUDIO_PLAN_ID` | – | Subscription plan mapping |
| `MOTIONCODE_INTERNAL_ADMIN_EMAILS` / `_USER_IDS` | – | Internal admin allowlist (bootstrap) |

> No secret ever uses a `NEXT_PUBLIC_` prefix — only the Supabase URL, anon key, and site URL are public.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End‑to‑end tests (Playwright) |
| `npm run check` | typecheck + lint + test + build |

## Testing

- **Unit** (`tests/unit`, Vitest) — auth redirects, route protection, API handlers, contracts, runtime guards.
- **Integration** (`tests/integration`) — Supabase RLS policy coverage.
- **End‑to‑end** (`tests/e2e`, Playwright) — marketing surface, auth/dashboard gating, and the analysis flow.

```bash
npm test            # unit
npm run test:e2e    # e2e (boots the dev server automatically)
```

## Security model

- **Auth** is validated server‑side (`supabase.auth.getUser()`), not by decoding cookies. Protected routes check the session on the server.
- **Authorization / RLS** — every public table has Row Level Security; handlers verify ownership of the project/workspace/ticket before read or write. The `project-assets` storage bucket is private.
- **Rate limiting & quota** — the Gemini daily limit is enforced by an atomic Postgres reservation (advisory‑locked, keyed on the user) so it can't be bypassed by clearing cookies or racing requests.
- **Billing** — Razorpay webhooks are HMAC‑verified with a constant‑time compare *before* the payload is trusted, are idempotent, and plan tier is derived server‑side from the Razorpay plan id.
- **Redirects** — the post‑auth `next` path is normalized and constrained to same‑origin (protocol‑relative bypasses rejected) to prevent open redirects.

## Deployment

Deployed on **Vercel**. Pushing to `main` triggers a production deploy. Ensure the production environment has `NEXT_PUBLIC_SITE_URL` set to the canonical domain and all Supabase/Gemini (and, for paid readiness, Razorpay) variables configured. See [`docs/ops/environment.md`](docs/ops/environment.md).

## Documentation

- [`docs/product/`](docs/product) — product scope and user workflows
- [`docs/ops/`](docs/ops) — environment, payment workflow, data retention, readiness reports
- [`launch-checklist.md`](launch-checklist.md) — beta launch gates

## License

See [`LICENSE`](LICENSE).
