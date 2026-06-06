# MotionCode GA Readiness Report

Date: 2026-06-06

## Status

MotionCode is code-integrated for the planned GA product surface, but paid production GA remains conditional on staging validation with real Supabase, Stripe, and Gemini credentials.

## Completed Readiness Items

- Public routes are implemented for `/`, `/examples`, `/pricing`, `/privacy`, `/terms`, and `/support`.
- The converter is available at `/app` and routes analysis through server-owned `/api/analyze`.
- Authenticated product routes are implemented for dashboard, workspaces, projects, versions, billing, account, support, and share views.
- Internal admin routes and APIs are implemented for support operations, user lookup, and plan overrides.
- Supabase schema, RLS policies, private storage setup, and generated TypeScript database types are present in source.
- Stripe checkout, portal, webhook, and plan entitlement helpers are present in source.
- CI, security headers, CSP, structured logging, analytics events, observability hooks, and ops docs are present in source.

## Verification Record

- `npm run typecheck`: passed.
- `npm run lint`: passed with image optimization warnings for raw frame preview images.
- `npm test`: passed, 18 test files and 94 tests.
- `npm run build`: passed.
- `npm run test:e2e`: passed, 5 tests.
- `npm audit --omit=dev --audit-level=moderate`: failed on known Next.js/PostCSS advisories. The exception is documented in `docs/ops/audit-exceptions.md` and must be owned before paid GA.

## Required Environment

Configure these before staging or production release:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_STUDIO_PRICE_ID`
- `MOTIONCODE_INTERNAL_ADMIN_EMAILS`
- `MOTIONCODE_INTERNAL_ADMIN_USER_IDS`

## Staging Smoke Checklist

- Apply the Supabase migration and confirm the `project-assets` bucket is private.
- Create a user, workspace, project, uploaded asset, analysis, generated outputs, usage event, support ticket, share link, and comment.
- Confirm anonymous users are redirected from dashboard/workspace/project/admin routes.
- Confirm `/api/analyze` rejects anonymous requests, enforces entitlement limits, writes audit/usage records, and stores generated output for authenticated requests.
- Confirm Stripe checkout and portal redirect users correctly and webhook events update profile/subscription plan state.
- Confirm support tickets are user-scoped and internal admin APIs reject non-admin users.
- Confirm share links can be created, viewed, and revoked.

## Release Blockers

- `npm audit --omit=dev --audit-level=moderate` is not clean because `next@14.2.35` requires a breaking security upgrade path.
- Supabase migration/RLS/storage behavior has not been verified against a live staging project in this branch.
- Stripe webhook delivery and subscription sync have not been verified against Stripe test mode in this branch.
- Gemini model access, quota behavior, and failure handling have not been verified with production-like credentials in this branch.
- Automatic expiry processing for admin plan overrides is explicitly out of GA scope and should not be presented as implemented.
