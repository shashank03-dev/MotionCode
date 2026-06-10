# Subagent Execution Notes

## Agent 9 Scope

Agent 9 owns admin/support implementation and ops documentation:

- `/support` page and `/api/support` routes.
- `/admin` and `/admin/users` pages.
- `/api/admin` routes for dashboard, user listing, support ticket updates, and plan overrides.
- `components/admin` and `components/support`.
- README and operational docs.

## Boundaries

- Do not run destructive Supabase SQL or CLI operations without exact approval.
- Do not bypass the Supabase CLI guard.
- Do not expose service role, Razorpay, Gemini, or OpenAI secrets to browser code.
- Do not claim unsupported media formats or editor/runtime features in docs.

## Handoff

Before handoff:

1. Confirm branch is `codex/mcp-agent-09-ops-admin-docs`.
2. Run `npm run typecheck`.
3. Run `npm run build` if practical.
4. Run targeted tests if new tests were added.
5. Commit coherent work as `feat: add admin support and ops docs`.
