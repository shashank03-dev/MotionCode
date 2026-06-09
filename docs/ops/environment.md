# MotionCode Environment Operations

MotionCode is in free beta. Free beta analysis uses Gemini only. Pro and Studio are early-access tracks; paid checkout and OpenAI-backed analysis stay disabled until the paid readiness gates are met.

## Launch Control Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `MOTIONCODE_LAUNCH_PHASE` | Server only | Launch mode. Defaults to `beta` when unset; use `paid` only after paid readiness is approved. |
| `MOTIONCODE_ENABLE_PAID_CHECKOUT` | Server only | Enables paid checkout only when set to `true`. Must be `false` or unset during beta. |
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

## Paid-Readiness Billing Variables

Paid checkout is disabled during free beta. Keep these values server-only and use them only in paid-readiness environments where `MOTIONCODE_ENABLE_PAID_CHECKOUT=true`.

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

Prefer `profiles.is_internal_admin` for durable admin access. Use allowlists for bootstrap and emergency access only.

## Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Apply migrations before using authenticated product flows. Never run `supabase db reset` against shared or production-like projects without exact approval.

## Production Setup

- Configure env vars in Vercel.
- Leave `MOTIONCODE_LAUNCH_PHASE` unset or set to `beta` for beta deployment.
- Keep `MOTIONCODE_ENABLE_PAID_CHECKOUT` and `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` `false` or unset during beta.
- Keep server-only secrets out of `NEXT_PUBLIC_` variables.
- Do not expose AI provider keys as `NEXT_PUBLIC_` variables.
- Apply Supabase migrations before deploying dependent code.
- Verify auth cookies, Gemini-only `/api/analyze` behavior, support ticket creation, early-access request persistence/admin visibility, admin checks, plan overrides, and audit events in staging.
- Verify paid checkout/webhooks only after paid readiness gates pass.
