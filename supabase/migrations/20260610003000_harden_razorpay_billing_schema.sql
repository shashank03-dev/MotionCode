create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'razorpay'),
  event_id text not null,
  event_type text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.billing_webhook_events enable row level security;

comment on table public.billing_webhook_events is
  'Server-only idempotency ledger for processed payment provider webhook events.';

alter policy "authenticated users can create their profile"
  on public.profiles
  with check (
    id = (select auth.uid())
    and plan_tier = 'free'
    and is_internal_admin = false
    and razorpay_customer_id is null
    and deleted_at is null
  );

do $$
declare
  has_legacy_profile_identity boolean := false;
  has_legacy_subscription_identity boolean := false;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'stripe_customer_id'
  ) then
    execute
      'select exists (
        select 1
        from public.profiles
        where stripe_customer_id is not null
          and razorpay_customer_id is null
      )'
      into has_legacy_profile_identity;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subscriptions'
      and column_name = 'stripe_subscription_id'
  ) then
    execute
      'select exists (
        select 1
        from public.subscriptions
        where (stripe_customer_id is not null or stripe_subscription_id is not null)
          and (
            payment_provider <> ''razorpay''
            or razorpay_subscription_id is null
          )
      )'
      into has_legacy_subscription_identity;
  end if;

  if has_legacy_profile_identity then
    raise exception
      'Refusing legacy profile billing cleanup while rows still lack razorpay_customer_id. Backfill or export those rows first.';
  end if;

  if has_legacy_subscription_identity then
    raise exception
      'Refusing legacy subscription billing cleanup while rows still lack trusted Razorpay identity. Backfill or export those rows first.';
  end if;
end $$;

alter table public.profiles
  drop constraint if exists profiles_stripe_customer_id_key;

drop index if exists public.profiles_stripe_customer_id_idx;

alter table public.profiles
  drop column if exists stripe_customer_id;

alter table public.subscriptions
  drop constraint if exists subscriptions_stripe_customer_id_key,
  drop constraint if exists subscriptions_stripe_subscription_id_key,
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;
