# MotionCode Data Retention And Backups

## Production Data Classes

- Auth and billing identity: `profiles`, `subscriptions`, `admin_plan_overrides`.
- Workspace data: `workspaces`, `workspace_members`, `team_members`, `projects`, `project_versions`, `project_comments`, `share_links`.
- Analysis data: `assets`, `analyses`, `generated_outputs`, `usage_events`.
- Operations data: `support_tickets`, `audit_events`.
- Storage objects: files in the private `project-assets` bucket, using `{user_id}/{project_id}/...` paths.

## Retention Defaults

- Free plan audit events: retain for 7 days.
- Pro plan audit events: retain for 30 days.
- Studio plan audit events: retain for 180 days.
- Usage events: retain for at least 24 months for billing, quota reconciliation, and abuse investigation.
- Support tickets: retain for 24 months after closure unless legal or security review requires longer retention.
- Revoked or expired share links: retain metadata for 90 days, then normalize access state through `revoked_at`; do not expose token material.
- Project assets, analyses, generated outputs, and versions: retain while the owning project is active. Cleanup jobs must first report the exact rows and storage paths that would be affected and require explicit approval before deletion.

## Backup Operations

- Enable Supabase automated backups and point-in-time recovery for production before accepting paid traffic.
- Keep Vercel environment variables backed by the deployment provider; never commit service role, Stripe, Gemini, or webhook secrets.
- Store migration files in git and treat them as the source of schema history.
- Run `supabase migration list --local` during release checks to verify local migration ordering.
- Do not run `supabase db reset` in shared or production-like environments. It is approval-gated for this project.
- For restore drills, use a disposable Supabase branch or project. Validate RLS behavior and storage bucket privacy before promoting recovered data.

## Cleanup Process

1. Use read-only SQL to identify candidate rows, object paths, owners, and counts.
2. Export the report for review, including affected workspace IDs and project IDs.
3. Get explicit approval for the exact destructive operation.
4. Execute the cleanup with audited server-side tooling.
5. Record the cleanup in `audit_events` with actor, target type, target ID, and summary metadata.

## Security Notes

- RLS is enabled on every public table in the MotionCode schema.
- Share-link token reads must go through future server route helpers that hash and verify tokens. Anonymous table reads are intentionally not granted.
- Internal admin checks are based on `profiles.is_internal_admin` for the verified `auth.uid()` and never on user-editable metadata.
- Storage uploads must use paths prefixed by user ID and project ID. The `project-assets` bucket is private.
