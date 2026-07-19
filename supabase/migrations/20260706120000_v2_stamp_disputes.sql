-- V2 Day 3 · Customer stamp disputes

create table public.stamp_disputes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  customer_card_id uuid not null references public.customer_cards (id) on delete restrict,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  visit_date date not null,
  amount_claimed numeric not null check (amount_claimed > 0),
  currency_code text not null default 'NPR',
  description text not null
    check (char_length(trim(description)) between 10 and 500),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  merchant_response text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table public.stamp_disputes is
  'Customer missing-stamp disputes; merchant reviews in dashboard';

create index stamp_disputes_merchant_status_idx
  on public.stamp_disputes (merchant_id, status, created_at desc);
create index stamp_disputes_customer_merchant_month_idx
  on public.stamp_disputes (customer_id, merchant_id, created_at desc);

alter table public.stamp_disputes enable row level security;

create policy "stamp_disputes_customer_select"
  on public.stamp_disputes for select to authenticated
  using (customer_id = public.current_customer_id());

create policy "stamp_disputes_customer_insert"
  on public.stamp_disputes for insert to authenticated
  with check (
    customer_id = public.current_customer_id()
    and customer_card_id in (
      select cc.id
      from public.customer_cards cc
      where cc.customer_id = public.current_customer_id()
    )
  );

create policy "stamp_disputes_merchant_select"
  on public.stamp_disputes for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

create policy "stamp_disputes_merchant_update"
  on public.stamp_disputes for update to authenticated
  using (merchant_id in (select public.current_merchant_ids()))
  with check (merchant_id in (select public.current_merchant_ids()));
