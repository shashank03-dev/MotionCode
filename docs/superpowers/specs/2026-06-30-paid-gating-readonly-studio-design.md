# MotionCode — Paid Gating + Read-Only Free Studio

Date: 2026-06-30
Status: Approved, in implementation

## Goal
Lock the management surfaces (Dashboard, Projects, Workspaces) behind a paid plan,
and turn the Analyze studio into a read-only experience for free users: they can
analyze, see the live preview, and copy code — nothing else. Paid users keep the
full editable studio.

## Decisions (locked)
- **Free tier surface:** Analyze + live Preview + Copy code. Read-only.
  - No code editing, no Run / Format / Reset, **no Download**.
  - Spec & audit drawer (`MotionSpecPanel`) fields are read-only for free.
  - Framework tabs (CSS/GSAP/Framer/Spring), preview Replay, and "New analysis"
    stay available (they don't mutate or persist anything).
- **Paid tier:** unchanged full editable studio (edit, Run, Format, Reset, Copy,
  Download, editable spec).
- **Locked pages → in-place upgrade gate** (not a silent redirect), rendered inside
  the existing shell. Applies to all viewable paid pages, including detail pages.
- **Nav:** locked items stay visible with a lock badge (advertises the upgrade).
- `/onboarding` keeps its existing `paidOnly` redirect (it is a flow, not a surface).

## A. Page gating + upgrade gate

`requireDashboardUser(next, { paidOnly: true })` currently **redirects** free users to
`/app`. Switch viewable paid pages to render a gate in place.

- **New** `components/app/UpgradeGate.tsx` (server component): branded
  "Upgrade to unlock {feature}" panel — headline, 2–3 benefit bullets, primary CTA
  → `/pricing`, secondary → `/app`. Brand tokens (`--accent`, mono type), matches
  studio styling.
- **New helper** in `app/dashboard/data.ts`: `resolvePlanGate(userId)` →
  `{ isPaid: boolean; planTier: PlanTier }`, thin wrapper over `getEntitlementSummary`.
- **Pages** (`force-dynamic` already set):
  - `/projects` (index) — add gate (currently ungated)
  - `/workspaces` (index) — add gate (currently ungated)
  - `/dashboard` — swap `paidOnly` redirect → gate
  - `/projects/[projectId]` — swap → gate
  - `/projects/[projectId]/versions/[versionId]` — swap → gate
  - `/workspaces/[workspaceId]` — swap → gate
  - Pattern:
    ```ts
    const user = await requireDashboardUser("/projects");
    const { isPaid } = await resolvePlanGate(user.id);
    if (!isPaid) return <UpgradeGate feature="Projects" />;
    ```
  - `/onboarding` — unchanged (`paidOnly` redirect retained).

## B. Nav lock badges (plan-aware)

- `components/dashboard/app-shell.tsx`: optional `planTier?: PlanTier` prop
  (default `"free"`). For free users, Dashboard/Projects/Workspaces items render a
  trailing `Lock` icon (lucide); Analyze stays open. Links still navigate (land on
  the gate). `/app/page.tsx` and `/dashboard` pass the resolved `planTier`.
- `components/app/Workbench.tsx`: rail exposes only Analyze + Dashboard, so Dashboard
  is its sole lockable item. Add `planTier?: PlanTier` prop and lock the Dashboard
  rail link for free; `(workbench)/layout.tsx` resolves `planTier` once
  (via `getEntitlementSummary`) and passes it in.

## C. Read-only studio for free

Thread `editable: boolean` (`planTier !== "free"`) down:
`AppShell` → `AnalyzeStudio` → `EditorPane` / `MotionSpecPanel` → `CodeMirrorEditor`.

- **`CodeMirrorEditor`**: new `editable` prop. When false, add
  `EditorState.readOnly.of(true)` and `EditorView.editable.of(false)` to the
  extensions (and into the mount). Preview still runs the original generated code,
  so the animation plays.
- **`EditorPane`**: when `!editable`, render only the Copy button (plus framework
  tabs + file label). Hide Format, Reset, Run, **Download**. Show a subtle
  "Read-only · Upgrade to edit & export" hint linking to `/pricing`.
- **`AnalyzeStudio`**: pass `editable` through; when not editable, `dirty` is always
  false, edit handlers are inert, and the spec drawer is read-only.
- **`MotionSpecPanel`**: accept `editable` (default true); when false, fields render
  as static values (no inputs), matching the read-only intent.
- **`AppShell` (`components/app/AppShell.tsx`)**: derive `editable = userPlan !== "free"`
  and pass to `AnalyzeStudio`.

## Data flow
`/app` server page resolves `summary.planTier` → `AppShell(initialPlanTier)` →
`editable = planTier !== "free"` → studio renders editable or read-only. Locked pages
resolve `isPaid` server-side and short-circuit to `<UpgradeGate>`.

## Error handling
- Gate is a pure render; no data fetch beyond `getEntitlementSummary` (already used).
- Read-only CodeMirror cannot dispatch user edits; external value sync (tab switch)
  still works via programmatic dispatch.

## Testing
- Unit: `resolvePlanGate` returns isPaid for paid tiers, false for free.
- Unit: `CodeMirrorEditor` mounts non-editable when `editable={false}` (no contentEditable).
- Unit: `EditorPane` hides Format/Reset/Run/Download and keeps Copy when `!editable`.
- Update existing tests that assert `paidOnly` redirect on `/dashboard` etc. to assert
  gate render.

## Phasing
1. `resolvePlanGate` + `UpgradeGate` + convert paid pages (A).
2. Nav lock badges in both shells (B).
3. Read-only thread through studio (C).
4. Tests + `npm run build` (production) green.
