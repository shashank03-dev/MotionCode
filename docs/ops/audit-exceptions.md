# Audit Exceptions

Last reviewed: 2026-09-10

No active production dependency audit exceptions are currently accepted.

The previous `next@14.2.35` / nested `postcss` exception was closed by
upgrading to `next@16.2.7` and pinning `postcss@8.5.10` through npm overrides.

## 2026-09-10 review (no dependency changes this release)

`npm audit --omit=dev --audit-level=moderate` currently reports advisories
published after the June review (the only added dependency,
`@vercel/speed-insights`, ships zero transitive dependencies, so none of
these were introduced by this release):

- `next@16.2.7`: GHSA-6gpp-xcg3-4w24 (critical, middleware/proxy bypass),
  GHSA-m99w-x7hq-7vfj, GHSA-89xv-2m56-2m9x, GHSA-68g3-v927-f742,
  GHSA-4633-3j49-mh5q, GHSA-4c39-4ccg-62r3, GHSA-p9j2-gv94-2wf4,
  GHSA-q8wf-6r8g-63ch, GHSA-955p-x3mx-jcvp, GHSA-p293-qw3h-jr36,
  GHSA-2xp9-vwfh-vxw4
- `nanoid` (transitive): GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8 (high)
- `baseline-browser-mapping` (transitive): GHSA-w5vr-8v7q-w6rv (moderate)
- `postcss@8.5.10` (pinned): GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp (high)

Follow-up: upgrade `next` past the GHSA-6gpp fix release once available and
confirm whether production builds use Turbopack (the bypass advisory is
scoped to Turbopack + single-locale App Router apps; `proxy.ts` owns auth
refresh, so this advisory is directly relevant).

Required release check:

```bash
npm audit --omit=dev --audit-level=moderate
```

The command must exit 0 before production release.
