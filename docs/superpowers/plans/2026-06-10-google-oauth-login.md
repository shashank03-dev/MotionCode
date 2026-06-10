# Google OAuth Login Production Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-managed Google OAuth alongside existing magic-link login without breaking production auth, deep links, or account data flows.

**Architecture:** Keep `/login` as the single auth entry point, use the existing `/auth/callback` code-exchange route for both Google OAuth and magic links, and add small shared helpers for safe `next` handling. Bootstrap profile rows server-side after successful auth callback so new OAuth users can create workspaces and projects.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Supabase Auth/SSR, Vitest, Playwright.

---

### Task 1: Auth Redirect Helpers

**Files:**
- Create: `lib/auth/redirects.ts`
- Test: `tests/unit/auth-redirects.test.ts`

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Implement `normalizeAuthNextPath()` and `loginPathForNext()`**
- [ ] **Step 3: Run `npm test -- tests/unit/auth-redirects.test.ts`**

### Task 2: Login Page And Google OAuth

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `components/dashboard/login-form.tsx`
- Test: `tests/unit/login-form.test.tsx`
- Test: `tests/e2e/auth-dashboard.spec.ts`

- [ ] **Step 1: Write failing login form tests**
- [ ] **Step 2: Add Google OAuth button and keep magic-link fallback**
- [ ] **Step 3: Pass normalized `next` from `/login` into `LoginForm`**
- [ ] **Step 4: Run focused unit and e2e tests**

### Task 3: Callback Profile Bootstrap

**Files:**
- Create: `lib/server/profiles.ts`
- Modify: `app/auth/callback/route.ts`
- Test: `tests/unit/auth-dashboard-pages.test.ts`

- [ ] **Step 1: Write failing callback/profile tests**
- [ ] **Step 2: Exchange code, read verified user, ensure profile, redirect safely**
- [ ] **Step 3: Log and safely redirect callback failures**

### Task 4: Local Session Sign-Out

**Files:**
- Create: `app/auth/signout/route.ts`
- Create: `components/auth/sign-out-button.tsx`
- Modify: authenticated dashboard/account/support/admin surfaces
- Test: `tests/unit/sign-out.test.ts`

- [ ] **Step 1: Write failing sign-out tests**
- [ ] **Step 2: Add POST-only route using `signOut({ scope: "local" })`**
- [ ] **Step 3: Add visible sign-out controls on authenticated surfaces**

### Task 5: Verification And Production Notes

**Files:**
- Modify: `README.md`
- Modify: `docs/ops/environment.md`
- Modify: `launch-checklist.md`

- [ ] **Step 1: Document Supabase Google OAuth setup and redirect allowlist**
- [ ] **Step 2: Run focused tests**
- [ ] **Step 3: Run `npm run check`**
