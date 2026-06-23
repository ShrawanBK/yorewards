-- Carry overflow stamps into the next cycle on redemption; block new stamps while unlocked.

create or replace function public.complete_redemption(p_redemption_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_card_id uuid;
  v_stamps integer;
  v_target integer;
  v_carryover integer;
begin
  update public.redemptions
  set status = 'redeemed', redeemed_at = now()
  where id = p_redemption_id and status = 'pending'
  returning customer_card_id into v_card_id;

  if not found then
    raise exception 'redemption not found or already redeemed: %', p_redemption_id;
  end if;

  select cc.current_stamps, lc.stamp_target
  into v_stamps, v_target
  from public.customer_cards cc
  join public.loyalty_cards lc on lc.id = cc.loyalty_card_id
  where cc.id = v_card_id;

  if not found then
    raise exception 'customer_card not found for redemption: %', p_redemption_id;
  end if;

  v_carryover := greatest(v_stamps - v_target, 0);

  update public.customer_cards
  set
    current_stamps = v_carryover,
    reward_status = 'collecting',
    cycle_number = cycle_number + 1
  where id = v_card_id;
end;
$$;

comment on function public.complete_redemption(uuid) is
  'Merchant confirms redemption code — subtracts stamp_target, carries overflow into next cycle';

create or replace function public.approve_stamp_session(p_session_id uuid)
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
  v_new_count integer;
  v_new_status text;
begin
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

  select cc.current_stamps, lc.stamp_target, cc.reward_status
  into v_stamps, v_target, v_reward_status
  from public.customer_cards cc
  join public.loyalty_cards lc on lc.id = cc.loyalty_card_id
  where cc.id = v_session.customer_card_id;

  if not found then
    raise exception 'customer_card not found for session: %', p_session_id;
  end if;

  if v_reward_status = 'unlocked' then
    raise exception 'reward awaiting merchant redemption';
  end if;

  v_new_count := v_stamps + 1;
  v_new_status := case
    when v_new_count >= v_target then 'pending_otp'
    else 'collecting'
  end;

  update public.stamp_sessions
  set status = 'approved', resolved_at = now()
  where id = p_session_id;

  perform public.increment_stamps(v_session.customer_card_id, v_new_status);
end;
$$;

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
  select cc.id, cc.current_stamps, cc.merchant_id, lc.stamp_target, cc.reward_status
  into v_card
  from public.customer_cards cc
  join public.loyalty_cards lc on lc.id = cc.loyalty_card_id
  where cc.id = p_card_id;

  if not found then
    raise exception 'customer_card not found: %', p_card_id;
  end if;

  if v_card.reward_status = 'unlocked' then
    raise exception 'reward awaiting merchant redemption';
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
