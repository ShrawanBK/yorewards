-- YORewards · Multi-business per owner (MVP scope expansion)
-- ----------------------------------------------------------------------------
-- Decision: one Supabase Auth user (owner) may own MANY businesses (merchants
-- rows). RLS becomes set-based via current_merchant_ids().
--
-- NOT in this migration (see Technical Doc §4.7):
--   * Outlets/branches  → 20260611120000_merchant_locations.sql (Day 3)
--   * Multi-staff        → merchant_staff(user_id, merchant_id, role)
-- Guardrail: an outlet is a CHILD of a merchant, never its own merchants row.
-- ============================================================================

-- 1. Allow one owner to have multiple businesses -----------------------------
alter table public.merchants
  drop constraint merchants_user_id_key;

comment on table public.merchants is
  'Merchant business profile — one row per business; an owner (user_id) may own many';

-- 2. Set-based ownership helper ----------------------------------------------
create or replace function public.current_merchant_ids()
returns setof uuid
language sql
stable
security invoker
set search_path = public
as $$
  select id from public.merchants where user_id = (select auth.uid());
$$;

comment on function public.current_merchant_ids is
  'All business ids owned by the logged-in auth user (multi-business per owner)';

comment on function public.current_merchant_id is
  'Deprecated: returns one arbitrary owned business. Prefer current_merchant_ids() in policies';

-- 3. Re-point merchant-scoped RLS policies to the owned set ------------------

-- loyalty_cards --------------------------------------------------------------
drop policy "loyalty_cards_merchant_select" on public.loyalty_cards;
create policy "loyalty_cards_merchant_select"
  on public.loyalty_cards for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

drop policy "loyalty_cards_merchant_insert" on public.loyalty_cards;
create policy "loyalty_cards_merchant_insert"
  on public.loyalty_cards for insert to authenticated
  with check (merchant_id in (select public.current_merchant_ids()));

drop policy "loyalty_cards_merchant_update" on public.loyalty_cards;
create policy "loyalty_cards_merchant_update"
  on public.loyalty_cards for update to authenticated
  using (merchant_id in (select public.current_merchant_ids()))
  with check (merchant_id in (select public.current_merchant_ids()));

drop policy "loyalty_cards_merchant_delete" on public.loyalty_cards;
create policy "loyalty_cards_merchant_delete"
  on public.loyalty_cards for delete to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

-- customer_cards -------------------------------------------------------------
drop policy "customer_cards_select_merchant" on public.customer_cards;
create policy "customer_cards_select_merchant"
  on public.customer_cards for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

drop policy "customer_cards_update_merchant" on public.customer_cards;
create policy "customer_cards_update_merchant"
  on public.customer_cards for update to authenticated
  using (merchant_id in (select public.current_merchant_ids()))
  with check (merchant_id in (select public.current_merchant_ids()));

-- stamp_sessions -------------------------------------------------------------
drop policy "stamp_sessions_select_merchant" on public.stamp_sessions;
create policy "stamp_sessions_select_merchant"
  on public.stamp_sessions for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

drop policy "stamp_sessions_update_merchant" on public.stamp_sessions;
create policy "stamp_sessions_update_merchant"
  on public.stamp_sessions for update to authenticated
  using (merchant_id in (select public.current_merchant_ids()))
  with check (merchant_id in (select public.current_merchant_ids()));

-- redemptions ----------------------------------------------------------------
drop policy "redemptions_select_merchant" on public.redemptions;
create policy "redemptions_select_merchant"
  on public.redemptions for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

drop policy "redemptions_update_merchant" on public.redemptions;
create policy "redemptions_update_merchant"
  on public.redemptions for update to authenticated
  using (merchant_id in (select public.current_merchant_ids()))
  with check (merchant_id in (select public.current_merchant_ids()));

-- Note: merchants_{select,update,insert}_own already key off user_id = auth.uid()
-- and are naturally multi-row safe — no change needed.
