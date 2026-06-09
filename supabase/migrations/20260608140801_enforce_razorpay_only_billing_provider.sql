alter table public.subscriptions
  alter column payment_provider set default 'razorpay';

alter table public.subscriptions
  add constraint subscriptions_payment_provider_razorpay_only_check
    check (payment_provider = 'razorpay') not valid;
