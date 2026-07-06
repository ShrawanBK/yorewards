-- V2 Day 4 · Subscription tier stub, merchant customer notes

create type public.subscription_tier as enum (
  'free',
  'starter',
  'growth',
  'enterprise'
);

alter table public.merchants
  add column if not exists subscription_tier public.subscription_tier not null default 'free';

comment on column public.merchants.subscription_tier is
  'Billing plan; CSV export and CRM gates use starter+ until Day 6 billing.';

create table public.merchant_customer_notes (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  note text not null default '',
  updated_at timestamptz not null default now(),
  unique (merchant_id, customer_id)
);

comment on table public.merchant_customer_notes is
  'Private merchant notes per customer (CRM Day 4)';

create index merchant_customer_notes_merchant_id_idx
  on public.merchant_customer_notes (merchant_id);

alter table public.merchant_customer_notes enable row level security;

create policy "merchant_customer_notes_merchant_select"
  on public.merchant_customer_notes for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

create policy "merchant_customer_notes_merchant_insert"
  on public.merchant_customer_notes for insert to authenticated
  with check (merchant_id in (select public.current_merchant_ids()));

create policy "merchant_customer_notes_merchant_update"
  on public.merchant_customer_notes for update to authenticated
  using (merchant_id in (select public.current_merchant_ids()))
  with check (merchant_id in (select public.current_merchant_ids()));

create policy "merchant_customer_notes_merchant_delete"
  on public.merchant_customer_notes for delete to authenticated
  using (merchant_id in (select public.current_merchant_ids()));
