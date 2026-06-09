# MotionCode Complete Product Scope

## Product Summary

MotionCode helps frontend teams convert short motion references into implementation-ready animation code. Users upload a supported video or GIF, MotionCode samples frames in the browser, analyzes them through the server AI endpoint, and returns a normalized motion spec with code examples for CSS, GSAP, Framer Motion, and React Spring.

MotionCode is in free beta. Free beta analysis uses Gemini only. Pro and Studio are early-access tracks; paid checkout and OpenAI-backed analysis stay disabled until the paid readiness gates are met.

## Free Beta Web Scope

- Public landing page at `/`.
- Motion analysis tool at `/app`.
- Authenticated server API at `/api/analyze` using Gemini-only beta analysis.
- Supabase-backed profiles, workspaces, projects, assets, analyses, generated outputs, usage events, subscriptions, early-access requests, support tickets, audit events, and admin plan overrides.
- Free beta access plus Pro and Studio early-access tracks.
- Pricing page early-access CTAs for Pro and Studio; no paid checkout during beta.
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
- Paid checkout or Razorpay subscription activation.
- OpenAI-backed analysis for Free, Pro, or Studio users.
- Paid Pro or Studio entitlement activation outside admin-controlled testing.
- Browser-exposed production AI keys.
- Destructive data cleanup without exact user approval.
- Unsupported upload formats or code editing experiences not implemented in source.
- Automated expiry processing for plan overrides.

## Release Criteria

- Required beta env vars configured in Vercel and staging.
- `MOTIONCODE_LAUNCH_PHASE` is unset or `beta`; `MOTIONCODE_ENABLE_PAID_CHECKOUT` and `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` are `false` or unset.
- Supabase migrations applied and RLS tests passing.
- `/api/analyze` smoke-tested as Gemini-only beta analysis with no OpenAI call.
- `/pricing` confirms Pro and Studio early-access CTAs instead of checkout.
- Early-access requests persist and are visible to admins.
- `/support`, `/admin`, and `/admin/users` smoke-tested with real Supabase auth.
- `npm run typecheck` and `npm run build` pass.
- Known security exceptions reviewed before beta traffic and again before paid readiness.
