-- V2 Day 5 · Multi-staff roles, RLS, shared-device PIN context
-- ----------------------------------------------------------------------------

create type public.merchant_staff_role as enum ('cashier', 'manager', 'owner');
create type public.merchant_staff_status as enum ('pending', 'active', 'disabled');

create table public.merchant_staff (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  invited_email text not null,
  display_name text,
  role public.merchant_staff_role not null default 'cashier',
  status public.merchant_staff_status not null default 'pending',
  pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchant_staff_email_unique unique (merchant_id, invited_email),
  constraint merchant_staff_user_unique unique (merchant_id, user_id)
);

comment on table public.merchant_staff is
  'Staff accounts per merchant — owner row seeded on business create';

create index merchant_staff_merchant_idx
  on public.merchant_staff (merchant_id, status);

create index merchant_staff_user_idx
  on public.merchant_staff (user_id)
  where user_id is not null;

-- Extend merchant access for staff (owner rows + active staff)
create or replace function public.current_merchant_ids()
returns setof uuid
language sql
stable
security invoker
set search_path = public
as $$
  select id
  from public.merchants
  where user_id = (select auth.uid())
  union
  select merchant_id
  from public.merchant_staff
  where user_id = (select auth.uid())
    and status = 'active';
$$;

comment on function public.current_merchant_ids is
  'Business ids the user may access — owned businesses plus active staff memberships';

-- Role helper for server-side checks (owner via merchants.user_id wins)
create or replace function public.merchant_role_for(p_merchant_id uuid)
returns public.merchant_staff_role
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (
      select ms.role
      from public.merchant_staff ms
      where ms.merchant_id = p_merchant_id
        and ms.user_id = (select auth.uid())
        and ms.status = 'active'
      limit 1
    ),
    case
      when exists (
        select 1
        from public.merchants m
        where m.id = p_merchant_id
          and m.user_id = (select auth.uid())
      ) then 'owner'::public.merchant_staff_role
      else null
    end
  );
$$;

alter table public.merchant_staff enable row level security;

create policy "merchant_staff_select"
  on public.merchant_staff for select to authenticated
  using (
    merchant_id in (select public.current_merchant_ids())
    or user_id = (select auth.uid())
  );

create policy "merchant_staff_owner_insert"
  on public.merchant_staff for insert to authenticated
  with check (
    exists (
      select 1
      from public.merchants m
      where m.id = merchant_id
        and m.user_id = (select auth.uid())
    )
  );

create policy "merchant_staff_owner_update"
  on public.merchant_staff for update to authenticated
  using (
    exists (
      select 1
      from public.merchants m
      where m.id = merchant_id
        and m.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.merchants m
      where m.id = merchant_id
        and m.user_id = (select auth.uid())
    )
  );

create policy "merchant_staff_owner_delete"
  on public.merchant_staff for delete to authenticated
  using (
    exists (
      select 1
      from public.merchants m
      where m.id = merchant_id
        and m.user_id = (select auth.uid())
    )
    and role <> 'owner'
  );

-- Staff may update own row (e.g. set PIN after invite accept)
create policy "merchant_staff_self_update"
  on public.merchant_staff for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
