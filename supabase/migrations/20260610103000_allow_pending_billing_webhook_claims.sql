alter table public.billing_webhook_events
  alter column processed_at drop not null,
  alter column processed_at drop default;

comment on column public.billing_webhook_events.processed_at is
  'Set only after a webhook event is fully processed. NULL means the event is claimed but not complete.';
