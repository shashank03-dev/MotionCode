# MotionCode

MotionCode turns short UI motion references into implementation-ready animation specs and starter code. The web app extracts representative frames from uploaded video or GIF files, sends those frames to the server-side AI analysis API, and returns normalized motion specs plus CSS, GSAP, Framer Motion, and React Spring examples.

MotionCode is in free beta for analysis usage. Pro and Studio upgrades run through Razorpay Checkout; test-mode checkout can be enabled during beta with `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT=true`, while paid entitlements are trusted only in paid launch mode with live Razorpay keys.

The product surface is intentionally conservative: it links the app, pricing, support, privacy, and terms without claiming unsupported integrations, partner logos, or guaranteed output quality.

## Free Beta Web Product Scope

- Public marketing page at `/`.
- Motion analysis workspace at `/app`.
- Server-side analysis endpoint at `/api/analyze` with Supabase auth, entitlement checks, abuse controls, Gemini-only beta analysis, usage events, and audit events.
- Public free beta accounts are limited to one Gemini analysis per day. Internal admin or allowlisted testing accounts keep three analyses per day during beta.
- Supabase data foundation for profiles, workspaces, projects, assets, analyses, generated outputs, billing records, support tickets, audit events, and admin plan overrides.
- Pricing page with Pro and Studio Razorpay checkout CTAs.
- User support center at `/support` with ticket creation and account-scoped ticket history.
- Internal admin support queue at `/admin` and admin users/plan overrides at `/admin/users`.
- Gemini/Supabase environment wiring for beta deployment, with Razorpay test checkout gated separately from trusted paid entitlements.
- Privacy, terms, loading, error, not-found, and Open Graph routes.

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
- `MOTIONCODE_ENABLE_PAID_CHECKOUT`: Enables paid checkout only when set to `true`. In beta, use it only with `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT=true`.
- `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT`: Allows Razorpay test keys in beta for checkout smoke testing. Keep it `false` for live production.
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
3. In Supabase Auth, enable the Google provider and add the Google OAuth client ID/secret. In Google Cloud, add the Supabase Auth callback URL from the provider page as an authorized redirect URI.
4. Set the Supabase Auth Site URL to `NEXT_PUBLIC_SITE_URL`, then add local, staging, and production `/auth/callback` URLs to the redirect allowlist.
5. Verify the public Auth settings report Google as enabled before shipping the Google button:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

The response must include Google as an enabled external provider. If it does not, the login page will keep Google sign-in unavailable and users should use email sign-in.

6. Apply migrations from `supabase/migrations`.
7. Verify RLS policy coverage:

```bash
npm run test -- tests/integration/rls-policies.test.ts
```

Internal admin access is server-checked with `profiles.is_internal_admin` or the server allowlist env vars. Do not use user-editable auth metadata for admin decisions.

## Google OAuth Setup

MotionCode uses Supabase-managed Google OAuth. Do not add Google OAuth client secrets to app environment variables or any `NEXT_PUBLIC_*` value.

1. In Google Cloud, create a Web OAuth client and register the Supabase Auth callback URL shown in the Supabase Google provider settings.
2. In Supabase Auth, enable the Google provider and save the Google client ID and client secret there.
3. In Supabase Auth redirect URLs, allow the app callback origins used by MotionCode:
   - `http://localhost:3000/auth/callback`
   - the staging app callback URL
   - the production app callback URL based on `NEXT_PUBLIC_SITE_URL`
4. Smoke test `/login`: Google OAuth should return to `/auth/callback`, then to `/dashboard` or the preserved `next` path. Magic-link email remains available as fallback.
5. Sign-out is local to the current browser session and posts to `/auth/signout`.

## Paid Checkout Setup

1. Create Pro and Studio recurring subscription plans in Razorpay.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PRO_PLAN_ID`, `RAZORPAY_STUDIO_PLAN_ID`, and `RAZORPAY_SUBSCRIPTION_TOTAL_COUNT` in paid-readiness environments.
3. For local or Vercel test-mode checkout, set `MOTIONCODE_ENABLE_PAID_CHECKOUT=true` and `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT=true` with `rzp_test_*` keys.
4. Configure the Razorpay webhook URL as `/api/razorpay/webhook`.
5. Confirm checkout verification and subscription webhooks update `subscriptions.plan_tier` and `profiles.plan_tier`.
6. For live production, switch to `rzp_live_*` keys, set `MOTIONCODE_LAUNCH_PHASE=paid`, keep `MOTIONCODE_ENABLE_PAID_CHECKOUT=true`, and keep `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT=false`.

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
- Enable Razorpay test checkout in beta only with test keys; use live keys only after switching `MOTIONCODE_LAUNCH_PHASE=paid`.
- Keep Supabase service role, Razorpay secrets, Gemini key, and OpenAI key server-only.
- Run migrations before promoting a deployment that depends on new tables or policies.
- Verify `/pricing` Razorpay CTAs, `/api/analyze` Gemini-only beta behavior, `/support`, `/admin`, and `/admin/users` against a staging Supabase project before beta promotion.
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
