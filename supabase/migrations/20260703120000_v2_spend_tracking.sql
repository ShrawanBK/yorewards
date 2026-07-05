-- V2 Day 1 · Spend tracking, branch subset scoping, stamp_transactions

-- stamp_sessions: spend + approver + device
alter table public.stamp_sessions
  add column if not exists amount_spent numeric
    check (amount_spent is null or amount_spent >= 0),
  add column if not exists approved_by uuid references auth.users (id) on delete set null,
  add column if not exists device_info jsonb;

comment on column public.stamp_sessions.amount_spent is
  'Amount entered by merchant on approve (loyalty_cards.min_spend_currency)';
comment on column public.stamp_sessions.approved_by is
  'Merchant owner or staff user who approved';
comment on column public.stamp_sessions.device_info is
  'Customer device metadata from QR scan';

-- Branch subset per loyalty card (empty = all active branches allowed)
create table public.loyalty_card_locations (
  loyalty_card_id uuid not null
    references public.loyalty_cards (id) on delete cascade,
  location_id uuid not null
    references public.merchant_locations (id) on delete cascade,
  stamp_allowed boolean not null default true,
  redeem_allowed boolean not null default true,
  primary key (loyalty_card_id, location_id)
);

comment on table public.loyalty_card_locations is
  'Optional branch subset per card; no rows = stamp/redeem at any active branch';

create index loyalty_card_locations_location_id_idx
  on public.loyalty_card_locations (location_id);

-- Analytics-facing approved stamp transactions
create table public.stamp_transactions (
  id uuid primary key default gen_random_uuid(),
  stamp_session_id uuid not null unique
    references public.stamp_sessions (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  customer_card_id uuid not null references public.customer_cards (id) on delete restrict,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  loyalty_card_id uuid not null references public.loyalty_cards (id) on delete restrict,
  location_id uuid references public.merchant_locations (id) on delete set null,
  amount_spent numeric not null check (amount_spent > 0),
  session_token text not null,
  device_info jsonb,
  approved_by uuid references auth.users (id) on delete set null,
  stamped_at timestamptz not null default now()
);

comment on table public.stamp_transactions is
  'Immutable spend record per approved QR stamp';

create index stamp_transactions_merchant_stamped_at_idx
  on public.stamp_transactions (merchant_id, stamped_at desc);
create index stamp_transactions_customer_stamped_at_idx
  on public.stamp_transactions (customer_id, stamped_at desc);
create index stamp_transactions_location_id_idx
  on public.stamp_transactions (location_id)
  where location_id is not null;

-- RLS
alter table public.loyalty_card_locations enable row level security;
alter table public.stamp_transactions enable row level security;

create policy "loyalty_card_locations_merchant_select"
  on public.loyalty_card_locations for select to authenticated
  using (
    loyalty_card_id in (
      select lc.id
      from public.loyalty_cards lc
      where lc.merchant_id in (select public.current_merchant_ids())
    )
  );

create policy "loyalty_card_locations_merchant_insert"
  on public.loyalty_card_locations for insert to authenticated
  with check (
    loyalty_card_id in (
      select lc.id
      from public.loyalty_cards lc
      where lc.merchant_id in (select public.current_merchant_ids())
    )
  );

create policy "loyalty_card_locations_merchant_update"
  on public.loyalty_card_locations for update to authenticated
  using (
    loyalty_card_id in (
      select lc.id
      from public.loyalty_cards lc
      where lc.merchant_id in (select public.current_merchant_ids())
    )
  )
  with check (
    loyalty_card_id in (
      select lc.id
      from public.loyalty_cards lc
      where lc.merchant_id in (select public.current_merchant_ids())
    )
  );

create policy "loyalty_card_locations_merchant_delete"
  on public.loyalty_card_locations for delete to authenticated
  using (
    loyalty_card_id in (
      select lc.id
      from public.loyalty_cards lc
      where lc.merchant_id in (select public.current_merchant_ids())
    )
  );

create policy "stamp_transactions_merchant_select"
  on public.stamp_transactions for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

create policy "stamp_transactions_customer_select"
  on public.stamp_transactions for select to authenticated
  using (customer_id = public.current_customer_id());

create policy "stamp_transactions_merchant_insert"
  on public.stamp_transactions for insert to authenticated
  with check (merchant_id in (select public.current_merchant_ids()));

-- Approve with spend, branch rules, min spend, transaction row
create or replace function public.approve_stamp_session(
  p_session_id uuid,
  p_amount_spent numeric,
  p_approved_by uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session public.stamp_sessions%rowtype;
  v_stamps integer;
  v_target integer;
  v_reward_status text;
  v_min_spend numeric;
  v_loyalty_card_id uuid;
  v_customer_id uuid;
  v_new_count integer;
  v_new_status text;
  v_subset_count integer;
begin
  if p_amount_spent is null or p_amount_spent <= 0 then
    raise exception 'stamp_amount_required';
  end if;

  select * into v_session
  from public.stamp_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'stamp_session not found: %', p_session_id;
  end if;

  if v_session.status <> 'pending' then
    raise exception 'stamp_session is not pending: %', v_session.status;
  end if;

  if v_session.created_at < now() - interval '5 minutes' then
    update public.stamp_sessions
    set status = 'expired', resolved_at = now()
    where id = p_session_id;
    raise exception 'stamp_session expired';
  end if;

  select
    cc.current_stamps,
    lc.stamp_target,
    cc.reward_status,
    lc.min_spend,
    cc.loyalty_card_id,
    cc.customer_id
  into
    v_stamps,
    v_target,
    v_reward_status,
    v_min_spend,
    v_loyalty_card_id,
    v_customer_id
  from public.customer_cards cc
  join public.loyalty_cards lc on lc.id = cc.loyalty_card_id
  where cc.id = v_session.customer_card_id;

  if not found then
    raise exception 'customer_card not found for session: %', p_session_id;
  end if;

  if v_reward_status = 'unlocked' then
    raise exception 'reward awaiting merchant redemption';
  end if;

  if p_amount_spent < v_min_spend then
    raise exception 'stamp_min_spend_not_met';
  end if;

  if v_session.location_id is not null then
    select count(*) into v_subset_count
    from public.loyalty_card_locations
    where loyalty_card_id = v_loyalty_card_id;

    if v_subset_count > 0 then
      if not exists (
        select 1
        from public.loyalty_card_locations lcl
        where lcl.loyalty_card_id = v_loyalty_card_id
          and lcl.location_id = v_session.location_id
          and lcl.stamp_allowed = true
      ) then
        raise exception 'stamp_branch_not_allowed';
      end if;
    end if;
  end if;

  v_new_count := v_stamps + 1;
  v_new_status := case
    when v_new_count >= v_target then 'pending_otp'
    else 'collecting'
  end;

  update public.stamp_sessions
  set
    status = 'approved',
    resolved_at = now(),
    amount_spent = p_amount_spent,
    approved_by = p_approved_by
  where id = p_session_id;

  insert into public.stamp_transactions (
    stamp_session_id,
    customer_id,
    customer_card_id,
    merchant_id,
    loyalty_card_id,
    location_id,
    amount_spent,
    session_token,
    device_info,
    approved_by,
    stamped_at
  )
  values (
    p_session_id,
    v_customer_id,
    v_session.customer_card_id,
    v_session.merchant_id,
    v_loyalty_card_id,
    v_session.location_id,
    p_amount_spent,
    v_session.session_token,
    v_session.device_info,
    p_approved_by,
    now()
  );

  perform public.increment_stamps(v_session.customer_card_id, v_new_status);
end;
$$;

comment on function public.approve_stamp_session(uuid, numeric, uuid) is
  'Merchant approves pending QR stamp with spend amount and branch validation';

grant execute on function public.approve_stamp_session(uuid, numeric, uuid) to authenticated;

-- Drop old single-arg overload if present
drop function if exists public.approve_stamp_session(uuid);
