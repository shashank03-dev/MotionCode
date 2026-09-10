## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Ported Claude Code memory (full files in `.opencode/memory/` - read on a need-to-know basis)

- Product: motion reference → spec + CSS/GSAP/Framer code (`motioncode-product.md`).
- Design system: ONE app-wide language - accent `#0099ff` for CTAs/focus/active/live-signal only, no green, compose from `components/ui/kit.tsx`, PP Neue Montreal display headings (`motioncode-design-system.md`, `theme-unification.md`).
- Brand bar: premium product-defining visuals (Easing Studio); no generic/abstract art (`motioncode-design-bar.md`).
- `/app` progress is a WebGL particle morph, not status blocks - keep e2e test hooks (`motioncode-analyze-particle-field.md`).
- Monetization: workspaces are paid (free=0, BILLING_REQUIRED→UpgradeDialog), `/app` requires login (AppAuthGate), single contextual billing button (`motioncode-monetization-gates.md`).
- Pricing is USD ($18 Pro / $49 Team); internal id `studio` displays as "Team"; UNLIMITED_QUOTA sentinel; Razorpay MCP has no create-plan tool (`motioncode-plan-labels-usd.md`).
- Workspace-first IA: workspace=single unit, desktop folders, no top-level Projects (`motioncode-workspace-first.md`).
- E2E: `marketing.spec.ts` goes stale fast after landing redesigns - realign assertions with the redesigned sections instead of weakening tests; wrap geometry reads in `expect(...).toPass()` (`ci-e2e-chronically-red.md`).
