-- F6: Remove the redundant, never-validated duplicate of
-- subscriptions_payment_provider_check.
--
-- 20260608140801 added subscriptions_payment_provider_razorpay_only_check as
-- NOT VALID, but subscriptions_payment_provider_check (added 20260608132620)
-- is already VALID and enforces the identical predicate
-- (payment_provider = 'razorpay'). The NOT VALID copy never validated and only
-- adds confusion.
alter table public.subscriptions
  drop constraint if exists subscriptions_payment_provider_razorpay_only_check;
