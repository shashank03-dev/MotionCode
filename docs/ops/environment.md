# MotionCode Environment Operations

MotionCode is in free beta for analysis usage. Pro and Studio upgrades run through Razorpay Checkout; test-mode checkout can be enabled during beta without trusting test subscriptions as paid entitlements.

## Launch Control Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `MOTIONCODE_LAUNCH_PHASE` | Server only | Launch mode. Defaults to `beta` when unset; use `paid` only after paid readiness is approved. |
| `MOTIONCODE_ENABLE_PAID_CHECKOUT` | Server only | Enables paid checkout only when set to `true`. In beta, use only with Razorpay test checkout enabled. |
| `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT` | Server only | Allows `rzp_test_*` Razorpay keys for local or staging checkout smoke tests. Keep `false` for live production. |
| `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` | Server only | Enables OpenAI-backed analysis only when set to `true`. Must be `false` or unset during beta. |

## Required Runtime Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Browser/server | Canonical app URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Supabase authenticated client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Trusted admin writes, audit writes, support/admin operations. |
| `GEMINI_API_KEY` | Server only | Gemini analysis used by `/api/analyze` during free beta. |
| `OPENAI_API_KEY` | Server only | Reserved for paid analysis after `MOTIONCODE_ENABLE_OPENAI_ANALYSIS=true`; not used during beta. |

## Supabase Google OAuth

Google OAuth is configured in Supabase Auth, not through MotionCode runtime env vars.

| Setting | Where | Purpose |
| --- | --- | --- |
| Google OAuth client ID | Supabase Auth Google provider | Lets Supabase initiate hosted Google OAuth. |
| Google OAuth client secret | Supabase Auth Google provider | Server-side provider secret; never expose it in `NEXT_PUBLIC_*`. |
| Supabase Auth callback URL | Google Cloud OAuth client | Google redirects back to Supabase Auth, which then redirects to the app callback. |
| `http://localhost:3000/auth/callback` | Supabase Auth redirect allowlist | Local OAuth and magic-link callback during development. |
| Staging and production `/auth/callback` URLs | Supabase Auth redirect allowlist | Hosted environments. Production should match `NEXT_PUBLIC_SITE_URL`. |

The app callback route exchanges the Supabase auth code, ensures a `profiles` row exists, and redirects to `/dashboard` or the sanitized `next` path. Sign-out clears only the current browser session through `/auth/signout`.

The login page reads the public Supabase Auth settings endpoint at `/auth/v1/settings` before starting Google OAuth. If the deployment Supabase project reports Google as disabled, or if the settings cannot be verified, the Google button stays unavailable and email sign-in remains usable. To verify production readiness, call the settings endpoint with the anon key and confirm the Google external provider is enabled.

## Paid-Readiness Billing Variables

Keep these values server-only. Use Razorpay test-mode values only when `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT=true`; use live values only when `MOTIONCODE_LAUNCH_PHASE=paid`.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | Server only | Razorpay Checkout key returned by the authenticated checkout endpoint after paid readiness. |
| `RAZORPAY_KEY_SECRET` | Server only | Razorpay API access and checkout signature verification after paid readiness. |
| `RAZORPAY_WEBHOOK_SECRET` | Server only | Razorpay webhook signature verification after paid readiness. |
| `RAZORPAY_PRO_PLAN_ID` | Server only | Pro plan subscription mapping after paid readiness. |
| `RAZORPAY_STUDIO_PLAN_ID` | Server only | Studio plan subscription mapping after paid readiness. |
| `RAZORPAY_SUBSCRIPTION_TOTAL_COUNT` | Server only | Billing cycle count for newly created Razorpay subscriptions after paid readiness. |

## Admin Allowlist Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `MOTIONCODE_INTERNAL_ADMIN_EMAILS` | Server only | Optional comma or whitespace-separated admin email allowlist. |
| `MOTIONCODE_INTERNAL_ADMIN_USER_IDS` | Server only | Optional comma or whitespace-separated Supabase user ID allowlist. |

Prefer `profiles.is_internal_admin` for durable admin access. Use allowlists for bootstrap and emergency access only. During beta, internal admins and allowlisted accounts keep a three-analysis daily testing quota while public free accounts are limited to one analysis per day.

## Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Apply migrations before using authenticated product flows. Never run `supabase db reset` against shared or production-like projects without exact approval.

## Production Setup

- Configure env vars in Vercel.
- Configure Supabase Google OAuth provider credentials in Supabase Auth.
- Add local, staging, and production `/auth/callback` URLs to the Supabase Auth redirect allowlist.
- Leave `MOTIONCODE_LAUNCH_PHASE` unset or set to `beta` for beta deployment.
- Enable Razorpay checkout in beta only with `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT=true` and test keys.
- Keep server-only secrets out of `NEXT_PUBLIC_` variables.
- Do not expose AI provider keys as `NEXT_PUBLIC_` variables.
- Apply Supabase migrations before deploying dependent code.
- Verify auth cookies, Gemini-only `/api/analyze` behavior, support ticket creation, Razorpay test checkout, admin checks, plan overrides, and audit events in staging.
- Verify public free accounts stop at one analysis per day, and internal admin or allowlisted testing accounts stop at three analyses per day.
- Verify paid checkout/webhooks only after paid readiness gates pass.
