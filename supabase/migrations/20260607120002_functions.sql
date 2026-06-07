-- YORewards Day 1 · Step 3/4 — Business logic RPCs
-- See Technical Doc §4.6 for state machines and when to call each function.

-- Merchant approves a stamp
create or replace function public.increment_stamps(
  card_id uuid,
  new_status text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new_status not in ('collecting', 'pending_otp', 'unlocked') then
    raise exception 'invalid reward_status: %', new_status;
  end if;

  update public.customer_cards
  set
    current_stamps = current_stamps + 1,
    total_stamps_ever = total_stamps_ever + 1,
    reward_status = new_status,
    last_stamped_at = now(),
    targets_reached = targets_reached + case when new_status = 'pending_otp' then 1 else 0 end
  where id = card_id;

  if not found then
    raise exception 'customer_card not found: %', card_id;
  end if;
end;
$$;

-- Admin voids one approved stamp (row kept as voided)
create or replace function public.void_stamp(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session public.stamp_sessions%rowtype;
  v_stamps integer;
  v_target integer;
  v_status text;
begin
  select * into v_session
  from public.stamp_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'stamp_session not found: %', p_session_id;
  end if;

  if v_session.status <> 'approved' then
    raise exception 'only approved stamp_sessions can be voided';
  end if;

  select cc.current_stamps, lc.stamp_target, cc.reward_status
  into v_stamps, v_target, v_status
  from public.customer_cards cc
  join public.loyalty_cards lc on lc.id = cc.loyalty_card_id
  where cc.id = v_session.customer_card_id
  for update;

  update public.stamp_sessions
  set status = 'voided', resolved_at = now()
  where id = p_session_id;

  update public.customer_cards
  set
    current_stamps = greatest(current_stamps - 1, 0),
    targets_reached = case
      when v_stamps >= v_target and v_status in ('pending_otp', 'unlocked')
        then greatest(targets_reached - 1, 0)
      else targets_reached
    end,
    reward_status = case
      when greatest(current_stamps - 1, 0) < v_target then 'collecting'
      else reward_status
    end
  where id = v_session.customer_card_id;
end;
$$;

-- Admin issues a stamp without QR scan
create or replace function public.issue_stamp_manual(p_card_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_card record;
  v_new_count integer;
  v_new_status text;
  v_session_id uuid;
begin
  select cc.id, cc.current_stamps, cc.merchant_id, lc.stamp_target
  into v_card
  from public.customer_cards cc
  join public.loyalty_cards lc on lc.id = cc.loyalty_card_id
  where cc.id = p_card_id;

  if not found then
    raise exception 'customer_card not found: %', p_card_id;
  end if;

  v_new_count := v_card.current_stamps + 1;
  v_new_status := case
    when v_new_count >= v_card.stamp_target then 'pending_otp'
    else 'collecting'
  end;

  insert into public.stamp_sessions (
    customer_card_id,
    merchant_id,
    session_token,
    source,
    status,
    resolved_at
  )
  values (
    p_card_id,
    v_card.merchant_id,
    gen_random_uuid()::text,
    'admin_manual',
    'approved',
    now()
  )
  returning id into v_session_id;

  perform public.increment_stamps(p_card_id, v_new_status);

  return v_session_id;
end;
$$;

-- Merchant confirms redemption code — resets cycle
create or replace function public.complete_redemption(p_redemption_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_card_id uuid;
begin
  update public.redemptions
  set status = 'redeemed', redeemed_at = now()
  where id = p_redemption_id and status = 'pending'
  returning customer_card_id into v_card_id;

  if not found then
    raise exception 'redemption not found or already redeemed: %', p_redemption_id;
  end if;

  update public.customer_cards
  set
    current_stamps = 0,
    reward_status = 'collecting',
    cycle_number = cycle_number + 1
  where id = v_card_id;
end;
$$;
