-- V2 Day 9 · In-app + email notifications

alter table public.stamp_disputes
  add column if not exists sla_alerted_at timestamptz;

comment on column public.stamp_disputes.sla_alerted_at is
  'Set when admins are notified of a 48h merchant SLA breach (idempotent)';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null
    check (recipient_type in ('merchant_staff', 'customer', 'admin')),
  recipient_id uuid not null,
  type text not null
    check (type in (
      'dispute_filed',
      'dispute_resolved',
      'dispute_sla_breach',
      'reward_unlocked',
      'merchant_approved',
      'smart_promo'
    )),
  title_key text not null,
  body_key text not null,
  payload jsonb not null default '{}'::jsonb,
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'Platform notifications — store i18n keys + payload; resolve copy at render time';

create index notifications_recipient_unread_idx
  on public.notifications (recipient_type, recipient_id, read_at, created_at desc);

create index notifications_in_app_list_idx
  on public.notifications (recipient_type, recipient_id, created_at desc)
  where channel = 'in_app';

alter table public.notifications enable row level security;

create policy "notifications_customer_select"
  on public.notifications for select to authenticated
  using (
    channel = 'in_app'
    and recipient_type = 'customer'
    and recipient_id = public.current_customer_id()
  );

create policy "notifications_customer_update"
  on public.notifications for update to authenticated
  using (
    channel = 'in_app'
    and recipient_type = 'customer'
    and recipient_id = public.current_customer_id()
  )
  with check (
    channel = 'in_app'
    and recipient_type = 'customer'
    and recipient_id = public.current_customer_id()
  );

create policy "notifications_merchant_staff_select"
  on public.notifications for select to authenticated
  using (
    channel = 'in_app'
    and recipient_type = 'merchant_staff'
    and recipient_id = auth.uid()
  );

create policy "notifications_merchant_staff_update"
  on public.notifications for update to authenticated
  using (
    channel = 'in_app'
    and recipient_type = 'merchant_staff'
    and recipient_id = auth.uid()
  )
  with check (
    channel = 'in_app'
    and recipient_type = 'merchant_staff'
    and recipient_id = auth.uid()
  );

create policy "notifications_admin_select"
  on public.notifications for select to authenticated
  using (
    channel = 'in_app'
    and recipient_type = 'admin'
    and recipient_id = auth.uid()
    and public.is_admin()
  );

create policy "notifications_admin_update"
  on public.notifications for update to authenticated
  using (
    channel = 'in_app'
    and recipient_type = 'admin'
    and recipient_id = auth.uid()
    and public.is_admin()
  )
  with check (
    channel = 'in_app'
    and recipient_type = 'admin'
    and recipient_id = auth.uid()
    and public.is_admin()
  );

-- Hourly SLA breach scan: in-app admin alerts (email handled by app cron route)
create or replace function public.process_dispute_sla_breach_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  dispute_row record;
  admin_row record;
  inserted_count integer := 0;
  sla_hours constant integer := 48;
begin
  for dispute_row in
    select sd.id, sd.merchant_id, m.business_name
    from public.stamp_disputes sd
    join public.merchants m on m.id = sd.merchant_id
    where sd.status = 'pending'
      and sd.sla_alerted_at is null
      and sd.created_at < now() - (sla_hours || ' hours')::interval
  loop
    for admin_row in
      select u.id
      from auth.users u
      where coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin'
    loop
      insert into public.notifications (
        recipient_type,
        recipient_id,
        type,
        title_key,
        body_key,
        payload,
        channel
      ) values (
        'admin',
        admin_row.id,
        'dispute_sla_breach',
        'notifications.disputeSlaBreach.title',
        'notifications.disputeSlaBreach.body',
        jsonb_build_object(
          'disputeId', dispute_row.id,
          'merchantName', dispute_row.business_name
        ),
        'in_app'
      );
      inserted_count := inserted_count + 1;
    end loop;

    update public.stamp_disputes
    set sla_alerted_at = now()
    where id = dispute_row.id;
  end loop;

  return inserted_count;
end;
$$;

comment on function public.process_dispute_sla_breach_notifications() is
  'Idempotent: notify admins when a pending dispute exceeds the merchant SLA window';

-- Schedule hourly when pg_cron is available (Supabase hosted)
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'dispute-sla-breach-notifications';

    perform cron.schedule(
      'dispute-sla-breach-notifications',
      '0 * * * *',
      $$ select public.process_dispute_sla_breach_notifications(); $$
    );
  end if;
exception
  when undefined_table or undefined_object then
    null;
end;
$cron$;
