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
- `/login` offers Google OAuth and magic-link fallback.
- Google OAuth redirects through Supabase Auth and returns to `/auth/callback`.
- `/auth/callback` creates or syncs a user profile before redirecting to `/dashboard` or a preserved protected `next` path.
- Authenticated surfaces expose sign-out, and `/auth/signout` clears only the current browser session.
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
- Google Auth provider is enabled with OAuth client ID/secret in Supabase Auth.
- Supabase Auth Site URL and redirect allowlist include local, staging, and production `/auth/callback` URLs.
- `/auth/v1/settings` reports the Google external provider as enabled for the deployment Supabase project.
- Google Cloud OAuth client uses the Supabase Auth provider callback URL, not the app `/auth/callback` URL.
- Internal admin bootstrap account verified.

## Billing And AI Providers

- Paid checkout remains disabled during beta.
- Razorpay checkout/webhook verification is deferred until paid readiness gates pass.
- Gemini key is configured server-side for free beta analysis.
- Public free users are limited to one Gemini analysis per day.
- Internal admin or allowlisted testing users are limited to three Gemini analyses per day.
- Gemini `429` quota errors show a daily AI quota message.
- `/api/analyze` does not call OpenAI in beta.
- OpenAI-backed analysis remains disabled until paid readiness gates pass.
- No AI provider keys use `NEXT_PUBLIC_`.

## Operations

- `docs/ops/environment.md` reviewed.
- `admin-support.md` reviewed by support operators.
- `incident-response.md` reviewed by on-call owners.
- `security-exceptions.md` reviewed before beta traffic and again before paid readiness.
