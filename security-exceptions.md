# MotionCode Security Exceptions

## Open Exceptions

### Legacy `/app` Client Analysis Path

The current `/app` client still contains a legacy direct Gemini call path. GA should use `/api/analyze`, which keeps `GEMINI_API_KEY` server-side and records usage/audit events. Treat browser-exposed AI keys as disallowed for production.

### Plan Override Expiry

`admin_plan_overrides.expires_at` is recorded, but automatic expiry processing is not implemented in this agent scope. Operators must review active overrides until a scheduled job is added.

### Admin Bootstrap Allowlist

Server allowlist env vars can grant admin access even when a profile row is missing or not marked internal admin. Use this only for bootstrap or emergency access; prefer `profiles.is_internal_admin` for normal operations.

## Accepted Controls

- Admin API/UI checks are server-side.
- Support ticket creation sets owner from verified Supabase auth.
- Support operator updates use trusted server credentials after admin verification.
- Plan overrides write audit events.
- Destructive Supabase actions require exact approval.
