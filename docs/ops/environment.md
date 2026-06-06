# MotionCode Environment Operations

## Required Runtime Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Browser/server | Canonical app URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Supabase authenticated client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Trusted admin writes, audit writes, support/admin operations. |
| `GEMINI_API_KEY` | Server only | Gemini analysis used by `/api/analyze`. |

## Billing Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Server only | Stripe API access. |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signature verification. |
| `STRIPE_PRO_PRICE_ID` | Server only | Pro plan price mapping. |
| `STRIPE_STUDIO_PRICE_ID` | Server only | Studio plan price mapping. |

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
- Keep server-only secrets out of `NEXT_PUBLIC_` variables.
- Apply Supabase migrations before deploying dependent code.
- Verify auth cookies, support ticket creation, admin checks, plan overrides, and audit events in staging.
