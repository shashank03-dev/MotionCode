# MotionCode Admin Support Runbook

## Access Model

Internal admin access is granted by either:

- `profiles.is_internal_admin = true` for the verified Supabase user.
- Server-only allowlist env vars for bootstrap or emergency access.

Never use user-editable metadata for admin authorization.

## Support Routes

- User page: `/support`
- User API: `GET /api/support`, `POST /api/support`
- Admin page: `/admin`
- Admin queue API: `GET /api/admin/support`
- Admin ticket update API: `PATCH /api/admin/support/[ticketId]`

## Ticket Operations

Operators can:

- View tickets across users.
- Set status to `open`, `pending`, or `closed`.
- Set priority to `standard`, `priority`, or `urgent`.
- Assign or unassign tickets.

Ticket updates write `support.ticket.updated` audit events.

## Plan Overrides

Route: `POST /api/admin/users/[userId]/plan-override`

Required fields:

- `planTier`: `free`, `pro`, or `studio`.
- `reason`: operational or billing reason.
- `expiresAt`: optional ISO timestamp or `null`.

The API creates an override row, updates `profiles.plan_tier`, and records `admin.plan_override.created`.

## Escalation

Escalate immediately when:

- A user reports cross-account data exposure.
- Admin access appears incorrect.
- Audit event writes fail.
- Payment state and profile plan state disagree for paid users.
