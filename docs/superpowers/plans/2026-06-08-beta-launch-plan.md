# Beta Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship MotionCode as a safe Gemini-only free beta that lets users test the core value, join early access, and avoids OpenAI/Razorpay cost exposure until the business has demand.

**Architecture:** Add explicit launch-phase controls, force analysis to the free Gemini path during beta, replace paid checkout CTAs with early-access capture, and record early-user intent in Supabase. Keep the paid infrastructure in source, but gate it behind clear feature switches so the paid launch can be enabled without rewriting the product.

**Tech Stack:** Next.js App Router, TypeScript, Supabase/Postgres/RLS, Vitest, existing MotionCode API contracts, Gemini server API.

---

## Product Rules For Beta

- Free beta is the only live product mode.
- All analysis requests use Gemini, even if a user has a `pro` or `studio` tag from admin testing.
- Razorpay checkout is hidden from public UI during beta.
- Users can request early access to Pro/Studio.
- Early-access users are recorded in a dedicated table and visible from admin/support workflows.
- OpenAI is not called during beta.
- Existing `OPENAI_API_KEY` can stay configured, but the app must not depend on OpenAI quota in beta.

## Beta Success Thresholds

Use these numbers to decide when to begin the paid-readiness plan:

- 100 authenticated beta users.
- 30 users run at least 2 analyses.
- 15 users request early access after seeing generated output.
- 5 users explicitly say they would pay for Pro or Studio.
- Gemini quota remains stable for 7 consecutive days.
- No unresolved P0/P1 security or billing bugs.

## File Structure

- Create `lib/contracts/launch.ts`
  - Central launch phase and feature gates.
- Create `tests/unit/launch.test.ts`
  - Verifies beta defaults and paid feature gates.
- Modify `app/api/analyze/handler.ts`
  - Route all beta analyses to Gemini and avoid OpenAI.
- Modify `tests/unit/analyze-api.test.ts`
  - Add regression coverage for beta provider routing.
- Create `supabase/migrations/20260608_add_early_access_signups.sql`
  - Stores early-access intent.
- Create `app/api/early-access/route.ts`
  - Authenticated endpoint to join early access.
- Create `components/pricing/EarlyAccessButton.tsx`
  - Client CTA for Pro/Studio early access.
- Modify `app/pricing/page.tsx`
  - Replace checkout buttons with early-access buttons during beta.
- Modify `app/account/page.tsx`
  - Show early-access status to the signed-in user.
- Modify `app/admin/page.tsx` or `components/admin/AdminDashboard.tsx`
  - Add early-access count and recent signups.
- Modify docs: `README.md`, `docs/product/complete-product-scope.md`, `docs/product/user-workflows.md`, `docs/ops/environment.md`, `launch-checklist.md`
  - Align public docs with beta-only behavior.

---

### Task 1: Add Launch Feature Gates

**Files:**
- Create: `lib/contracts/launch.ts`
- Create: `tests/unit/launch.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/launch.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  getLaunchPhase,
  isEarlyAccessEnabled,
  isOpenAiAnalysisEnabled,
  isPaidCheckoutEnabled,
} from "@/lib/contracts/launch";

describe("launch feature gates", () => {
  it("defaults to beta with early access enabled and paid systems disabled", () => {
    expect(getLaunchPhase({})).toBe("beta");
    expect(isEarlyAccessEnabled({})).toBe(true);
    expect(isPaidCheckoutEnabled({})).toBe(false);
    expect(isOpenAiAnalysisEnabled({})).toBe(false);
  });

  it("enables paid checkout and OpenAI only in paid phase with explicit switches", () => {
    const env = {
      MOTIONCODE_LAUNCH_PHASE: "paid",
      MOTIONCODE_ENABLE_PAID_CHECKOUT: "true",
      MOTIONCODE_ENABLE_OPENAI_ANALYSIS: "true",
    };

    expect(getLaunchPhase(env)).toBe("paid");
    expect(isPaidCheckoutEnabled(env)).toBe(true);
    expect(isOpenAiAnalysisEnabled(env)).toBe(true);
  });

  it("keeps paid systems disabled when switches are true but phase is beta", () => {
    const env = {
      MOTIONCODE_LAUNCH_PHASE: "beta",
      MOTIONCODE_ENABLE_PAID_CHECKOUT: "true",
      MOTIONCODE_ENABLE_OPENAI_ANALYSIS: "true",
    };

    expect(isPaidCheckoutEnabled(env)).toBe(false);
    expect(isOpenAiAnalysisEnabled(env)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/launch.test.ts
```

Expected: FAIL because `@/lib/contracts/launch` does not exist.

- [ ] **Step 3: Add the launch contract**

Create `lib/contracts/launch.ts`:

```ts
export const LAUNCH_PHASES = ["beta", "paid"] as const;

export type LaunchPhase = (typeof LAUNCH_PHASES)[number];

type EnvLike = Record<string, string | undefined>;

export function getLaunchPhase(env: EnvLike = process.env): LaunchPhase {
  return env.MOTIONCODE_LAUNCH_PHASE === "paid" ? "paid" : "beta";
}

export function isEarlyAccessEnabled(env: EnvLike = process.env) {
  return getLaunchPhase(env) === "beta";
}

export function isPaidCheckoutEnabled(env: EnvLike = process.env) {
  return (
    getLaunchPhase(env) === "paid" &&
    env.MOTIONCODE_ENABLE_PAID_CHECKOUT === "true"
  );
}

export function isOpenAiAnalysisEnabled(env: EnvLike = process.env) {
  return (
    getLaunchPhase(env) === "paid" &&
    env.MOTIONCODE_ENABLE_OPENAI_ANALYSIS === "true"
  );
}
```

- [ ] **Step 4: Verify the launch tests pass**

Run:

```bash
npm test -- tests/unit/launch.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/contracts/launch.ts tests/unit/launch.test.ts
git commit -m "feat: add launch phase gates"
```

---

### Task 2: Force Gemini Analysis During Beta

**Files:**
- Modify: `app/api/analyze/handler.ts`
- Modify: `tests/unit/analyze-api.test.ts`

- [ ] **Step 1: Write the failing route test**

Add this test inside `describe("POST /api/analyze", ...)` in `tests/unit/analyze-api.test.ts`:

```ts
it("uses Gemini for paid-plan users while OpenAI analysis is disabled", async () => {
  const { handleAnalyzeRequest } = await import("@/app/api/analyze/handler");
  const deps = createDeps({ planTier: "pro" });

  const response = await handleAnalyzeRequest(
    makeRequest(requestBody({ model: "gemini-2.5-pro" })),
    {
      ...deps,
      isOpenAiAnalysisEnabled: () => false,
    },
  );
  const json = (await response.json()) as ApiResponse<AnalysisResult>;

  expect(response.status).toBe(200);
  expect(json).toMatchObject({
    data: {
      model: "gemini-2.5-pro",
      outputs: generated.outputs,
      spec,
    },
    ok: true,
  });
  expect(deps.generateAnalysis).toHaveBeenCalledWith({
    frames: [VALID_JPEG_BASE64],
    model: "gemini-2.5-pro",
  });
  expect(deps.generateOpenAiAnalysis).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run:

```bash
npm test -- tests/unit/analyze-api.test.ts
```

Expected: FAIL because `isOpenAiAnalysisEnabled` is not an accepted dependency and paid tiers still route to OpenAI.

- [ ] **Step 3: Add the dependency and default gate**

In `app/api/analyze/handler.ts`, import the gate:

```ts
import { isOpenAiAnalysisEnabled as getOpenAiAnalysisGate } from "@/lib/contracts/launch";
```

Extend `AnalyzeRouteDeps`:

```ts
  isOpenAiAnalysisEnabled?: () => boolean;
```

Add it to `resolveAnalyzeDeps`:

```ts
    isOpenAiAnalysisEnabled:
      deps.isOpenAiAnalysisEnabled ?? (() => getOpenAiAnalysisGate()),
```

- [ ] **Step 4: Change provider routing**

In `resolveAnalysisProvider`, change the paid branch condition:

```ts
  if (planTier === "free" || !resolvedDeps.isOpenAiAnalysisEnabled()) {
    return {
      generate: () =>
        resolvedDeps.generateAnalysis({
          frames: requestBody.frames,
          model: requestBody.model,
        }),
      model: requestBody.model,
    };
  }
```

Keep the existing OpenAI branch after that block.

- [ ] **Step 5: Verify analyze tests pass**

Run:

```bash
npm test -- tests/unit/analyze-api.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/analyze/handler.ts tests/unit/analyze-api.test.ts
git commit -m "feat: gate OpenAI analysis behind paid launch flag"
```

---

### Task 3: Add Early Access Signup Storage

**Files:**
- Create: `supabase/migrations/20260608_add_early_access_signups.sql`
- Modify: `types/database.ts`
- Create or modify: `tests/integration/rls-policies.test.ts`

- [ ] **Step 1: Add the migration**

Create `supabase/migrations/20260608_add_early_access_signups.sql`:

```sql
create table if not exists public.early_access_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  desired_plan text not null check (desired_plan in ('pro', 'studio')),
  status text not null default 'requested' check (status in ('requested', 'invited', 'converted', 'closed')),
  source text not null default 'pricing',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, desired_plan)
);

alter table public.early_access_signups enable row level security;

create policy "Users can read own early access signups"
  on public.early_access_signups
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can request own early access"
  on public.early_access_signups
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can refresh own early access request"
  on public.early_access_signups
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'requested')
  with check (auth.uid() = user_id and status = 'requested');

create index if not exists early_access_signups_user_id_idx
  on public.early_access_signups(user_id);

create index if not exists early_access_signups_status_created_at_idx
  on public.early_access_signups(status, created_at desc);
```

- [ ] **Step 2: Add RLS test coverage**

In `tests/integration/rls-policies.test.ts`, add assertions that the migration contains:

```ts
expect(sql).toMatch(/create table if not exists public\.early_access_signups/i);
expect(sql).toMatch(/alter table public\.early_access_signups enable row level security/i);
expect(sql).toMatch(/auth\.uid\(\) = user_id/i);
```

- [ ] **Step 3: Run integration policy tests**

Run:

```bash
npm test -- tests/integration/rls-policies.test.ts
```

Expected: PASS.

- [ ] **Step 4: Update generated database types**

Run the project’s existing Supabase type generation workflow. If no live Supabase CLI is available locally, update `types/database.ts` by following the existing table type patterns and add `early_access_signups` with `Row`, `Insert`, and `Update` shapes.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260608_add_early_access_signups.sql types/database.ts tests/integration/rls-policies.test.ts
git commit -m "feat: add early access signup storage"
```

---

### Task 4: Add Early Access API

**Files:**
- Create: `app/api/early-access/route.ts`
- Create: `lib/server/earlyAccess.ts`
- Create: `tests/unit/early-access.test.ts`

- [ ] **Step 1: Write failing API tests**

Create `tests/unit/early-access.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import type { PlanTier } from "@/lib/contracts/plans";

const user = { email: "founder@example.com", id: "user_123" };

describe("early access API", () => {
  it("rejects anonymous requests", async () => {
    const { handleEarlyAccessRequest } = await import("@/lib/server/earlyAccess");

    const response = await handleEarlyAccessRequest(
      new Request("https://motioncode.test/api/early-access", {
        body: JSON.stringify({ desiredPlan: "pro" }),
        method: "POST",
      }),
      {
        getCurrentUser: vi.fn(async () => null),
        upsertSignup: vi.fn(),
      },
    );

    expect(response.status).toBe(401);
  });

  it("records a pro early access request for the current user", async () => {
    const upsertSignup = vi.fn(async () => ({
      desiredPlan: "pro" as Extract<PlanTier, "pro" | "studio">,
      status: "requested" as const,
    }));
    const { handleEarlyAccessRequest } = await import("@/lib/server/earlyAccess");

    const response = await handleEarlyAccessRequest(
      new Request("https://motioncode.test/api/early-access", {
        body: JSON.stringify({ desiredPlan: "pro" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      {
        getCurrentUser: vi.fn(async () => user),
        upsertSignup,
      },
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      data: { desiredPlan: "pro", status: "requested" },
      ok: true,
    });
    expect(upsertSignup).toHaveBeenCalledWith({
      desiredPlan: "pro",
      email: "founder@example.com",
      source: "pricing",
      userId: "user_123",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- tests/unit/early-access.test.ts
```

Expected: FAIL because `@/lib/server/earlyAccess` does not exist.

- [ ] **Step 3: Implement server handler**

Create `lib/server/earlyAccess.ts`:

```ts
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/server/apiErrors";
import { createTrustedSupabaseServerClient } from "@/lib/server/audit";
import { getCurrentUser as getSupabaseCurrentUser } from "@/lib/supabase/server";

const EarlyAccessRequestSchema = z.object({
  desiredPlan: z.enum(["pro", "studio"]),
});

type EarlyAccessUser = {
  email?: string | null;
  id: string;
};

type EarlyAccessInput = {
  desiredPlan: "pro" | "studio";
  email?: string | null;
  source: string;
  userId: string;
};

type EarlyAccessDeps = {
  getCurrentUser?: () => Promise<EarlyAccessUser | null>;
  upsertSignup?: (input: EarlyAccessInput) => Promise<{
    desiredPlan: "pro" | "studio";
    status: "requested" | "invited" | "converted" | "closed";
  }>;
};

export async function handleEarlyAccessRequest(
  request: Request,
  deps: EarlyAccessDeps = {},
) {
  const getCurrentUser = deps.getCurrentUser ?? getSupabaseCurrentUser;
  const upsertSignup = deps.upsertSignup ?? upsertEarlyAccessSignup;
  const user = await getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to request early access.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const parsed = EarlyAccessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Choose Pro or Studio early access.");
  }

  const signup = await upsertSignup({
    desiredPlan: parsed.data.desiredPlan,
    email: user.email,
    source: "pricing",
    userId: user.id,
  });

  return apiSuccess(signup);
}

async function upsertEarlyAccessSignup(input: EarlyAccessInput) {
  const client = createTrustedSupabaseServerClient();
  const { data, error } = await client
    .from("early_access_signups")
    .upsert(
      {
        desired_plan: input.desiredPlan,
        email: input.email ?? null,
        source: input.source,
        updated_at: new Date().toISOString(),
        user_id: input.userId,
      },
      { onConflict: "user_id,desired_plan" },
    )
    .select("desired_plan,status")
    .single();

  if (error) {
    return Promise.reject(new Error("Failed to record early access request."));
  }

  return {
    desiredPlan: data.desired_plan as "pro" | "studio",
    status: data.status as "requested" | "invited" | "converted" | "closed",
  };
}
```

- [ ] **Step 4: Add route wrapper**

Create `app/api/early-access/route.ts`:

```ts
import { handleEarlyAccessRequest } from "@/lib/server/earlyAccess";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleEarlyAccessRequest(request);
}
```

- [ ] **Step 5: Verify tests pass**

Run:

```bash
npm test -- tests/unit/early-access.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/early-access/route.ts lib/server/earlyAccess.ts tests/unit/early-access.test.ts
git commit -m "feat: add early access request API"
```

---

### Task 5: Replace Paid Checkout CTAs With Early Access CTAs

**Files:**
- Create: `components/pricing/EarlyAccessButton.tsx`
- Modify: `app/pricing/page.tsx`
- Modify: `tests/unit/auth-dashboard-pages.test.ts` or add `tests/unit/pricing-page.test.tsx` following existing page test patterns.

- [ ] **Step 1: Write failing UI behavior test**

Add a pricing page test that asserts:

```ts
expect(renderedHtml).toContain("Join early access");
expect(renderedHtml).not.toContain("Pay with Razorpay");
```

Use the existing page rendering test setup in `tests/unit/auth-dashboard-pages.test.ts` as the local pattern.

- [ ] **Step 2: Add `EarlyAccessButton`**

Create `components/pricing/EarlyAccessButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { PlanTier } from "@/lib/contracts/plans";

type EarlyAccessButtonProps = {
  planTier: Extract<PlanTier, "pro" | "studio">;
};

export function EarlyAccessButton({ planTier }: EarlyAccessButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  async function requestEarlyAccess() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/early-access", {
        body: JSON.stringify({ desiredPlan: planTier }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<{
        desiredPlan: "pro" | "studio";
        status: string;
      }>;

      if (!json.ok) {
        setError(json.message);
        return;
      }

      setRequested(true);
    } catch {
      setError("Early access request could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 border border-[#00ff88]/60 bg-[#00ff88]/10 px-4 font-mono text-xs font-bold text-[#00ff88] transition-colors hover:bg-[#00ff88]/15 disabled:opacity-60"
        disabled={loading || requested}
        onClick={requestEarlyAccess}
        type="button"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {requested ? "Early access requested" : "Join early access"}
      </button>
      {error ? <p className="text-xs leading-5 text-red-200">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 3: Replace checkout import and usage**

In `app/pricing/page.tsx`, replace:

```ts
import { CheckoutButton } from "./CheckoutButton";
```

with:

```ts
import { EarlyAccessButton } from "@/components/pricing/EarlyAccessButton";
```

Replace the paid-tier CTA block with:

```tsx
<EarlyAccessButton planTier={tier} />
```

Change paid copy:

```ts
pro: {
  cta: "Join early access",
  description: "For early users who want priority access when Pro opens.",
  price: "Early",
},
studio: {
  cta: "Join early access",
  description: "For teams that want first access to Studio workflows.",
  price: "Early",
},
```

- [ ] **Step 4: Verify UI tests pass**

Run the pricing/page test command used in Step 1.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/pricing/page.tsx components/pricing/EarlyAccessButton.tsx tests/unit/auth-dashboard-pages.test.ts
git commit -m "feat: replace paid checkout with early access CTA"
```

---

### Task 6: Show Early Access Status On Account And Admin

**Files:**
- Modify: `app/account/page.tsx`
- Modify: `components/admin/AdminDashboard.tsx`
- Modify: `lib/server/entitlements.ts` or create `lib/server/earlyAccessAdmin.ts`
- Add tests following existing admin/account page patterns.

- [ ] **Step 1: Add account status query**

Create `lib/server/earlyAccessAdmin.ts`:

```ts
import { createTrustedSupabaseServerClient } from "@/lib/server/audit";

export type EarlyAccessSignupSummary = {
  createdAt: string;
  desiredPlan: "pro" | "studio";
  status: "requested" | "invited" | "converted" | "closed";
};

export async function getEarlyAccessForUser(userId: string) {
  const client = createTrustedSupabaseServerClient();
  const { data, error } = await client
    .from("early_access_signups")
    .select("desired_plan,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => ({
    createdAt: row.created_at,
    desiredPlan: row.desired_plan,
    status: row.status,
  })) as EarlyAccessSignupSummary[];
}
```

- [ ] **Step 2: Render account early-access status**

In `app/account/page.tsx`, load:

```ts
const earlyAccess = await getEarlyAccessForUser(user.id);
```

Add a panel near Billing:

```tsx
<Panel
  icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
  title="Early access"
>
  {earlyAccess.length ? (
    <dl className="grid gap-4 text-sm">
      {earlyAccess.map((signup) => (
        <Detail
          key={signup.desiredPlan}
          label={titleCase(signup.desiredPlan)}
          value={titleCase(signup.status)}
        />
      ))}
    </dl>
  ) : (
    <p className="text-sm leading-6 text-[var(--muted)]">
      No early access request yet.
    </p>
  )}
</Panel>
```

- [ ] **Step 3: Add admin dashboard summary**

In the admin dashboard data loader, count rows by `status = requested` and display:

```tsx
<Metric label="Early access requests" value={String(data.earlyAccess.requested)} />
```

Follow the existing `AdminDashboard` metric/card pattern.

- [ ] **Step 4: Verify account/admin tests**

Run:

```bash
npm test -- tests/unit/auth-dashboard-pages.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/account/page.tsx components/admin/AdminDashboard.tsx lib/server/earlyAccessAdmin.ts tests/unit/auth-dashboard-pages.test.ts
git commit -m "feat: surface early access status"
```

---

### Task 7: Align Beta Copy And Docs

**Files:**
- Modify: `README.md`
- Modify: `docs/product/complete-product-scope.md`
- Modify: `docs/product/user-workflows.md`
- Modify: `docs/ops/environment.md`
- Modify: `launch-checklist.md`
- Modify: `security-exceptions.md`

- [ ] **Step 1: Update product docs**

Use this core statement consistently:

```md
MotionCode is in free beta. Free beta analysis uses Gemini only. Pro and Studio are early-access tracks; paid checkout and OpenAI-backed analysis stay disabled until the paid readiness gates are met.
```

- [ ] **Step 2: Update environment docs**

Document:

```md
- `MOTIONCODE_LAUNCH_PHASE`: `beta` by default. Use `paid` only after paid readiness is approved.
- `MOTIONCODE_ENABLE_PAID_CHECKOUT`: must be `false` or unset during beta.
- `MOTIONCODE_ENABLE_OPENAI_ANALYSIS`: must be `false` or unset during beta.
```

- [ ] **Step 3: Update launch checklist**

Add beta checks:

```md
- Pricing page shows early-access CTAs, not Razorpay checkout.
- `/api/analyze` does not call OpenAI in beta.
- Early access requests are persisted and visible to admins.
- Vercel does not expose AI provider keys with `NEXT_PUBLIC_`.
```

- [ ] **Step 4: Commit docs**

```bash
git add README.md docs/product/complete-product-scope.md docs/product/user-workflows.md docs/ops/environment.md launch-checklist.md security-exceptions.md
git commit -m "docs: document free beta launch mode"
```

---

### Task 8: Final Beta Verification

**Files:**
- All files changed in Tasks 1-7.

- [ ] **Step 1: Run unit and integration tests**

Run:

```bash
npm test
```

Expected: all test files pass.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit code 0.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: exit code 0.

- [ ] **Step 5: Manual staging smoke test**

In Vercel preview or local dev:

1. Sign in.
2. Run a free analysis in `/app`.
3. Confirm the analysis completes using Gemini.
4. Open `/pricing`.
5. Confirm Pro/Studio buttons say “Join early access”.
6. Click Pro early access.
7. Confirm `/api/early-access` returns success.
8. Open `/account`.
9. Confirm early access status appears.
10. Confirm no request is sent to `/api/razorpay/checkout`.
11. Confirm no request is sent to OpenAI.

- [ ] **Step 6: Commit verification notes**

Update `docs/ops/integration-report.md` with the commands and staging smoke result, then commit:

```bash
git add docs/ops/integration-report.md
git commit -m "docs: record beta launch verification"
```

---

## Rollback Plan

If beta checkout or analysis behaves incorrectly:

1. Set `MOTIONCODE_LAUNCH_PHASE=beta`.
2. Unset `MOTIONCODE_ENABLE_PAID_CHECKOUT`.
3. Unset `MOTIONCODE_ENABLE_OPENAI_ANALYSIS`.
4. Redeploy.
5. Confirm `/pricing` shows early-access CTAs.
6. Confirm `/api/analyze` records Gemini model IDs only.

## Beta Launch Exit Criteria

The beta implementation is complete when:

- Paid checkout is not reachable from public UI.
- OpenAI is not called by `/api/analyze` during beta.
- Early-access requests are persisted per user and desired plan.
- Account/admin surfaces show early-access demand.
- Docs and launch checklist match free beta behavior.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.
