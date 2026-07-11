-- V2 Day 6 · Subscriptions, credible onboarding, verification, billing

-- ---------------------------------------------------------------------------
-- Merchant status + credible business fields
-- ---------------------------------------------------------------------------
alter table public.merchants
  drop constraint if exists merchants_status_check;

alter table public.merchants
  add constraint merchants_status_check
  check (status in ('pending', 'pending_verification', 'active', 'suspended', 'rejected'));

alter table public.merchants
  add column if not exists registration_number text,
  add column if not exists website_url text,
  add column if not exists business_address text,
  add column if not exists business_card_image_url text,
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  add column if not exists verified_at timestamptz,
  add column if not exists smart_promo_enabled boolean not null default false,
  add column if not exists smart_promo_threshold integer not null default 2
    check (smart_promo_threshold between 1 and 3);

comment on column public.merchants.registration_number is
  'Business registration / PAN number for credible onboarding (Day 6)';
comment on column public.merchants.verification_status is
  'Document verification badge state; Starter+ can submit docs for admin review';

-- ---------------------------------------------------------------------------
-- merchant_subscriptions — billing state per merchant
-- ---------------------------------------------------------------------------
create type public.subscription_status as enum (
  'free',
  'trialing',
  'active',
  'past_due',
  'canceled'
);

create table public.merchant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null unique references public.merchants (id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'free',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  payment_provider text check (payment_provider in ('esewa', 'khalti')),
  provider_customer_id text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.merchant_subscriptions is
  'Billing subscription row; merchants.subscription_tier is denormalized cache';

create index merchant_subscriptions_merchant_id_idx
  on public.merchant_subscriptions (merchant_id);

alter table public.merchant_subscriptions enable row level security;

create policy "merchant_subscriptions_merchant_select"
  on public.merchant_subscriptions for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

-- ---------------------------------------------------------------------------
-- merchant_invoices — minimal invoice list for billing page
-- ---------------------------------------------------------------------------
create table public.merchant_invoices (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  subscription_id uuid references public.merchant_subscriptions (id) on delete set null,
  amount_npr integer not null check (amount_npr >= 0),
  tier public.subscription_tier not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider text check (provider in ('esewa', 'khalti')),
  provider_reference text,
  invoice_period_start timestamptz,
  invoice_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index merchant_invoices_merchant_id_idx
  on public.merchant_invoices (merchant_id, created_at desc);

alter table public.merchant_invoices enable row level security;

create policy "merchant_invoices_merchant_select"
  on public.merchant_invoices for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

-- ---------------------------------------------------------------------------
-- merchant_verification_documents — Starter+ document upload queue
-- ---------------------------------------------------------------------------
create table public.merchant_verification_documents (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  document_type text not null
    check (document_type in ('registration', 'pan', 'business_license', 'other')),
  file_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index merchant_verification_documents_merchant_id_idx
  on public.merchant_verification_documents (merchant_id);
create index merchant_verification_documents_status_idx
  on public.merchant_verification_documents (status)
  where status = 'pending';

alter table public.merchant_verification_documents enable row level security;

create policy "merchant_verification_documents_merchant_select"
  on public.merchant_verification_documents for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

create policy "merchant_verification_documents_merchant_insert"
  on public.merchant_verification_documents for insert to authenticated
  with check (merchant_id in (select public.current_merchant_ids()));

-- ---------------------------------------------------------------------------
-- smart_promo_notifications — once per reward cycle per customer card
-- ---------------------------------------------------------------------------
create table public.smart_promo_notifications (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  customer_card_id uuid not null references public.customer_cards (id) on delete cascade,
  reward_cycle_key text not null,
  stamps_remaining integer not null check (stamps_remaining between 1 and 3),
  sent_at timestamptz not null default now(),
  unique (customer_card_id, reward_cycle_key)
);

create index smart_promo_notifications_merchant_id_idx
  on public.smart_promo_notifications (merchant_id);

alter table public.smart_promo_notifications enable row level security;

create policy "smart_promo_notifications_merchant_select"
  on public.smart_promo_notifications for select to authenticated
  using (merchant_id in (select public.current_merchant_ids()));

-- ---------------------------------------------------------------------------
-- Backfill subscriptions for existing merchants
-- ---------------------------------------------------------------------------
insert into public.merchant_subscriptions (merchant_id, tier, status)
select id, subscription_tier, 'free'::public.subscription_status
from public.merchants
on conflict (merchant_id) do nothing;
