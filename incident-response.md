# MotionCode Incident Response

## Severity

- SEV-1: Data exposure, secret exposure, production outage, or billing corruption.
- SEV-2: Auth/admin access regression, failed support operations, or degraded analysis for paid users.
- SEV-3: Non-critical UI or documentation issue.

## First Response

1. Identify start time, affected routes, affected users, and recent deployments.
2. Preserve logs and audit events.
3. Stop additional exposure by disabling the affected route, feature flag, or deployment if needed.
4. Communicate status to stakeholders.

## Supabase Safety

- Start with read-only inspection.
- Do not run `DELETE FROM`, `TRUNCATE`, `DROP`, or `ALTER TABLE ... DROP` without exact approval.
- Do not delete projects, branches, buckets, objects, or database objects without exact approval.
- Prefer safe status updates or access normalization over deletion.

## Admin And Support Incidents

- Verify the actor in Supabase Auth and `profiles`.
- Check whether access came from `profiles.is_internal_admin` or server allowlist.
- Review `audit_events` for admin and support operations.
- Rotate allowlist env vars if bootstrap access is suspected.

## Recovery

1. Patch the issue in a branch.
2. Run targeted tests plus `npm run typecheck` and `npm run build`.
3. Deploy to staging and verify affected workflows.
4. Promote to production.
5. Document root cause, impact, timeline, and prevention work.
