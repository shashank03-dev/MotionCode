# Production Ready For Paid Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert MotionCode from free beta to a reliable paid service with Razorpay subscriptions, controlled OpenAI analysis, usage credits, observability, support workflows, and cost protection.

**Architecture:** Paid access is enabled only after explicit readiness gates are met. Razorpay remains the billing system, Supabase remains the source of truth for plans and usage, and OpenAI calls are protected by a credit ledger, provider health checks, budget caps, and Gemini fallback states.

**Tech Stack:** Next.js App Router, TypeScript, Supabase/Postgres/RLS, Razorpay subscriptions/webhooks, OpenAI Responses API, Gemini API, Vitest, Playwright, Vercel.

---

## Activation Gates

Start this plan only when these gates are true:

- 100 authenticated beta users.
- 30 users have run at least 2 analyses.
- 15 early-access requests exist in `early_access_signups`.
- 5 users have explicitly confirmed willingness to pay.
- At least ₹10,000 or equivalent first-month subscription revenue is collected or contractually committed.
- OpenAI billing is active and a live canary request succeeds.
- The free beta has run for 7 days without unresolved P0/P1 production issues.

## Paid Service Rules

- Free users keep Gemini-only analysis.
- Pro and Studio users receive OpenAI-backed analysis only when `MOTIONCODE_ENABLE_OPENAI_ANALYSIS=true`.
- Paid checkout is enabled only when `MOTIONCODE_ENABLE_PAID_CHECKOUT=true`.
- Every OpenAI analysis reserves a usage credit before the API call.
- Failed OpenAI calls refund the reserved credit.
- Provider outage shows a clear user-facing message or Gemini fallback, never a silent failure.
- Admins can pause OpenAI analysis without redeploying if quota or cost spikes.
- The product never advertises unlimited AI usage.

## File Structure

- Modify `lib/contracts/launch.ts`
  - Paid feature gates already created by beta plan.
- Modify `app/pricing/page.tsx`
  - Switch Pro/Studio from early access to checkout when paid gates are enabled.
- Modify `components/pricing/EarlyAccessButton.tsx`
  - Keep for closed beta or overflow waitlist.
- Modify `app/pricing/CheckoutButton.tsx`
  - Ensure checkout is only rendered when paid checkout gate is enabled.
- Modify `app/api/analyze/handler.ts`
  - Keep OpenAI behind provider gate and add credit reservation.
- Create `lib/server/analysisCredits.ts`
  - Reserve, commit, refund analysis credits.
- Create `supabase/migrations/20260608_add_analysis_credit_ledger.sql`
  - Credit ledger and account balance.
- Modify `lib/server/openai.ts`
  - Provider error classification and request ID capture.
- Create `lib/server/providerStatus.ts`
  - Admin-controlled provider enable/disable state.
- Modify admin dashboard components
  - Show OpenAI quota health, early-access conversion, paid users, and failed analyses.
- Modify docs and launch checklist
  - Paid service operating procedure.

---

### Task 1: Confirm Paid Readiness Gates

**Files:**
- Create: `docs/ops/paid-readiness-checklist.md`
- Modify: `docs/ops/ga-readiness-report.md`

- [ ] **Step 1: Create readiness checklist**

Create `docs/ops/paid-readiness-checklist.md`:

```md
# Paid Readiness Checklist

## Required Gates

- 100 authenticated beta users.
- 30 users have run at least 2 analyses.
- 15 early-access requests are stored.
- 5 users have confirmed willingness to pay.
- ₹10,000 or equivalent first-month subscription revenue is collected or committed.
- OpenAI billing is active.
- OpenAI canary request succeeds.
- Gemini fallback remains healthy.
- No unresolved P0/P1 production issues.

## Approval

Paid launch requires founder approval recorded in `docs/ops/integration-report.md`.
```

- [ ] **Step 2: Update GA readiness report**

Add:

```md
Paid service launch remains blocked until `docs/ops/paid-readiness-checklist.md` is complete.
```

- [ ] **Step 3: Commit**

```bash
git add docs/ops/paid-readiness-checklist.md docs/ops/ga-readiness-report.md
git commit -m "docs: add paid readiness gates"
```

---

### Task 2: Add Analysis Credit Ledger

**Files:**
- Create: `supabase/migrations/20260608_add_analysis_credit_ledger.sql`
- Create: `lib/server/analysisCredits.ts`
- Create: `tests/unit/analysis-credits.test.ts`

- [ ] **Step 1: Add migration**

Create `supabase/migrations/20260608_add_analysis_credit_ledger.sql`:

```sql
create table if not exists public.analysis_credit_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id text,
  event_type text not null check (event_type in ('grant', 'reserve', 'commit', 'refund', 'expire', 'adjust')),
  amount integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analysis_credit_balances enable row level security;
alter table public.analysis_credit_ledger enable row level security;

create policy "Users can read own credit balance"
  on public.analysis_credit_balances
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read own credit ledger"
  on public.analysis_credit_ledger
  for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists analysis_credit_ledger_user_created_at_idx
  on public.analysis_credit_ledger(user_id, created_at desc);

create index if not exists analysis_credit_ledger_analysis_id_idx
  on public.analysis_credit_ledger(analysis_id);
```

- [ ] **Step 2: Write credit service tests**

Create `tests/unit/analysis-credits.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import {
  commitAnalysisCredit,
  refundAnalysisCredit,
  reserveAnalysisCredit,
} from "@/lib/server/analysisCredits";

describe("analysis credits", () => {
  it("reserves one credit before OpenAI analysis", async () => {
    const client = createCreditClient({ balance: 2 });

    await expect(
      reserveAnalysisCredit(
        { analysisId: "analysis_123", userId: "user_123" },
        { client },
      ),
    ).resolves.toEqual({ remaining: 1, reserved: true });
  });

  it("rejects reservation when balance is empty", async () => {
    const client = createCreditClient({ balance: 0 });

    await expect(
      reserveAnalysisCredit(
        { analysisId: "analysis_123", userId: "user_123" },
        { client },
      ),
    ).rejects.toMatchObject({ code: "BILLING_REQUIRED" });
  });

  it("commits and refunds reserved credits by analysis id", async () => {
    const client = createCreditClient({ balance: 1 });

    await expect(
      commitAnalysisCredit(
        { analysisId: "analysis_123", userId: "user_123" },
        { client },
      ),
    ).resolves.toEqual({ committed: true });

    await expect(
      refundAnalysisCredit(
        { analysisId: "analysis_456", userId: "user_123" },
        { client },
      ),
    ).resolves.toEqual({ refunded: true });
  });
});

function createCreditClient({ balance }: { balance: number }) {
  return {
    rpc: vi.fn(async (name: string) => {
      if (name === "reserve_analysis_credit" && balance <= 0) {
        return { data: null, error: { message: "insufficient credits" } };
      }
      if (name === "reserve_analysis_credit") {
        return { data: { remaining: balance - 1 }, error: null };
      }
      return { data: {}, error: null };
    }),
  };
}
```

- [ ] **Step 3: Implement service**

Create `lib/server/analysisCredits.ts`:

```ts
import { ApiError } from "@/lib/server/apiErrors";
import { createTrustedSupabaseServerClient } from "@/lib/server/audit";

type CreditClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

type CreditInput = {
  analysisId: string;
  userId: string;
};

function getClient(client?: CreditClient) {
  return client ?? (createTrustedSupabaseServerClient() as unknown as CreditClient);
}

export async function reserveAnalysisCredit(
  input: CreditInput,
  options: { client?: CreditClient } = {},
) {
  const { data, error } = await getClient(options.client).rpc(
    "reserve_analysis_credit",
    {
      analysis_id: input.analysisId,
      user_id: input.userId,
    },
  );

  if (error) {
    throw new ApiError("BILLING_REQUIRED", "No analysis credits available.");
  }

  const remaining =
    data && typeof data === "object" && "remaining" in data
      ? Number((data as { remaining: unknown }).remaining)
      : 0;

  return { remaining, reserved: true };
}

export async function commitAnalysisCredit(
  input: CreditInput,
  options: { client?: CreditClient } = {},
) {
  const { error } = await getClient(options.client).rpc("commit_analysis_credit", {
    analysis_id: input.analysisId,
    user_id: input.userId,
  });

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to commit analysis credit.");
  }

  return { committed: true };
}

export async function refundAnalysisCredit(
  input: CreditInput,
  options: { client?: CreditClient } = {},
) {
  const { error } = await getClient(options.client).rpc("refund_analysis_credit", {
    analysis_id: input.analysisId,
    user_id: input.userId,
  });

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to refund analysis credit.");
  }

  return { refunded: true };
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/unit/analysis-credits.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260608_add_analysis_credit_ledger.sql lib/server/analysisCredits.ts tests/unit/analysis-credits.test.ts
git commit -m "feat: add analysis credit ledger"
```

---

### Task 3: Grant Credits From Paid Subscriptions

**Files:**
- Modify: `lib/server/razorpay.ts`
- Modify: `tests/unit/razorpay.test.ts`
- Modify: `lib/contracts/plans.ts`

- [ ] **Step 1: Add monthly credit entitlement**

In `lib/contracts/plans.ts`, add to `PlanEntitlements`:

```ts
  monthlyOpenAiCredits: number;
```

Set:

```ts
free: { monthlyOpenAiCredits: 0 }
pro: { monthlyOpenAiCredits: 100 }
studio: { monthlyOpenAiCredits: 500 }
```

- [ ] **Step 2: Add Razorpay test**

In `tests/unit/razorpay.test.ts`, assert that checkout verification for `pro` grants 100 credits by inserting a ledger row:

```ts
expect(insert).toHaveBeenCalledWith(
  expect.objectContaining({
    amount: 100,
    event_type: "grant",
    reason: "subscription_active",
    user_id: "user_123",
  }),
);
```

- [ ] **Step 3: Implement credit grant**

In `lib/server/razorpay.ts`, after verified subscription state updates profile plan tier, insert into `analysis_credit_ledger` and upsert `analysis_credit_balances` using the plan’s `monthlyOpenAiCredits`.

Use this behavior:

- `pro` grants 100 credits per paid period.
- `studio` grants 500 credits per paid period.
- `free` grants 0 credits.
- Duplicate webhook events must not double-grant credits; use Razorpay event ID or subscription period key in metadata.

- [ ] **Step 4: Run billing tests**

```bash
npm test -- tests/unit/razorpay.test.ts tests/unit/entitlements.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/contracts/plans.ts lib/server/razorpay.ts tests/unit/razorpay.test.ts tests/unit/entitlements.test.ts
git commit -m "feat: grant analysis credits from paid subscriptions"
```

---

### Task 4: Reserve Credits Around OpenAI Calls

**Files:**
- Modify: `app/api/analyze/handler.ts`
- Modify: `tests/unit/analyze-api.test.ts`

- [ ] **Step 1: Add tests for reserve, commit, and refund**

Add tests:

```ts
it("reserves and commits a credit around paid OpenAI analysis", async () => {
  const { handleAnalyzeRequest } = await import("@/app/api/analyze/handler");
  const deps = createDeps({ planTier: "pro" });
  const reserveAnalysisCredit = vi.fn(async () => ({ remaining: 99, reserved: true }));
  const commitAnalysisCredit = vi.fn(async () => ({ committed: true }));
  const refundAnalysisCredit = vi.fn(async () => ({ refunded: true }));

  const response = await handleAnalyzeRequest(makeRequest(requestBody()), {
    ...deps,
    commitAnalysisCredit,
    isOpenAiAnalysisEnabled: () => true,
    refundAnalysisCredit,
    reserveAnalysisCredit,
  });

  expect(response.status).toBe(200);
  expect(reserveAnalysisCredit).toHaveBeenCalledBefore(deps.generateOpenAiAnalysis);
  expect(commitAnalysisCredit).toHaveBeenCalledWith({
    analysisId: "analysis_123",
    userId: "user_123",
  });
  expect(refundAnalysisCredit).not.toHaveBeenCalled();
});

it("refunds a reserved credit when OpenAI analysis fails", async () => {
  const { handleAnalyzeRequest } = await import("@/app/api/analyze/handler");
  const deps = createDeps({ planTier: "pro" });
  deps.generateOpenAiAnalysis.mockRejectedValue(
    new ApiError("MODEL_FAILED", "OpenAI analysis failed."),
  );
  const refundAnalysisCredit = vi.fn(async () => ({ refunded: true }));

  const response = await handleAnalyzeRequest(makeRequest(requestBody()), {
    ...deps,
    isOpenAiAnalysisEnabled: () => true,
    refundAnalysisCredit,
    reserveAnalysisCredit: vi.fn(async () => ({ remaining: 99, reserved: true })),
  });

  expect(response.status).toBe(502);
  expect(refundAnalysisCredit).toHaveBeenCalledWith({
    analysisId: "analysis_123",
    userId: "user_123",
  });
});
```

- [ ] **Step 2: Add dependencies to route**

In `AnalyzeRouteDeps`, add:

```ts
  commitAnalysisCredit?: (input: { analysisId: string; userId: string }) => Promise<unknown>;
  refundAnalysisCredit?: (input: { analysisId: string; userId: string }) => Promise<unknown>;
  reserveAnalysisCredit?: (input: { analysisId: string; userId: string }) => Promise<unknown>;
```

Default them from `lib/server/analysisCredits.ts`.

- [ ] **Step 3: Reserve before OpenAI**

Before `runModelAnalysis`, if `analysisProvider.model === DEFAULT_OPENAI_ANALYSIS_MODEL`, call:

```ts
await resolvedDeps.reserveAnalysisCredit({
  analysisId,
  userId: user.id,
});
```

- [ ] **Step 4: Commit or refund**

On successful OpenAI analysis, call `commitAnalysisCredit`. On model failure, call `refundAnalysisCredit`. Do not refund if reservation failed before model call.

- [ ] **Step 5: Run tests**

```bash
npm test -- tests/unit/analyze-api.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/analyze/handler.ts tests/unit/analyze-api.test.ts
git commit -m "feat: protect OpenAI analysis with credits"
```

---

### Task 5: Add Provider Health And Admin Pause

**Files:**
- Create: `lib/server/providerStatus.ts`
- Create: `supabase/migrations/20260608_add_provider_status.sql`
- Modify: `app/api/analyze/handler.ts`
- Modify: admin dashboard components.

- [ ] **Step 1: Add provider status table**

Create migration:

```sql
create table if not exists public.provider_status (
  provider text primary key check (provider in ('gemini', 'openai')),
  enabled boolean not null default true,
  status text not null default 'healthy' check (status in ('healthy', 'degraded', 'paused')),
  message text,
  updated_at timestamptz not null default now()
);

insert into public.provider_status(provider, enabled, status)
values ('gemini', true, 'healthy'), ('openai', false, 'paused')
on conflict (provider) do nothing;

alter table public.provider_status enable row level security;
```

- [ ] **Step 2: Add provider status helper**

Create `lib/server/providerStatus.ts`:

```ts
import { createTrustedSupabaseServerClient } from "@/lib/server/audit";

export async function isProviderEnabled(provider: "gemini" | "openai") {
  const client = createTrustedSupabaseServerClient();
  const { data, error } = await client
    .from("provider_status")
    .select("enabled,status")
    .eq("provider", provider)
    .limit(1)
    .single();

  if (error || !data) {
    return false;
  }

  return data.enabled === true && data.status !== "paused";
}
```

- [ ] **Step 3: Use provider status in analysis route**

OpenAI analysis should require:

```ts
isOpenAiAnalysisEnabled() && await isProviderEnabled("openai")
```

If OpenAI is disabled or paused, route to Gemini or return a planned maintenance message depending on plan policy.

- [ ] **Step 4: Add admin UI**

Admin dashboard should show:

- OpenAI enabled/paused.
- Last 24h OpenAI failure count.
- Last 24h analysis count by provider.

- [ ] **Step 5: Commit**

```bash
git add lib/server/providerStatus.ts supabase/migrations/20260608_add_provider_status.sql app/api/analyze/handler.ts components/admin/AdminDashboard.tsx
git commit -m "feat: add provider health controls"
```

---

### Task 6: Switch Pricing From Early Access To Paid Checkout

**Files:**
- Modify: `app/pricing/page.tsx`
- Modify: `app/pricing/CheckoutButton.tsx`
- Modify: `components/pricing/EarlyAccessButton.tsx`
- Add or modify pricing tests.

- [ ] **Step 1: Add pricing behavior test**

Test paid phase:

```ts
process.env.MOTIONCODE_LAUNCH_PHASE = "paid";
process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";

expect(renderedHtml).toContain("Pay with Razorpay");
expect(renderedHtml).not.toContain("Join early access");
```

Test beta phase:

```ts
process.env.MOTIONCODE_LAUNCH_PHASE = "beta";

expect(renderedHtml).toContain("Join early access");
expect(renderedHtml).not.toContain("Pay with Razorpay");
```

- [ ] **Step 2: Gate checkout rendering**

In `app/pricing/page.tsx`:

```ts
const paidCheckoutEnabled = isPaidCheckoutEnabled();
```

Render:

```tsx
{paidCheckoutEnabled ? (
  <CheckoutButton planTier={tier} />
) : (
  <EarlyAccessButton planTier={tier} />
)}
```

- [ ] **Step 3: Verify**

```bash
npm test -- tests/unit/auth-dashboard-pages.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/pricing/page.tsx app/pricing/CheckoutButton.tsx components/pricing/EarlyAccessButton.tsx tests/unit/auth-dashboard-pages.test.ts
git commit -m "feat: gate pricing checkout by launch phase"
```

---

### Task 7: Production Observability And Cost Controls

**Files:**
- Modify: `lib/server/observability.ts`
- Modify: `app/api/analyze/handler.ts`
- Modify: `docs/ops/integration-report.md`

- [ ] **Step 1: Add provider metrics**

Record:

- `provider`: `gemini` or `openai`.
- `model`.
- `planTier`.
- `analysisId`.
- `outcome`.
- `durationMs`.
- `creditReserved`.
- `creditRefunded`.

- [ ] **Step 2: Add daily cost guard**

Create env:

```md
MOTIONCODE_DAILY_OPENAI_ANALYSIS_LIMIT=100
```

In the route, before OpenAI call, count daily OpenAI `analysis.started` events. If over limit, return:

```ts
apiError("QUOTA_EXCEEDED", "Premium analysis is temporarily at capacity.")
```

- [ ] **Step 3: Add tests**

In `tests/unit/analyze-api.test.ts`, verify OpenAI calls are blocked when the daily provider cap is reached.

- [ ] **Step 4: Commit**

```bash
git add lib/server/observability.ts app/api/analyze/handler.ts tests/unit/analyze-api.test.ts docs/ops/integration-report.md
git commit -m "feat: add OpenAI usage guardrails"
```

---

### Task 8: Paid Launch Verification

**Files:**
- Modify: `launch-checklist.md`
- Modify: `docs/ops/integration-report.md`

- [ ] **Step 1: Run automated checks**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: every command exits 0.

- [ ] **Step 2: Run live provider canary**

Use a synthetic two-frame request and verify:

- OpenAI returns HTTP 200.
- Parsed JSON contains all required output keys.
- Usage data is recorded.
- No user data is sent in canary.

- [ ] **Step 3: Run staging payment smoke**

In Razorpay test mode:

1. Subscribe to Pro.
2. Verify subscription webhook updates `subscriptions`.
3. Verify profile plan tier becomes `pro`.
4. Verify analysis credits are granted.
5. Run one Pro analysis.
6. Verify one credit is reserved and committed.
7. Cancel subscription.
8. Verify future entitlements return to `free`.

- [ ] **Step 4: Record verification**

Update `docs/ops/integration-report.md` with:

```md
## Paid Launch Verification

- Typecheck: passed.
- Lint: passed.
- Unit/integration tests: passed.
- Build: passed.
- OpenAI canary: passed.
- Razorpay test checkout: passed.
- Credit reservation/commit/refund: passed.
```

- [ ] **Step 5: Commit verification**

```bash
git add launch-checklist.md docs/ops/integration-report.md
git commit -m "docs: record paid launch verification"
```

---

## Rollback Plan

If paid launch has quota, billing, or provider issues:

1. Set `MOTIONCODE_LAUNCH_PHASE=beta`.
2. Set `MOTIONCODE_ENABLE_PAID_CHECKOUT=false`.
3. Set `MOTIONCODE_ENABLE_OPENAI_ANALYSIS=false`.
4. Set OpenAI provider status to `paused`.
5. Redeploy.
6. Confirm Pro/Studio pricing returns to early-access CTAs.
7. Confirm `/api/analyze` no longer calls OpenAI.
8. Email affected paid users with credit/refund policy.

## Paid Launch Exit Criteria

Production-ready paid service is complete when:

- Razorpay checkout and webhooks work in production.
- Paid users receive credits and plan entitlements.
- OpenAI calls are gated by launch phase, provider status, and credit balance.
- Failed OpenAI calls refund credits.
- Admin can pause OpenAI.
- Daily OpenAI usage caps prevent runaway spend.
- Free users continue to work on Gemini.
- Docs and support workflows explain paid access clearly.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.
