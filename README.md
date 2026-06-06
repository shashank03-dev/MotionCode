# MotionCode

MotionCode turns short motion references into production-ready animation code. The web app extracts representative frames from uploaded video or GIF files, sends those frames to the server-side Gemini analysis API, and returns normalized motion specs plus CSS, GSAP, Framer Motion, and React Spring examples.

## GA Web Product Scope

- Public marketing page at `/`.
- Motion analysis workspace at `/app`.
- Server-side analysis endpoint at `/api/analyze` with Supabase auth, entitlement checks, abuse controls, usage events, and audit events.
- Supabase data foundation for profiles, workspaces, projects, assets, analyses, generated outputs, billing records, support tickets, audit events, and admin plan overrides.
- User support center at `/support` with ticket creation and account-scoped ticket history.
- Internal admin support queue at `/admin` and admin users/plan overrides at `/admin/users`.
- Stripe/Gemini/Supabase environment wiring for production deployment.

## Local Setup

Prerequisites:

- Node.js 18 or newer.
- npm.
- A Supabase project or local Supabase stack.
- Gemini API key.
- Stripe account values if testing billing flows.

Install and run:

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Required for the server runtime:

- `NEXT_PUBLIC_SITE_URL`: Public site URL, usually `http://localhost:3000` locally.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase browser/SSR key.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key for trusted writes. Never expose it to browser code.
- `GEMINI_API_KEY`: Server-side Gemini key used by `/api/analyze`.

Billing and admin operations:

- `STRIPE_SECRET_KEY`: Server-side Stripe API key.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret.
- `STRIPE_PRO_PRICE_ID`: Stripe price for the Pro plan.
- `STRIPE_STUDIO_PRICE_ID`: Stripe price for the Studio plan.
- `MOTIONCODE_INTERNAL_ADMIN_EMAILS`: Optional comma or whitespace-separated server allowlist for internal admins.
- `MOTIONCODE_INTERNAL_ADMIN_USER_IDS`: Optional comma or whitespace-separated Supabase user ID allowlist for internal admins.

## Supabase Setup

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Apply migrations from `supabase/migrations`.
4. Verify RLS policy coverage:

```bash
npm run test -- tests/integration/rls-policies.test.ts
```

Internal admin access is server-checked with `profiles.is_internal_admin` or the server allowlist env vars. Do not use user-editable auth metadata for admin decisions.

## Stripe Setup

1. Create Pro and Studio recurring prices in Stripe.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_STUDIO_PRICE_ID`.
3. Keep webhook secrets server-only in the deployment provider.
4. Confirm subscription state maps to `subscriptions.plan_tier` and `profiles.plan_tier` before paid GA.

## Gemini Setup

1. Create a Gemini API key.
2. Set `GEMINI_API_KEY` in local and deployment environments.
3. Use `/api/analyze` for production analysis. Browser-exposed AI keys are not part of the GA security model.

## Test Commands

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run check
```

Use targeted tests while developing, then run `npm run typecheck` and `npm run build` before release.

## Deployment Notes

- Deploy on Vercel with Node.js runtime support for API routes.
- Configure all required environment variables in the deployment project.
- Keep Supabase service role, Stripe secret, Stripe webhook secret, and Gemini key server-only.
- Run migrations before promoting a deployment that depends on new tables or policies.
- Verify `/api/analyze`, `/support`, `/admin`, and `/admin/users` against a staging Supabase project before production promotion.
- Follow `launch-checklist.md`, `admin-support.md`, and `incident-response.md` for operating procedures.

## Documentation

- Product scope: `docs/product/complete-product-scope.md`
- User workflows: `docs/product/user-workflows.md`
- Environment operations: `docs/ops/environment.md`
- Data retention: `docs/ops/data-retention.md`
- Launch checklist: `launch-checklist.md`
- Admin support: `admin-support.md`
- Incident response: `incident-response.md`
- Security exceptions: `security-exceptions.md`
