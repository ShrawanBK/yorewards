-- YORewards Day 1 · Section C — Row Level Security
-- Admin + otp_tokens: no client policies (service role bypasses RLS).
-- Customers: JWT app_metadata.customer_id set on login (Day 2 auth).
-- Merchants: Supabase Auth — auth.uid() = merchants.user_id

-- =============================================================================
-- Helpers (used in policies — SECURITY INVOKER, no RLS bypass)
-- =============================================================================

create or replace function public.current_customer_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select nullif((select auth.jwt()) -> 'app_metadata' ->> 'customer_id', '')::uuid;
$$;

comment on function public.current_customer_id is
  'Day 2: set app_metadata.customer_id on customer session JWT';

create or replace function public.current_merchant_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select id
  from public.merchants
  where user_id = (select auth.uid())
  limit 1;
$$;

comment on function public.current_merchant_id is
  'Merchant row id for the logged-in Supabase Auth user';

-- =============================================================================
-- Enable RLS on every table
-- =============================================================================

alter table public.customers enable row level security;
alter table public.merchants enable row level security;
alter table public.loyalty_cards enable row level security;
alter table public.customer_cards enable row level security;
alter table public.stamp_sessions enable row level security;
alter table public.redemptions enable row level security;
alter table public.audit_log enable row level security;
alter table public.otp_tokens enable row level security;

-- =============================================================================
-- customers
-- =============================================================================

-- Signup: phone login creates row (Day 2 login lookup uses service-role API route)
create policy "customers_insert_signup"
  on public.customers
  for insert
  to anon, authenticated
  with check (true);

create policy "customers_select_own"
  on public.customers
  for select
  to authenticated
  using (
    id = public.current_customer_id()
    and deleted_at is null
    and status = 'active'
  );

create policy "customers_update_own"
  on public.customers
  for update
  to authenticated
  using (id = public.current_customer_id() and deleted_at is null)
  with check (id = public.current_customer_id() and deleted_at is null);

-- =============================================================================
-- merchants
-- =============================================================================

create policy "merchants_insert_own"
  on public.merchants
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "merchants_select_own"
  on public.merchants
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "merchants_update_own"
  on public.merchants
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Wallet + QR scan: read active merchant branding when customer holds a card or card is scannable
create policy "merchants_select_active_for_customers"
  on public.merchants
  for select
  to anon, authenticated
  using (
    status = 'active'
    and (
      exists (
        select 1
        from public.customer_cards cc
        where cc.merchant_id = merchants.id
          and cc.customer_id = public.current_customer_id()
      )
      or exists (
        select 1
        from public.loyalty_cards lc
        where lc.merchant_id = merchants.id
          and lc.is_active = true
      )
    )
  );

-- =============================================================================
-- loyalty_cards
-- =============================================================================

-- QR scan + wallet: anyone can read active card config
create policy "loyalty_cards_select_active"
  on public.loyalty_cards
  for select
  to anon, authenticated
  using (is_active = true);

-- Merchant: full access to own cards (including paused)
create policy "loyalty_cards_merchant_select"
  on public.loyalty_cards
  for select
  to authenticated
  using (merchant_id = public.current_merchant_id());

create policy "loyalty_cards_merchant_insert"
  on public.loyalty_cards
  for insert
  to authenticated
  with check (merchant_id = public.current_merchant_id());

create policy "loyalty_cards_merchant_update"
  on public.loyalty_cards
  for update
  to authenticated
  using (merchant_id = public.current_merchant_id())
  with check (merchant_id = public.current_merchant_id());

create policy "loyalty_cards_merchant_delete"
  on public.loyalty_cards
  for delete
  to authenticated
  using (merchant_id = public.current_merchant_id());

-- =============================================================================
-- customer_cards (wallet)
-- =============================================================================

create policy "customer_cards_select_own"
  on public.customer_cards
  for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "customer_cards_select_merchant"
  on public.customer_cards
  for select
  to authenticated
  using (merchant_id = public.current_merchant_id());

create policy "customer_cards_insert_own"
  on public.customer_cards
  for insert
  to authenticated
  with check (
    customer_id = public.current_customer_id()
    and exists (
      select 1
      from public.loyalty_cards lc
      where lc.id = loyalty_card_id
        and lc.merchant_id = customer_cards.merchant_id
        and lc.is_active = true
    )
  );

create policy "customer_cards_update_customer"
  on public.customer_cards
  for update
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "customer_cards_update_merchant"
  on public.customer_cards
  for update
  to authenticated
  using (merchant_id = public.current_merchant_id())
  with check (merchant_id = public.current_merchant_id());

-- =============================================================================
-- stamp_sessions
-- =============================================================================

create policy "stamp_sessions_select_customer"
  on public.stamp_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.customer_cards cc
      where cc.id = stamp_sessions.customer_card_id
        and cc.customer_id = public.current_customer_id()
    )
  );

create policy "stamp_sessions_select_merchant"
  on public.stamp_sessions
  for select
  to authenticated
  using (merchant_id = public.current_merchant_id());

create policy "stamp_sessions_insert_customer"
  on public.stamp_sessions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.customer_cards cc
      where cc.id = customer_card_id
        and cc.customer_id = public.current_customer_id()
        and cc.merchant_id = stamp_sessions.merchant_id
    )
  );

create policy "stamp_sessions_update_merchant"
  on public.stamp_sessions
  for update
  to authenticated
  using (merchant_id = public.current_merchant_id())
  with check (merchant_id = public.current_merchant_id());

-- Realtime: customer subscribes by session id; merchant by merchant_id filter

-- =============================================================================
-- redemptions
-- =============================================================================

-- Created server-side after OTP verify (service role) — no client INSERT policy

create policy "redemptions_select_customer"
  on public.redemptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.customer_cards cc
      where cc.id = redemptions.customer_card_id
        and cc.customer_id = public.current_customer_id()
    )
  );

create policy "redemptions_select_merchant"
  on public.redemptions
  for select
  to authenticated
  using (merchant_id = public.current_merchant_id());

create policy "redemptions_update_merchant"
  on public.redemptions
  for update
  to authenticated
  using (merchant_id = public.current_merchant_id())
  with check (merchant_id = public.current_merchant_id());

-- =============================================================================
-- audit_log — service role only (no policies = deny anon/authenticated)
-- otp_tokens — service role only (no policies = deny anon/authenticated)
-- =============================================================================
