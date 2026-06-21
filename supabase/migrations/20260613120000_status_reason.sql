-- Admin suspend/reactivate reasons — shown on account + stored in audit_log

alter table public.customers
  add column if not exists status_reason text;

comment on column public.customers.status_reason is
  'Admin note when status is suspended; cleared on reactivate';

alter table public.merchants
  add column if not exists status_reason text;

comment on column public.merchants.status_reason is
  'Admin note when status is suspended; cleared on reactivate (rejection uses rejection_reason)';
