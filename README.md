# MotionCode

MotionCode turns short UI motion references into implementation-ready animation specs and starter code. The web app extracts representative frames from uploaded video or GIF files, sends those frames to the server-side AI analysis API, and returns normalized motion specs plus CSS, GSAP, Framer Motion, and React Spring examples.

MotionCode is in free beta. Free beta analysis uses Gemini only. Pro and Studio are early-access tracks; paid checkout and OpenAI-backed analysis stay disabled until the paid readiness gates are met.

The product surface is intentionally conservative: it links the app, examples, support, privacy, terms, and pricing without claiming unsupported integrations, partner logos, or guaranteed output quality.

## Free Beta Web Product Scope

- Public marketing page at `/`.
- Motion analysis workspace at `/app`.
- Server-side analysis endpoint at `/api/analyze` with Supabase auth, entitlement checks, abuse controls, Gemini-only beta analysis, usage events, and audit events.
- Public free beta accounts are limited to one Gemini analysis per day. Internal admin or allowlisted testing accounts keep three analyses per day during beta.
- Supabase data foundation for profiles, workspaces, projects, assets, analyses, generated outputs, billing records, early-access requests, support tickets, audit events, and admin plan overrides.
- Pricing page with Pro and Studio early-access CTAs instead of paid checkout.
- User support center at `/support` with ticket creation and account-scoped ticket history.
- Internal admin support queue at `/admin` and admin users/plan overrides at `/admin/users`.
- Gemini/Supabase environment wiring for beta deployment, with Razorpay and OpenAI paths gated off until paid readiness.
- Examples, privacy, terms, loading, error, not-found, and Open Graph routes.

## Local Setup

Prerequisites:

- Node.js 20.19 or newer.
- npm.
- A Supabase project or local Supabase stack.
- Gemini API key for beta analysis.
- OpenAI and Razorpay values only when validating paid readiness outside beta.

Install and run:

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use `payment.ini.example` as an operator checklist for payment/auth placeholders. The app still reads runtime values from environment variables.

## Environment Variables

Required for the server runtime:

- `MOTIONCODE_LAUNCH_PHASE`: Launch mode. Defaults to `beta` when unset; use `paid` only after paid readiness is approved.
- `MOTIONCODE_ENABLE_PAID_CHECKOUT`: Enables paid checkout only when set to `true`. Must be `false` or unset during beta.
- `MOTIONCODE_ENABLE_OPENAI_ANALYSIS`: Enables OpenAI-backed analysis only when set to `true`. Must be `false` or unset during beta.
- `NEXT_PUBLIC_SITE_URL`: Public site URL, usually `http://localhost:3000` locally.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase browser/SSR key.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key for trusted writes. Never expose it to browser code.
- `GEMINI_API_KEY`: Server-side Gemini key used by `/api/analyze` during free beta.
- `OPENAI_API_KEY`: Server-side OpenAI key reserved for paid analysis after `MOTIONCODE_ENABLE_OPENAI_ANALYSIS=true`; not used during beta.

Paid-readiness and admin operations:

- `RAZORPAY_KEY_ID`: Razorpay key ID used to initialize Checkout after paid readiness.
- `RAZORPAY_KEY_SECRET`: Server-only Razorpay key secret used for API access and checkout signature verification after paid readiness.
- `RAZORPAY_WEBHOOK_SECRET`: Razorpay webhook signing secret after paid readiness.
- `RAZORPAY_PRO_PLAN_ID`: Razorpay subscription plan for the Pro tier after paid readiness.
- `RAZORPAY_STUDIO_PLAN_ID`: Razorpay subscription plan for the Studio tier after paid readiness.
- `RAZORPAY_SUBSCRIPTION_TOTAL_COUNT`: Number of billing cycles to create for Razorpay subscriptions after paid readiness.
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

## Paid Checkout Setup

Paid checkout is disabled during free beta. Keep `MOTIONCODE_ENABLE_PAID_CHECKOUT` `false` or unset in beta environments.

1. Create Pro and Studio recurring subscription plans in Razorpay only for paid-readiness validation.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PRO_PLAN_ID`, `RAZORPAY_STUDIO_PLAN_ID`, and `RAZORPAY_SUBSCRIPTION_TOTAL_COUNT` in paid-readiness environments.
3. Configure the Razorpay webhook URL as `/api/razorpay/webhook`.
4. Confirm checkout verification and subscription webhooks update `subscriptions.plan_tier` and `profiles.plan_tier` before enabling the paid launch phase.

## AI Provider Setup

1. Create a Gemini API key.
2. Set `GEMINI_API_KEY` in local and beta deployment environments.
3. Keep `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` `false` or unset during beta.
4. Create and configure `OPENAI_API_KEY` only for paid-readiness validation. `/api/analyze` must not call OpenAI while beta gates are off.
5. Browser-exposed AI keys are not part of the security model; do not create `NEXT_PUBLIC_` Gemini or OpenAI variables.
6. Keep public free beta capacity at one analysis per user per day while using the Gemini free tier. Use `profiles.is_internal_admin`, `MOTIONCODE_INTERNAL_ADMIN_EMAILS`, or `MOTIONCODE_INTERNAL_ADMIN_USER_IDS` only for internal testing accounts that need three analyses per day.

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
- Leave `MOTIONCODE_LAUNCH_PHASE` unset or set to `beta` for beta deployment.
- Keep `MOTIONCODE_ENABLE_PAID_CHECKOUT` and `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` `false` or unset during beta.
- Keep Supabase service role, Razorpay secrets, Gemini key, and OpenAI key server-only.
- Run migrations before promoting a deployment that depends on new tables or policies.
- Verify `/pricing` early-access CTAs, `/api/analyze` Gemini-only beta behavior, early-access request visibility in admin, `/support`, `/admin`, and `/admin/users` against a staging Supabase project before beta promotion.
- Follow `launch-checklist.md`, `admin-support.md`, and `incident-response.md` for operating procedures.

## Documentation

- Product scope: `docs/product/complete-product-scope.md`
- User workflows: `docs/product/user-workflows.md`
- Environment operations: `docs/ops/environment.md`
- Payment workflow: `docs/ops/payment-workflow.md`
- Data retention: `docs/ops/data-retention.md`
- Launch checklist: `launch-checklist.md`
- Admin support: `admin-support.md`
- Incident response: `incident-response.md`
- Security exceptions: `security-exceptions.md`

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
