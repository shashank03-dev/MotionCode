alter table public.profiles
  add column if not exists razorpay_customer_id text unique;

alter policy "authenticated users can create their profile"
  on public.profiles
  with check (
    id = (select auth.uid())
    and plan_tier = 'free'
    and is_internal_admin = false
    and stripe_customer_id is null
    and razorpay_customer_id is null
    and deleted_at is null
  );

alter table public.subscriptions
  add column if not exists payment_provider text not null default 'razorpay',
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_payment_id text;

alter table public.subscriptions
  add constraint subscriptions_payment_provider_check
    check (payment_provider = 'razorpay');

create unique index if not exists subscriptions_razorpay_subscription_id_idx
  on public.subscriptions (razorpay_subscription_id);

create index if not exists subscriptions_provider_user_id_idx
  on public.subscriptions (payment_provider, user_id);
