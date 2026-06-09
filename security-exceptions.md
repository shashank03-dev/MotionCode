# MotionCode Security Exceptions

MotionCode is in free beta. Free beta analysis uses Gemini only. Pro and Studio are early-access tracks; paid checkout and OpenAI-backed analysis stay disabled until the paid readiness gates are met.

## Open Exceptions

### Paid Checkout And OpenAI Gates

Pro and Studio are early-access tracks during beta. `MOTIONCODE_ENABLE_PAID_CHECKOUT` and `MOTIONCODE_ENABLE_OPENAI_ANALYSIS` must remain `false` or unset until paid readiness gates pass. Razorpay checkout and OpenAI-backed analysis should not be exercised in beta traffic.

### Plan Override Expiry

`admin_plan_overrides.expires_at` is recorded, but automatic expiry processing is not implemented in this agent scope. Operators must review active overrides until a scheduled job is added.

### Admin Bootstrap Allowlist

Server allowlist env vars can grant admin access even when a profile row is missing or not marked internal admin. Use this only for bootstrap or emergency access; prefer `profiles.is_internal_admin` for normal operations.

## Accepted Controls

- Admin API/UI checks are server-side.
- `/app` submits analysis through `/api/analyze`; it does not call Gemini directly from the browser.
- Support ticket creation sets owner from verified Supabase auth.
- Early-access requests are persisted for verified users and visible to internal admins.
- Support operator updates use trusted server credentials after admin verification.
- Plan overrides write audit events.
- Launch controls default to beta and keep paid checkout/OpenAI analysis disabled unless explicitly enabled.
- Destructive Supabase actions require exact approval.
