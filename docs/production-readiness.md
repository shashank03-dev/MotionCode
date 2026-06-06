# Production Readiness

MotionCode is prepared for preview production deployments with server-side Gemini access, validated analysis payloads, guarded media extraction, rate limiting for free usage, security headers, and automated verification.

## Required Environment

- `GEMINI_API_KEY`: server-only key used by `/api/analyze`.
- `UPSTASH_REDIS_REST_URL`: Redis REST URL for durable production quota enforcement.
- `UPSTASH_REDIS_REST_TOKEN`: Redis REST token for durable production quota enforcement.
- Node.js 20.19.x or newer.
- `npm ci` for reproducible installs.

Do not expose Gemini credentials through `NEXT_PUBLIC_*` variables. Browser clients call `/api/analyze`; only the server calls Gemini.

## Runtime Controls

- `/api/analyze` validates incoming frame payloads before calling Gemini.
- Gemini responses are normalized and validated before rendering code snippets.
- Free usage is limited before provider calls are made. Production requests require a durable Upstash Redis quota store; local development and tests use an in-memory fallback.
- Browser media extraction rejects unsupported MIME types, oversized uploads, and out-of-range frame counts.
- Analysis errors return generic client-safe messages while server logs retain operational detail.
- Security headers are applied through `next.config.mjs`, including CSP, referrer policy, permissions policy, and frame denial.

## Verification

Run these before shipping:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm audit --omit=dev --audit-level=moderate
```

The GitHub Actions workflow runs typecheck, lint, unit tests, Playwright smoke tests, build, and dependency audit on pull requests.

## Known Follow-Up Work

- Replace anonymous deployment-identity quota buckets with authenticated user and plan-aware limits.
- Add billing and account support before enabling paid-plan claims.
- Move saved export history behind authenticated storage.
- Add observability for provider latency, extraction errors, and quota denials.
