# /app Experience Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authenticated and anonymous `/app` workflow feel immediate, predictable, recoverable, and usable on small screens while preserving the existing visual language, motion design, free-beta rules, generated-output quality, and sandboxed preview behavior.

**Architecture:** Keep the current Next.js App Router structure and client-side workbench. Reduce server work at the workbench boundary, stream the shell independently from explorer data where safe, defer result-only code until a result exists, make upload and analysis operations cancellable, make preview/save failure states recoverable, and add journey-level performance/accessibility coverage. The server remains authoritative for authentication, entitlements, quotas, persistence, and model authorization.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, Vitest, Playwright, CodeMirror, `react-resizable-panels`, OGL/WebGL, existing CSS modules, and the current Gemini analysis API.

**Spec:** `docs/product/user-workflows.md`

## Global Constraints

- Preserve the current `/app` visual system: glass panels, particle field, preloader/phase treatment, hero/headline motion, code/preview studio, typography, colors, and responsive visual language.
- Do not reduce WebGL quality, particle count, shader quality, preloader duration, intro motion, or animation fidelity as part of this plan. Only pause work that is not visible, not needed, or already hidden by the browser.
- Preserve the current product rules: anonymous users see the auth gate; free users get the existing frame/file/quota limits; paid users can edit and save; the server remains the source of truth for entitlements and quota.
- Preserve existing route names, API contracts, test selectors, local-storage keys, Supabase RLS assumptions, preview iframe sandboxing, and generated-code framework tabs unless a compatibility test proves a change is required.
- Do not add a runtime dependency unless an existing package cannot safely provide the behavior. Prefer existing utilities and browser APIs.
- Do not persist anonymous project data or silently change the free-tier promise. Any recovery state must be explicitly scoped to an authenticated paid workflow or an in-memory current session.
- Treat an interrupted operation as a normal state, not as a generic error. No stale extraction, analysis, preview, or save result may overwrite newer user intent.
- Keep the current dirty worktree changes intact, including font conversion, `proxy.ts`, package metadata, and the existing measurement-related `tsconfig.json` entries.

---

## Product use case and what “smooth” means

The primary user is a designer, frontend engineer, or product team member who has a short motion reference and wants trustworthy implementation scaffolding quickly. The `/app` job is not merely “upload a file”; it is a chain of confidence-building decisions:

1. The user arrives from the marketing site and understands whether they are signed in, what the free limit is, and whether their work will be saved.
2. They drag in a video/GIF or choose one from the file picker. The browser validates it, extracts representative frames, and shows that work is progressing without freezing or accepting stale results.
3. They start analysis. The request is authorized server-side, the progress treatment remains honest, and the user can recover from a slow, failed, or interrupted request without re-uploading.
4. They inspect the generated motion spec, score/audit information, framework code, and live preview. Code and preview should become usable independently; one slow runtime must not make the whole result feel broken.
5. They copy, download, edit, run, or save the output. Paid users need an explicit saved/not-saved state and a safe recovery path. Free users need a clear boundary so they do not assume their result will persist after leaving.
6. They return later through the workbench explorer and find the saved project/version without navigation jank, duplicate refreshes, or unexplained lock states.

The complaint-sensitive moments are currently concentrated in five places:

- `/app` server work is duplicated: the layout and page independently resolve the user and entitlement data, and the authenticated layout loads dashboard-shaped data even though the analyzer only needs workspace/project tree data.
- `AnalyzeStudio` statically pulls CodeMirror and editor dependencies into the initial analyzer route even when the user has not produced a result.
- Frame extraction is sequential and has no abort signal or progress callback. Changing the frame count repeats work, and a replaced upload can race an older extraction.
- Analysis has no client cancellation. A slow request can leave the user waiting, and navigation/unmount behavior is not explicit.
- The preview and paid autosave have failure paths, but the user-facing recovery model is weak: preview readiness can hang, save failure has no robust retry/idempotency story, and local code edits are visibly dirty but are not persisted as a saved version.

The plan therefore measures smoothness as state correctness and responsiveness, not as a redesign:

- one memoized auth/entitlement read per server request;
- the workbench shell can appear without waiting for nonessential explorer data;
- no editor/code-preview bundle is fetched before a result is requested;
- replacing/canceling an extraction never allows stale frames to win;
- canceling analysis returns the client to a usable state while retaining the uploaded frames;
- preview timeout, runtime error, and save failure each have an actionable recovery path;
- no horizontal overflow or unusable split editor/preview at 320px, 375px, 768px, 1024px, and desktop widths;
- keyboard, reduced-motion, focus, and screen-reader flows remain usable;
- existing unit, E2E, typecheck, lint, and production-build checks remain green.

## Current `/app` architecture to preserve

- `app/(workbench)/layout.tsx` authenticates, loads dashboard data and entitlements, builds the explorer tree, and mounts `components/app/Workbench.tsx`.
- `app/(workbench)/app/page.tsx` independently resolves the current user and entitlements, validates UUID save targets, and mounts `components/app/AppShell.tsx` or the anonymous auth-gated shell.
- `components/app/AppShell.tsx` owns file state, frame extraction, analysis state, quota presentation, keyboard shortcuts, result selection, and paid autosave.
- `lib/extractFrames.ts` performs browser-side video/GIF sampling and returns base64 JPEG frames.
- `app/api/analyze/handler.ts` performs authentication, entitlement/model checks, abuse checks, quota reservation, Gemini analysis, parsing, usage/audit persistence, and quota release on server-side failures.
- `components/app/AnalyzeStudio.tsx` and its child panes own generated code editing, iframe preview, console messages, spec/audit drawer, and copy/download/run behavior.
- `components/app/MotionParticleField.tsx` is dynamically imported, but its RAF work continues whenever the process canvas is mounted, including states where the canvas is hidden or the document is backgrounded.
- `lib/workbench/saveAnalysis.ts` performs paid persistence after a result is received, then refreshes the workbench tree.

## Implementation phases

### Task 0: Establish a reproducible `/app` baseline and regression harness

**Files:**

- Create `tests/e2e/app-performance.spec.ts`.
- Create `tests/e2e/app-responsive.spec.ts`.
- Extend the relevant existing fixtures in `tests/e2e/app-smoke.spec.ts` and `tests/e2e/app-process.spec.ts` only where shared setup is required.
- Read and use the existing `playwright.config.ts`; do not create a second browser configuration.

**Interfaces and behavior:**

- Add stable measurements for navigation start, first visible workbench shell, upload selection, extraction completion, analysis start, result visibility, preview readiness, and preview timeout.
- Capture browser console errors, failed requests, uncaught page errors, and horizontal overflow (`document.documentElement.scrollWidth > window.innerWidth`) as test failures.
- Use the existing mocked analysis approach for deterministic tests. Do not call Gemini or Supabase from E2E tests.

**Steps:**

- [ ] Add an anonymous `/app` smoke measurement that verifies the auth gate is visible and the inert analyzer does not produce console/page errors.
- [ ] Add an authenticated-style mocked flow that uploads the existing tiny GIF fixture, completes extraction, mocks `/api/analyze`, and records result/preview milestones.
- [ ] Add viewport coverage for 320px, 375px, 768px, 1024px, and 1440px widths.
- [ ] Record the current baseline in the test output without enforcing new numeric budgets until the first implementation pass is measured.
- [ ] Run `npx playwright test tests/e2e/app-smoke.spec.ts tests/e2e/app-process.spec.ts tests/e2e/app-performance.spec.ts tests/e2e/app-responsive.spec.ts` and document the baseline failures, if any, in the plan execution notes.

#### Task 0 execution notes

- Initial harness validation: `git diff --check` passed. `npx tsc --noEmit` was stopped after it did not complete promptly.
- The bounded four-file Playwright run started 12 tests and was capped at 60 seconds. The first reported failure was `tests/e2e/app-performance.spec.ts:46:7` (`measures the anonymous auth-gated shell`); Playwright did not emit assertion detail before the cap.
- A bounded isolated rerun of that test was capped at 40 seconds and emitted no assertion detail.
- Review fix round: restored the `Request` type import, moved analysis-start timing before the Analyze click, captured the first shell milestone inside the shared helper, made preview timeout logging observational, and retained the documented DOM auth-gate bypass limitation.

### Task 1: Remove duplicate server work and unblock the workbench shell

**Files:**

- Modify `lib/supabase/server.ts`.
- Modify `lib/server/entitlements.ts`.
- Modify `app/dashboard/data.ts`.
- Modify `app/(workbench)/layout.tsx`.
- Modify `app/(workbench)/app/page.tsx`.
- Modify `components/app/Workbench.tsx`.
- Create the server-side tree boundary component `components/app/WorkbenchTree.tsx`.
- Create the loading fallback `components/app/ExplorerLoading.tsx`.
- Add focused coverage under `tests/unit/` for request memoization and tree-data selection.

**Interfaces and behavior:**

- Keep the existing injectable `getCurrentUser` behavior used by unit tests, and add a request-scoped `getCurrentUserCached(): Promise<User | null>` wrapper using React server memoization.
- Keep `getEntitlementSummary(userId)` as the underlying data function and add `getEntitlementSummaryCached(userId: string): Promise<EntitlementSummary>` for the layout/page boundary.
- Add `getWorkbenchTreeData(user): Promise<{ workspaces: Workspace[]; projects: Project[] }>` that only fetches the records needed by `buildWorkspaceTree`; keep dashboard profile/usage reads in `getDashboardData` for dashboard consumers.
- Allow `Workbench` to render an explorer slot/fallback while `WorkbenchTree` resolves. The authenticated nav must still receive the authoritative plan tier; the tree may load behind a skeleton.
- Preserve the anonymous path and `/app` dynamic behavior.

**Steps:**

- [ ] Add the cached auth and entitlement wrappers without changing the underlying Supabase queries or return shapes.
- [ ] Switch the layout and page to the cached wrappers so a single request does not call `auth.getUser()` and entitlement queries twice.
- [ ] Extract the workbench-only workspace/project query from the dashboard-shaped loader.
- [ ] Render `WorkbenchTree` inside a `Suspense` boundary with `ExplorerLoading` so explorer latency does not prevent the shell from being painted.
- [ ] Ensure the explorer fallback preserves the current sidebar dimensions and does not cause a layout jump when the real tree arrives.
- [ ] Add tests proving that the dashboard loader still returns profile/usage data while the workbench loader does not fetch it.
- [ ] Run `npm run typecheck && npm run test -- tests/unit/supabase-auth.test.ts tests/unit/workbench-tree.test.ts`.

### Task 2: Defer result-only code and stop invisible animation work

**Files:**

- Modify `components/app/AppShell.tsx`.
- Modify `components/app/AnalyzeStudio.tsx` only if its dynamic boundary requires a stable prop type.
- Modify `components/app/studio/EditorPane.tsx`.
- Modify `components/app/studio/CodeMirrorEditor.tsx` only for the lazy boundary/loading shell.
- Modify `components/app/ProcessCanvas.tsx`.
- Modify `components/app/MotionParticleField.tsx`.
- Add or extend tests for route-bundle behavior and visibility pause/resume.

**Interfaces and behavior:**

- Dynamically import `AnalyzeStudio` from `AppShell` with a loading shell that matches the existing result-panel geometry. The initial `/app` path must not fetch CodeMirror or editor language packages.
- Keep the current studio behavior once a result exists, including tab state, editor content, preview, drawer, and split-panel persistence.
- Add an internal `active`/visibility signal to the particle field. Pause RAF work when the document is hidden or the process canvas is outside the viewport; resume without resetting the visual state when it becomes visible.
- Do not change particle count, DPR, shader, phase visuals, or reduced-motion behavior in this task.

**Steps:**

- [ ] Add the dynamic result boundary and preserve the existing `key={result.id}` remount semantics.
- [ ] Add the editor loading shell and confirm the CodeMirror packages are absent from the initial analyzer chunk through a production build artifact check.
- [ ] Add `IntersectionObserver` and `visibilitychange` handling to the particle field with cleanup on unmount and WebGL context loss.
- [ ] Keep the current WebGL fallback and reduced-motion static field unchanged.
- [ ] Add a unit/browser check that hidden/offscreen state stops the RAF loop and visible state resumes it.
- [ ] Run `npm run build` and the focused app E2E flow; compare the route chunk before and after the boundary.

### Task 3: Make file selection and frame extraction cancellable and race-safe

**Files:**

- Modify `lib/extractFrames.ts`.
- Modify `components/app/AppShell.tsx`.
- Modify `components/app/UploadPanel.tsx` only to expose the existing reset/remove affordance as cancellation while extraction is active.
- Modify `components/app/ProcessCanvas.tsx` only to report extraction progress through its existing status/progress treatment.
- Extend `tests/unit/extractFrames.test.ts`.
- Extend `tests/e2e/app-process.spec.ts`.

**Interfaces and behavior:**

- Extend extraction options with `signal?: AbortSignal` and `onProgress?: (completed: number, total: number) => void`.
- Abort must clean up object URLs, event listeners, video elements, and pending seek/metadata timers, then reject with a recognizable `AbortError`.
- `AppShell` must keep one extraction controller per current operation, abort it before a new file/count extraction, ignore an abort as a user cancellation, and reject stale completions by operation id.
- Existing file size, MIME/extension, frame count, JPEG dimensions, GIF behavior, and returned frame format remain unchanged.

**Steps:**

- [ ] Add an abort helper and signal checks before metadata load, before each seek, after each seek, and before returning frames.
- [ ] Wire extraction progress into existing stage/progress state without changing the visual phase design.
- [ ] Abort on reset, replacement upload, frame-count change, component unmount, and a new extraction start.
- [ ] Ensure an aborted extraction leaves the newest file/frame state intact and never displays a stale error for the old file.
- [ ] Add unit cases for abort before start, abort during metadata, abort during a seek, progress callback ordering, and cleanup.
- [ ] Add an E2E case that replaces a file while extraction is active and verifies only the second file can reach the analyze-ready state.
- [ ] Run `npm run test -- tests/unit/extractFrames.test.ts` and the focused process E2E suite.

### Task 4: Make analysis lifecycle explicit, cancellable, and recoverable

**Files:**

- Modify `components/app/AppShell.tsx`.
- Modify the `analyzeViaApi` helper location used by `AppShell`.
- Modify `components/app/UploadPanel.tsx` or the existing process-status action surface for a cancel action.
- Modify `components/app/ProcessCanvas.tsx` and `components/app/AppStatusBar.tsx` only where the existing status surface needs a cancel/retry action.
- Extend `tests/e2e/app-process.spec.ts`.
- Add unit coverage for request abort/error normalization.

**Interfaces and behavior:**

- Extend `analyzeViaApi` to accept an `AbortSignal` and pass it to `fetch`.
- Maintain one analysis controller and abort it on explicit cancel and component unmount. A canceled request must retain the selected file and frames, clear the loading state, and return to the analyze-ready state rather than the generic error state.
- Keep server authorization, quota reservation, model selection, request schema, and response schema unchanged.
- Preserve retry behavior for real errors and quota failures. Do not decrement local free usage for a request that never produces a successful API response.
- Avoid claiming that client cancellation can undo a server-side model call; the UI should describe cancellation as stopping the client wait and preserving the current input.

**Steps:**

- [ ] Add the controller lifecycle and an operation id so late responses cannot replace a newer analysis.
- [ ] Normalize `AbortError`, invalid JSON, non-JSON responses, quota errors, and server errors into the existing human-readable error surface.
- [ ] Add an accessible cancel action that is disabled once the operation has settled.
- [ ] Keep the current simulated progress treatment but stop it immediately on cancel/error/unmount.
- [ ] Add E2E coverage for cancellation, retry with retained frames, and a late response after cancellation.
- [ ] Run the existing app process E2E tests and the analyze API unit suite.

### Task 5: Make result studio and preview reliable at every supported width

**Files:**

- Modify `components/app/AnalyzeStudio.tsx`.
- Modify `components/app/studio/PreviewPane.tsx`.
- Modify `components/app/studio/EditorPane.tsx`.
- Modify `components/app/studio/CodeMirrorEditor.tsx` only as needed for lazy loading/error cleanup.
- Modify `lib/preview/consoleBridge.ts` and `lib/preview/types.ts`.
- Add a small existing-pattern media-query hook under `lib/` if the panel direction needs a reactive viewport signal.
- Extend `tests/e2e/app-process.spec.ts` and `tests/e2e/app-responsive.spec.ts`.

**Interfaces and behavior:**

- Add a bounded preview readiness watchdog, with an 8-second timeout, that changes the preview to an actionable timeout state and offers replay/retry without losing code edits.
- Clear the watchdog on the matching ready/error message, iframe reload, tab change, unmount, or a newer run.
- Validate preview messages against the current run id and the current iframe window (`event.source === iframe.contentWindow`) before mutating console/status state. Keep the iframe sandbox and `postMessage` payload contract intact.
- At widths below 768px, use a vertical studio arrangement with usable minimum heights; at 768px and above retain the current horizontal split and saved panel layout. The change is structural for usability, not a visual redesign.
- Add explicit `iframe` title and preserve keyboard access to preview/console tabs, editor actions, code tabs, and the resize handle.
- Make the current local-edit boundary explicit: the server-saved version remains the generated version until a dedicated save operation exists; leaving a dirty studio must warn or require confirmation rather than silently discarding edits.

**Steps:**

- [ ] Add preview timeout state, cleanup, and retry behavior.
- [ ] Add the iframe source check and matching run-id check to the message listener.
- [ ] Add narrow-screen panel direction and min-size rules, keeping `autoSaveId="motioncode-studio-split"` for desktop.
- [ ] Add dirty-state confirmation to “New analysis” and other actions that discard edited code; do not falsely report local edits as persisted.
- [ ] Add E2E coverage for preview timeout/retry, stale messages from an old run, dirty navigation, and all target widths.
- [ ] Run `npm run test -- tests/unit/generatedCode.test.ts tests/unit/motionSpecEditor.test.ts tests/unit/preview*` where matching preview tests exist, then run the focused E2E suite.

### Task 6: Give paid autosave a trustworthy failure and retry path

**Files:**

- Modify `lib/workbench/saveAnalysis.ts`.
- Modify the save API handlers used by `saveAnalysisToWorkspace`.
- Modify `components/app/AppShell.tsx` and the save-status UI in `components/app/AnalyzeStudio.tsx`.
- Add a server-side idempotency field/migration only if the existing project/version schema has no safe request key; place that migration in the repository’s existing Supabase migration directory and update generated types if required.
- Extend `tests/unit/saveAnalysis.test.ts` and `tests/e2e/workspaces.spec.ts` or add a dedicated authenticated-style save test.

**Interfaces and behavior:**

- Keep automatic paid save after a successful analysis, but expose distinct states: pending, saved, failed-before-write, and unknown-write-outcome.
- Retry must be safe. If the server cannot prove that a prior attempt did not write, the client must not blindly create a duplicate project/version. Add a stable request id and server-side idempotency handling, or surface a “check workspace” state until the server confirms the outcome.
- A successful save may refresh the explorer, but that refresh must not reset the current result, active code tab, preview, or dirty state.
- Free-tier save behavior remains unchanged and continues to explain the non-persistence boundary.

**Steps:**

- [ ] Trace the existing project/version API calls and identify the smallest existing unique key that can represent one analysis save attempt.
- [ ] Add an idempotent save request using that key, preserving RLS and ownership checks.
- [ ] Return a typed save outcome so the client can distinguish confirmed failure from uncertain completion.
- [ ] Add retry/check-workspace actions without duplicating records.
- [ ] Add tests for success, retry after a confirmed failure, network loss after a successful write, unauthorized target, and duplicate request id.
- [ ] Run the save unit suite and the authenticated-style workspace E2E flow.

### Task 7: Consolidate refresh behavior and accessibility safeguards

**Files:**

- Modify `components/dashboard/PlanSync.tsx`.
- Modify `components/app/AppShell.tsx`.
- Modify `components/app/Workbench.tsx`.
- Modify `components/app/AppAuthGate.tsx`.
- Modify `components/app/FreeSaveNoticeModal.tsx`.
- Modify `components/app/UploadPanel.tsx`.
- Add focused tests for refresh throttling and focus behavior.

**Interfaces and behavior:**

- Replace the duplicated focus/visibility refresh listeners in `PlanSync` and `AppShell` with one throttled refresh coordinator. It must not refresh repeatedly for one browser event, while analysis is active, or while a dirty studio is at risk of being reset.
- Preserve realtime subscription refreshes, but coalesce them with focus/visibility refreshes.
- Ensure auth gate, free-save notice, mobile sidebar, and any new cancel/timeout surface have focus placement, Escape handling, focus restoration, and background inertness appropriate to their existing modal/drawer semantics.
- Keep existing keyboard shortcuts, but present the platform-neutral `Ctrl/Cmd` wording consistently.
- Add `aria-describedby` links for upload validation/error text and ensure status changes remain announced through the existing live regions.

**Steps:**

- [ ] Extract one refresh coordinator with a short throttle and an explicit `shouldRefresh` guard.
- [ ] Remove duplicate listeners and verify that plan changes still update navigation without a full interaction reset.
- [ ] Audit modal/drawer focus and background inertness at desktop and mobile widths.
- [ ] Add keyboard-only E2E checks for upload, cancel, analyze, result tabs, preview tabs, save/retry, and Escape behavior.
- [ ] Run the full app E2E suite and accessibility assertions.

### Task 8: Verification, performance budgets, and release gate

**Files:**

- Update `tests/e2e/app-performance.spec.ts` with enforced budgets after Tasks 1–7 are measured.
- Update `docs/product/user-workflows.md` only if user-visible recovery or save semantics changed.
- Update the relevant performance/design spec if the accepted implementation differs from `docs/superpowers/specs/2026-07-29-performance-and-loading-experience-design.md`.

**Acceptance criteria:**

- [ ] The initial `/app` route does not load CodeMirror/editor chunks before a result is present.
- [ ] Auth and entitlement reads are request-memoized; workbench tree loading does not perform dashboard-only profile/usage reads.
- [ ] The shell paints with a stable explorer fallback while tree data resolves.
- [ ] Extraction and analysis can be canceled, do not leak timers/object URLs/listeners, and cannot be overwritten by stale operations.
- [ ] Preview has a bounded wait and a retry path; old iframe messages cannot mutate the current run.
- [ ] Paid save failures cannot silently lose the outcome or create duplicate records on retry.
- [ ] `/app` has no horizontal overflow at 320px, 375px, 768px, 1024px, or 1440px in the tested journeys.
- [ ] Existing visual states remain intact, including reduced motion, WebGL fallback, auth gate, free-save notice, processing phases, editor/preview studio, and desktop explorer.
- [ ] `npm run check` passes, targeted Playwright suites pass, and the production build passes.

**Final verification commands:**

```bash
npm run typecheck
npm run lint
npm run test
npx playwright test tests/e2e/app-smoke.spec.ts tests/e2e/app-process.spec.ts tests/e2e/app-performance.spec.ts tests/e2e/app-responsive.spec.ts tests/e2e/workspaces.spec.ts
npm run build
npm run check
```

The implementation should be landed in these phases so each release remains usable: server/request path first, then lazy loading and operation cancellation, then studio/save reliability, then accessibility and enforcement of measured budgets. Production verification should include the existing live deployment separately from local checks; local changes must not be treated as deployed until a deliberate deployment occurs.
