-- Fix: creating a workspace (and then a project inside it) failed for every
-- user with "Failed to create workspace" / RLS violation, leaving 0 workspaces.
--
-- Root cause: the app creates rows with supabase-js `.insert().select()`, which
-- emits `INSERT ... RETURNING`. Postgres re-checks the table's SELECT policy
-- against the newly inserted row before returning it. Both SELECT policies
-- routed exclusively through STABLE SECURITY DEFINER helpers
-- (`is_workspace_member` -> `is_workspace_owner`, and `can_read_project`) that
-- re-query the target table by id. During `INSERT ... RETURNING` that
-- sub-query's snapshot predates the new row, so the helper returned false and
-- the owner was denied their own just-created row.
--
-- Fix: give owners a direct `owner_id = auth.uid()` fast path. Because it is a
-- column comparison against the candidate row, it is satisfied during
-- `INSERT ... RETURNING` without a self-referential re-query. This is strictly
-- additive — an owner was already a member/reader, so no access changes; it
-- only unblocks the RETURNING re-check. ALTER POLICY rewrites the expression in
-- place, so the policy is never removed and recreated.

alter policy "authenticated users can read workspaces"
  on public.workspaces
  using (
    owner_id = (select auth.uid())
    or private.is_workspace_member(id, (select auth.uid()))
  );

alter policy "authenticated users can read projects"
  on public.projects
  using (
    owner_id = (select auth.uid())
    or private.can_read_project(id, (select auth.uid()))
  );
