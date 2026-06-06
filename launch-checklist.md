# MotionCode Launch Checklist

## Code Health

- `npm run typecheck` passes.
- `npm test` passes or failures are documented.
- `npm run build` passes.
- RLS policy tests pass.
- No secrets are present in git diffs.

## Product

- `/` loads public content.
- `/app` accepts supported uploads and handles validation errors.
- `/api/analyze` requires authentication and records usage/audit events.
- `/support` lists only the signed-in user's tickets and can create tickets.
- `/admin` rejects non-admin users and lets internal admins operate the support queue.
- `/admin/users` rejects non-admin users and writes audited plan overrides.

## Supabase

- Migrations applied.
- RLS enabled on public tables.
- `project-assets` bucket remains private.
- Service role key is configured only in server environments.
- Internal admin bootstrap account verified.

## Stripe And Gemini

- Stripe prices match Free, Pro, and Studio entitlement docs.
- Stripe webhook secret configured.
- Gemini key configured server-side.
- Browser-exposed AI keys are not used for GA.

## Operations

- `docs/ops/environment.md` reviewed.
- `admin-support.md` reviewed by support operators.
- `incident-response.md` reviewed by on-call owners.
- `security-exceptions.md` reviewed and accepted before paid traffic.
