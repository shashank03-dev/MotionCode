# MotionCode Launch Checklist

MotionCode is in free beta. Free beta analysis uses Gemini only. Pro and Studio are early-access tracks; paid checkout and OpenAI-backed analysis stay disabled until the paid readiness gates are met.

## Beta Launch Mode

- `MOTIONCODE_LAUNCH_PHASE` is unset or set to `beta`.
- `MOTIONCODE_ENABLE_PAID_CHECKOUT` is `false` or unset.
- `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` is `false` or unset.

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
- `/pricing` shows early-access CTAs for Pro and Studio instead of paid checkout.
- Early-access requests persist and are visible to admins.
- `/support` lists only the signed-in user's tickets and can create tickets.
- `/admin` rejects non-admin users and lets internal admins operate the support queue.
- `/admin/users` rejects non-admin users and writes audited plan overrides.

## Supabase

- Migrations applied.
- RLS enabled on public tables.
- `project-assets` bucket remains private.
- Service role key is configured only in server environments.
- Internal admin bootstrap account verified.

## Billing And AI Providers

- Paid checkout remains disabled during beta.
- Razorpay checkout/webhook verification is deferred until paid readiness gates pass.
- Gemini key is configured server-side for free beta analysis.
- `/api/analyze` does not call OpenAI in beta.
- OpenAI-backed analysis remains disabled until paid readiness gates pass.
- No AI provider keys use `NEXT_PUBLIC_`.

## Operations

- `docs/ops/environment.md` reviewed.
- `admin-support.md` reviewed by support operators.
- `incident-response.md` reviewed by on-call owners.
- `security-exceptions.md` reviewed before beta traffic and again before paid readiness.
