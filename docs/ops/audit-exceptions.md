# Audit Exceptions

Last reviewed: 2026-06-06

## `next@14.2.35`

Command:

```bash
npm audit --omit=dev --audit-level=moderate
```

Status: fails because `next@14.2.35` is covered by current high-severity Next.js advisories and depends on a vulnerable nested `postcss` version.

Advisories reported by npm:

- GHSA-9g9p-9gw9-jx7f
- GHSA-h25m-26qc-wcjf
- GHSA-ggv3-7p47-pfv8
- GHSA-3x4c-7xq6-9pq8
- GHSA-q4gf-8mx6-v5v3
- GHSA-8h8q-6873-q5fj
- GHSA-3g8h-86w9-wvmq
- GHSA-ffhc-5mcf-pf4q
- GHSA-vfv6-92ff-j949
- GHSA-gx5p-jg67-6x7h
- GHSA-h64f-5h5j-jqjh
- GHSA-c4j6-fc7j-m34r
- GHSA-wfc6-r584-vfw7
- GHSA-36qx-fr4f-26g5
- GHSA-qx2v-qp2m-jg93

Reason for exception: `npm audit fix --force` proposes `next@16.2.7`, a breaking framework upgrade. That upgrade needs its own compatibility pass across App Router pages, middleware, Supabase SSR auth, Playwright flows, and Vercel deployment settings.

Current mitigating context:

- `next.config.mjs` does not configure image `remotePatterns` or rewrites.
- Global security headers include `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and CSP.
- Gemini and Stripe secrets remain server-only and are not included in client CSP connect targets.

Required follow-up: plan and test a Next.js security upgrade branch, then remove this exception once `npm audit --omit=dev --audit-level=moderate` exits 0.
