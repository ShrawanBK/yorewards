-- V2 Day 7 · Live dispute centre (Supabase Realtime, same pattern as stamp_sessions)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'role',
    ''
  ) = 'admin';
$$;

comment on function public.is_admin() is
  'JWT app_metadata.role = admin; required for admin Realtime + RLS on operational tables';

create policy "stamp_disputes_admin_select"
  on public.stamp_disputes for select to authenticated
  using (public.is_admin());

alter publication supabase_realtime add table public.stamp_disputes;
