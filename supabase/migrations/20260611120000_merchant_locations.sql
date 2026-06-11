-- YORewards · Branches / outlets per business (Day 3)
-- ----------------------------------------------------------------------------
-- One merchants row = one business. Branches are merchant_locations children.
-- Loyalty card + customer_cards balance stay business-scoped; location_id on
-- stamp_sessions / redemptions is attribution + per-counter QR only.
-- ============================================================================

-- 1. merchant_locations -------------------------------------------------------
create table public.merchant_locations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1),
  address text,
  city text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.merchant_locations is
  'Physical branch/outlet of a business — shared loyalty card across all locations';

comment on column public.merchant_locations.is_primary is
  'Default branch for display; at most one primary per merchant_id';

create index merchant_locations_merchant_id_idx
  on public.merchant_locations (merchant_id);

create unique index merchant_locations_one_primary_per_merchant_idx
  on public.merchant_locations (merchant_id)
  where is_primary = true;

-- 2. Event attribution (nullable — existing rows stay valid) ------------------
alter table public.stamp_sessions
  add column location_id uuid references public.merchant_locations (id) on delete set null;

alter table public.redemptions
  add column location_id uuid references public.merchant_locations (id) on delete set null;

create index stamp_sessions_location_id_idx
  on public.stamp_sessions (location_id)
  where location_id is not null;

create index redemptions_location_id_idx
  on public.redemptions (location_id)
  where location_id is not null;

comment on column public.stamp_sessions.location_id is
  'Branch where stamp was requested — attribution only; balance is merchant-scoped';

comment on column public.redemptions.location_id is
  'Branch where reward was redeemed — attribution only';

-- 3. Backfill one primary location per existing merchant ----------------------
insert into public.merchant_locations (merchant_id, name, is_primary, is_active)
select
  m.id,
  coalesce(nullif(trim(m.business_name), ''), 'Main location'),
  true,
  true
from public.merchants m
where not exists (
  select 1
  from public.merchant_locations ml
  where ml.merchant_id = m.id
);

-- 4. RLS ----------------------------------------------------------------------
alter table public.merchant_locations enable row level security;

create policy "merchant_locations_select_own"
  on public.merchant_locations for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

create policy "merchant_locations_insert_own"
  on public.merchant_locations for insert to authenticated
  with check (merchant_id in (select public.current_merchant_ids()));

create policy "merchant_locations_update_own"
  on public.merchant_locations for update to authenticated
  using (merchant_id in (select public.current_merchant_ids()))
  with check (merchant_id in (select public.current_merchant_ids()));

-- No merchant delete policy — use is_active = false in app layer

-- 5. updated_at trigger -------------------------------------------------------
create or replace function public.set_merchant_locations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger merchant_locations_set_updated_at
  before update on public.merchant_locations
  for each row
  execute function public.set_merchant_locations_updated_at();
