-- Day 4 · Atomic merchant stamp approval (validate pending → approve → increment_stamps)

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

  select cc.current_stamps, lc.stamp_target
  into v_stamps, v_target
  from public.customer_cards cc
  join public.loyalty_cards lc on lc.id = cc.loyalty_card_id
  where cc.id = v_session.customer_card_id;

  if not found then
    raise exception 'customer_card not found for session: %', p_session_id;
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

comment on function public.approve_stamp_session(uuid) is
  'Merchant approves a pending QR stamp session atomically';

grant execute on function public.approve_stamp_session(uuid) to authenticated;
