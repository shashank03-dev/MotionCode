# MotionCode Complete Product Scope

## Product Summary

MotionCode helps frontend teams convert short motion references into implementation-ready animation code. Users upload a supported video or GIF, MotionCode samples frames in the browser, analyzes them through the server Gemini endpoint, and returns a normalized motion spec with code examples for CSS, GSAP, Framer Motion, and React Spring.

## GA Web Scope

- Public landing page at `/`.
- Motion analysis tool at `/app`.
- Authenticated server API at `/api/analyze`.
- Supabase-backed profiles, workspaces, projects, assets, analyses, generated outputs, usage events, subscriptions, support tickets, audit events, and admin plan overrides.
- Plan entitlements for Free, Pro, and Studio.
- User support center at `/support`.
- Internal admin support queue at `/admin`.
- Internal admin users and plan overrides at `/admin/users`.

## Admin And Support Scope

- User support tickets can be created and listed only for the verified user.
- Support operators use the internal admin API/UI to view tickets, change status, change priority, and assign tickets.
- Admin access is checked server-side with `profiles.is_internal_admin` or server allowlist env vars.
- Plan overrides require admin access and write an audit event.

## Out Of Scope For GA

- Anonymous project storage.
- Browser-exposed production AI keys.
- Destructive data cleanup without exact user approval.
- Unsupported upload formats or code editing experiences not implemented in source.
- Automated expiry processing for plan overrides.

## Release Criteria

- Required env vars configured in Vercel and staging.
- Supabase migrations applied and RLS tests passing.
- `/api/analyze`, `/support`, `/admin`, and `/admin/users` smoke-tested with real Supabase auth.
- `npm run typecheck` and `npm run build` pass.
- Known security exceptions reviewed before paid traffic.
