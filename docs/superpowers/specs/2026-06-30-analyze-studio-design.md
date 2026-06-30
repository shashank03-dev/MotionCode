# MotionCode Workspace Redesign — Analyze Studio

Date: 2026-06-30
Status: Approved, in implementation

## Goal
One cohesive, navigable authed workspace with a persistent left sidebar, and an
Analyze page rebuilt as a split-resizable **editor / live-preview studio** where
the generated animation actually plays right after analysis.

## Decisions (locked)
- Scope: unified manageable workspace; easy nav between Workspaces/Projects/Analyze; "see the final output".
- Preview engine: sandboxed-iframe execution (production-grade; code actually runs).
- Editor: editable + Run + Console (like the playground reference).
- Navigation: persistent left-sidebar shell across the authed app.
- Build approach: react-resizable-panels + CodeMirror 6 + from-scratch iframe runtime.

## Architecture (3 layers)
1. **WorkspaceShell** — evolves `components/dashboard/app-shell.tsx` into a left
   sidebar; keeps props API (`active`, `userEmail`, `children`). Used by all authed
   pages including Analyze.
2. **AnalyzeStudio** — `react-resizable-panels` horizontal split inside the shell.
   - Left: EditorPane — toolbar (framework tabs CSS/GSAP/Framer/Spring · Format · Run ·
     Reset · Copy/Download) + CodeMirror 6 themed to brand. Editable per-tab state.
   - Right: PreviewPane — Preview | Console tabs, live iframe stage, `READY · {ms}` status strip.
   - Upload + frame controls in compact rail; pre-analysis shows ProcessCanvas, on `done`
     the studio takes over. Spec/Scorecard relocate to a collapsible drawer.
3. **PreviewRuntime** — sandboxed `<iframe sandbox="allow-scripts">`, srcDoc rebuilt per Run.
   `buildPreviewDoc(framework, code, spec)` composes harness + console bridge + per-framework
   execution. CSS injected; GSAP via vendored UMD; Framer/Spring via lazy React+Babel UMD.

## File map
```
components/app/shell/WorkspaceShell.tsx
components/app/studio/AnalyzeStudio.tsx
components/app/studio/EditorPane.tsx
components/app/studio/PreviewPane.tsx
components/app/studio/ConsolePanel.tsx
components/app/studio/codemirror-theme.ts
lib/preview/buildPreviewDoc.ts
lib/preview/consoleBridge.ts
lib/preview/types.ts
public/vendor/gsap.min.js
components/app/AppShell.tsx (swap result stack -> AnalyzeStudio)
```

## Data flow
analyze success -> result.outputs seed editorCode[tab] -> active tab code + spec ->
buildPreviewDoc -> srcDoc -> iframe runs -> console messages stream to Console tab.
Edit updates editorCode[tab]; Run rebuilds srcDoc; Reset restores original generated code.

## Error handling
- Code throws -> caught in iframe -> Console + red ERROR status + Preview badge.
- React/Babel load failure -> Console notice + "preview unavailable, code still editable".
- iframe is allow-scripts only (no same-origin) -> isolated from parent DOM/cookies.
- React UMD/Babel loaded only when a React-framework tab is previewed (lazy).

## Testing
- Unit: buildPreviewDoc per framework; console-bridge message shape; editor seeding/reset.
- E2E: analyze -> studio renders -> switch tabs -> edit -> Run -> animated target -> console capture.

## Phasing
1. WorkspaceShell sidebar + migrate pages.
2. AnalyzeStudio split + EditorPane (read path) + relocate spec/scorecard.
3. PreviewRuntime CSS execution + console bridge + status strip.
4. GSAP execution.
5. Framer Motion + React Spring (lazy) + Format/Reset polish + tests.
