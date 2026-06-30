# MotionCode Desktop Workbench — Workspace/Project Explorer

Date: 2026-06-30
Status: Approved (design), pending implementation plan

## Goal

Turn the authed MotionCode app into a desktop-style workbench. Workspaces are
**folders** in a persistent left explorer tree; each workspace holds many
**projects**. Selecting a project opens the **Analyze Studio** directly in the
main pane, so analysis happens right there without leaving the screen.

This extends the already-approved Analyze Studio spec
(`2026-06-30-analyze-studio-design.md`): that spec established the persistent
sidebar + editor/live-preview studio; this spec makes the sidebar a
workspace→project explorer and the explorer the primary navigation.

## Decisions (locked)

- **Approach A — persistent layout + real routes.** A shared Next.js layout
  renders the desktop chrome (icon rail + explorer tree) and stays mounted while
  the main pane swaps via routes. Keeps deep-linkable/shareable URLs,
  server-fetched tree data, and reuses `AnalyzeStudio`. (Rejected B: single
  client workbench — loses routing, deep-link/refresh, makes the studio a large
  client island.)
- **Nesting:** two levels only — workspace (folder) → projects. No sub-folders
  inside a workspace in this iteration.
- **Tree is the primary nav.** It replaces the current product nav
  (Analyze/Dashboard/Projects/Workspaces list) as the main way to move around.
- **Main pane on project select = Analyze Studio directly** (full-bleed).

## Architecture (3 parts)

### 1. `Workbench` desktop shell

Evolve `components/dashboard/app-shell.tsx` into a three-column desktop shell:

- **Icon rail** (~56px, fixed): MotionCode mark at top; icon buttons for the
  *global, non-per-project* destinations — Dashboard, Account, Billing, Sign
  out. Hover tooltips. Active state on current section.
- **Explorer column** (~260px, collapsible): the workspace→project tree (below).
  Collapsible to give the studio more room; collapsed state persists per session.
- **Main pane**: routed children. Full-bleed (no max-width/padding) when the
  studio owns it; padded otherwise.

Keeps a props API compatible with today's `AppShell` (`active`, `userEmail`,
`children`, `bleed`) so existing pages migrate with minimal churn.

### 2. Explorer tree — `components/app/explorer/`

- `ExplorerTree.tsx` — client component. Receives server-fetched
  `{ workspaces, projectsByWorkspace }` seed; renders folder rows.
- `WorkspaceNode.tsx` — chevron + folder icon + name. Expanding reveals nested
  project rows. Hover actions: `+` (new project in this workspace), rename.
- `ProjectNode.tsx` — nested row; click navigates to the project's studio route.
- `InlineCreate.tsx` — inline text input for creating a workspace (top of tree)
  or a project (under a workspace). Replaces the current full-page/standalone
  `CreateWorkspaceForm` flow. Submits to existing APIs.
- **Selection + expansion live in the URL** (active route segment = selected
  project/workspace; expanded set derived from / persisted alongside it) so
  refresh and deep-links restore tree state.
- **Empty state:** zero workspaces → inline "Create your first workspace" prompt
  in place of the tree body.

### 3. Main pane states (routed)

- **No selection** (`/app` or workbench root) → light home overview: recent
  projects, prompt to pick/create a workspace.
- **Workspace selected** (`/workspaces/[id]`) → slimmed workspace summary
  (members, project count, settings) rendered into the main pane.
- **Project selected** (`/projects/[id]`) → `AnalyzeStudio` full-bleed
  (editor + live preview), reusing `components/app/studio/AnalyzeStudio.tsx`.

## Routing / layout

- New route group `app/(workbench)/layout.tsx` renders `Workbench` (chrome +
  explorer) once and wraps the workspaces / projects / analyze routes. Next.js
  layouts stay mounted across child navigation → the tree does not reload, which
  is what produces the desktop feel.
- Tree seed data is fetched in the layout (server) via the existing
  `getDashboardData` shape (`workspaces`, `projects` with `workspace_id`).
  Projects already carry `workspace_id`, so grouping is a pure transform — no
  schema change for nesting.

## Creation bug fix ("Failed to create workspace")

Observed: creating a workspace from `/workspaces` returns the generic "Failed to
create workspace."

Root-cause path: `createWorkspaceWithSupabase` inserts only
`{ name, owner_id, slug }`. `owner_id` is a FK to `public.profiles(id)`, and the
INSERT RLS policy requires `owner_id = auth.uid() AND plan_tier = 'free'`
(`plan_tier` defaults to `'free'`, so that clause passes). The most probable
failure is a **missing `profiles` row** for the current user → FK violation. The
handler swallows the real Postgres error into a generic string
(`toErrorResponse` → `INTERNAL_ERROR`), which hides the cause.

Fix (to confirm against the live error during build):
1. Stop swallowing — log/surface the actual Supabase error code+message
   server-side so the true cause is visible.
2. Ensure a `profiles` row exists for the authenticated user before/at first
   write (ensure-profile helper, or verify the auth.users→profiles trigger is
   present in this environment; add a migration if missing).
3. Confirm the fix by creating a workspace end to end and seeing it land in the
   tree.

## Files

```
components/app/Workbench.tsx                 (new desktop shell; from app-shell.tsx)
components/app/explorer/ExplorerTree.tsx     (new)
components/app/explorer/WorkspaceNode.tsx    (new)
components/app/explorer/ProjectNode.tsx      (new)
components/app/explorer/InlineCreate.tsx     (new)
app/(workbench)/layout.tsx                   (new persistent layout)
app/workspaces/page.tsx                      (slim → main-pane overview)
app/workspaces/[workspaceId]/page.tsx        (slim → main-pane workspace summary)
app/projects/[projectId]/page.tsx            (render AnalyzeStudio full-bleed)
app/api/workspaces/handler.ts               (stop swallowing error; profiles ensure)
components/app/studio/AnalyzeStudio.tsx      (reused as-is)
supabase/migrations/ (only if profiles trigger missing)
```

## Data flow

Layout (server) → `{ workspaces, projects }` → group projects by `workspace_id`
→ `ExplorerTree` seed. Expand workspace → show its projects. Click project →
route to `/projects/[id]` → layout stays mounted, main pane renders
`AnalyzeStudio`. Inline create → POST existing workspace/project APIs →
`router.refresh()` re-seeds the tree.

## Error handling

- Create workspace/project failure → inline error on the create input + real
  cause logged server-side (no more silent generic message).
- Workspace/project not found or no access → main pane shows not-found/forbidden
  state; tree stays usable.
- Studio errors handled by the existing Analyze Studio spec (iframe sandbox,
  console bridge).

## Testing

- **Unit:** group-projects-by-workspace transform; inline-create slug/validation;
  empty-tree state.
- **E2E:** create workspace → appears in tree → add project under it → expand →
  select project → studio renders → deep-link to `/projects/[id]` restores
  expanded tree with the project selected.

## Out of scope (this iteration)

- Sub-folders inside a workspace.
- Drag-and-drop reordering / moving projects between workspaces.
- Multi-select / bulk actions.
