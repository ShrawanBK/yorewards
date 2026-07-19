-- One dispute → at most one resolution stamp (atomic, race-safe)

alter table public.stamp_disputes
  add column if not exists stamp_session_id uuid
    references public.stamp_sessions (id) on delete set null;

comment on column public.stamp_disputes.stamp_session_id is
  'Stamp issued when dispute approved; null if rejected or approve-without-stamp';

create unique index if not exists stamp_disputes_stamp_session_id_key
  on public.stamp_disputes (stamp_session_id)
  where stamp_session_id is not null;

-- Resolve dispute + optional stamp in one transaction (FOR UPDATE lock)
create or replace function public.resolve_stamp_dispute(
  p_dispute_id uuid,
  p_status text,
  p_response text default null,
  p_issue_stamp boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_dispute public.stamp_disputes%rowtype;
  v_session_id uuid;
begin
  if p_status not in ('approved', 'rejected') then
    raise exception 'invalid dispute status: %', p_status;
  end if;

  select * into v_dispute
  from public.stamp_disputes
  where id = p_dispute_id
  for update;

  if not found then
    raise exception 'DISPUTE_NOT_FOUND';
  end if;

  if v_dispute.status <> 'pending' then
    raise exception 'DISPUTE_ALREADY_RESOLVED';
  end if;

  v_session_id := null;

  if p_status = 'approved' and p_issue_stamp then
    v_session_id := public.issue_stamp_manual(v_dispute.customer_card_id);
  end if;

  update public.stamp_disputes
  set
    status = p_status,
    merchant_response = nullif(trim(p_response), ''),
    resolved_at = now(),
    stamp_session_id = v_session_id
  where id = p_dispute_id;

  return v_session_id;
end;
$$;

comment on function public.resolve_stamp_dispute(uuid, text, text, boolean) is
  'Atomically resolve a pending dispute; optionally issue one manual stamp when approved';
