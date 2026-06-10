# MotionCode Complete Product Scope

## Product Summary

MotionCode helps frontend teams convert short motion references into implementation-ready animation code. Users upload a supported video or GIF, MotionCode samples frames in the browser, analyzes them through the server AI endpoint, and returns a normalized motion spec with code examples for CSS, GSAP, Framer Motion, and React Spring.

MotionCode is in free beta for analysis usage. Pro and Studio upgrades run through Razorpay Checkout; test-mode checkout can be enabled during beta without trusting test subscriptions as paid entitlements.

## Free Beta Web Scope

- Public landing page at `/`.
- Motion analysis tool at `/app`.
- Authenticated server API at `/api/analyze` using Gemini-only beta analysis.
- Public free beta quota is one Gemini analysis per day; internal admin or allowlisted testing accounts keep three daily analyses for staging and support verification.
- Supabase-backed profiles, workspaces, projects, assets, analyses, generated outputs, usage events, subscriptions, support tickets, audit events, and admin plan overrides.
- Free beta access plus Pro and Studio Razorpay subscription tracks.
- Pricing page Razorpay checkout CTAs for Pro and Studio.
- User support center at `/support`.
- Internal admin support queue at `/admin`.
- Internal admin users and plan overrides at `/admin/users`.

## Admin And Support Scope

- User support tickets can be created and listed only for the verified user.
- Support operators use the internal admin API/UI to view tickets, change status, change priority, and assign tickets.
- Admin access is checked server-side with `profiles.is_internal_admin` or server allowlist env vars.
- Plan overrides require admin access and write an audit event.

## Out Of Scope For Free Beta

- Anonymous project storage.
- Live paid entitlement trust from Razorpay test-mode subscriptions.
- OpenAI-backed analysis for Free, Pro, or Studio users.
- Paid Pro or Studio entitlement activation outside admin-controlled testing.
- Browser-exposed production AI keys.
- Destructive data cleanup without exact user approval.
- Unsupported upload formats or code editing experiences not implemented in source.
- Automated expiry processing for plan overrides.

## Release Criteria

- Required beta env vars configured in Vercel and staging.
- `MOTIONCODE_LAUNCH_PHASE` is unset or `beta`; Razorpay checkout uses test keys only with `MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT=true`.
- Supabase migrations applied and RLS tests passing.
- `/api/analyze` smoke-tested as Gemini-only beta analysis with no OpenAI call.
- Public free quota and internal testing quota are smoke-tested against staging auth.
- `/pricing` confirms Pro and Studio Razorpay checkout CTAs.
- `/support`, `/admin`, and `/admin/users` smoke-tested with real Supabase auth.
- `npm run typecheck` and `npm run build` pass.
- Known security exceptions reviewed before beta traffic and again before paid readiness.
