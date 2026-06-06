# Audit Exceptions

Last reviewed: 2026-06-06

No active production dependency audit exceptions are currently accepted.

The previous `next@14.2.35` / nested `postcss` exception was closed by
upgrading to `next@16.2.7` and pinning `postcss@8.5.10` through npm overrides.

Required release check:

```bash
npm audit --omit=dev --audit-level=moderate
```

The command must exit 0 before production release.
