# MotionCode User Workflows

## Analyze Motion

1. User opens `/app`.
2. User uploads a supported video or GIF.
3. Browser extracts representative JPEG frames.
4. User starts analysis.
5. `/api/analyze` verifies the Supabase user, plan entitlement, resource access, daily quota, and abuse controls.
6. Gemini returns normalized motion output.
7. MotionCode records usage and audit events.
8. User copies generated animation code.

## Create Support Ticket

1. Signed-in user opens `/support`.
2. Server loads only tickets owned by the verified user.
3. User submits subject and details.
4. `/api/support` sets `user_id` from the verified session.
5. Ticket appears in the user's ticket history.

## Operate Support Queue

1. Operator opens `/admin`.
2. Server verifies internal admin access.
3. Operator reviews open and pending tickets.
4. Operator changes status, priority, or assignment.
5. `/api/admin/support/[ticketId]` applies the update through trusted server credentials and records an audit event.

## Apply Plan Override

1. Internal admin opens `/admin/users`.
2. Admin selects a target plan, enters a reason, and optionally sets an expiry.
3. `/api/admin/users/[userId]/plan-override` verifies admin access.
4. The API creates an `admin_plan_overrides` row, updates `profiles.plan_tier`, and records `admin.plan_override.created`.
5. Admin verifies the row shows the latest override.

## Incident Review

1. Admin reviews recent audit events in `/admin`.
2. Admin correlates event type, actor, target, and timestamp.
3. If data cleanup is needed, follow `incident-response.md` and the destructive-operation approval rules.
