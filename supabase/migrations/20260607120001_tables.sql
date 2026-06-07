-- YORewards Day 1 · Step 2/4 — 8 core tables + indexes
-- Order matters: customers → merchants → loyalty_cards → customer_cards → events

-- =============================================================================
-- 1. customers — phone identity (custom auth, not auth.users)
-- =============================================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  country_code text not null check (country_code in ('NP', 'FI')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.customers is 'Customer identity — phone-first, no OTP at signup (MVP)';
comment on column public.customers.deleted_at is 'Soft-delete for GDPR; null = active record';

create unique index customers_phone_active_key on public.customers (phone)
  where deleted_at is null;

create index customers_status_idx on public.customers (status)
  where deleted_at is null;

-- =============================================================================
-- 2. merchants — business profile (linked to Supabase Auth)
-- =============================================================================
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text not null,
  category text not null,
  country text not null check (country in ('NP', 'FI')),
  logo_url text,
  primary_color text not null default '#7C3AED',
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'rejected')),
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  rejection_reason text
);

comment on table public.merchants is 'Merchant business profile — one row per auth user (MVP)';
comment on column public.merchants.rejection_reason is 'Set when Super Admin rejects registration';

create index merchants_status_idx on public.merchants (status);
create index merchants_user_id_idx on public.merchants (user_id);

-- =============================================================================
-- 3. loyalty_cards — card config + reward rules
-- =============================================================================
create table public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  card_name text not null check (char_length(card_name) <= 40),
  description text not null check (char_length(description) <= 120),
  stamp_target integer not null check (stamp_target between 5 and 50),
  min_spend numeric not null default 0 check (min_spend >= 0),
  min_spend_currency text not null check (min_spend_currency in ('NPR', 'EUR')),
  reward_type text not null
    check (reward_type in ('free_item', 'percent_discount', 'fixed_discount')),
  reward_value text not null,
  reward_description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.loyalty_cards is 'Loyalty card configuration per merchant';

create index loyalty_cards_merchant_id_idx on public.loyalty_cards (merchant_id);

-- =============================================================================
-- 4. customer_cards — wallet row (one per customer × loyalty card)
-- =============================================================================
create table public.customer_cards (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  loyalty_card_id uuid not null references public.loyalty_cards (id) on delete restrict,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  current_stamps integer not null default 0 check (current_stamps >= 0),
  total_stamps_ever integer not null default 0 check (total_stamps_ever >= 0),
  reward_status text not null default 'collecting'
    check (reward_status in ('collecting', 'pending_otp', 'unlocked')),
  cycle_number integer not null default 1 check (cycle_number >= 1),
  targets_reached integer not null default 0 check (targets_reached >= 0),
  last_stamped_at timestamptz,
  created_at timestamptz not null default now(),
  unique (customer_id, loyalty_card_id)
);

comment on table public.customer_cards is 'Wallet row — one per customer per loyalty card';
comment on column public.customer_cards.merchant_id is 'Denormalised for fast wallet queries and RLS';
comment on column public.customer_cards.reward_status is
  'collecting → pending_otp → unlocked → collecting (via complete_redemption)';
comment on column public.customer_cards.cycle_number is 'Increments when merchant confirms redemption';
comment on column public.customer_cards.targets_reached is
  'Times stamp target hit — denominator for redemption rate analytics';

create index customer_cards_customer_id_idx on public.customer_cards (customer_id);
create index customer_cards_merchant_id_idx on public.customer_cards (merchant_id);
create index customer_cards_last_stamped_at_idx on public.customer_cards (last_stamped_at desc nulls last);

-- =============================================================================
-- 5. stamp_sessions — stamp event log (QR scans + admin issue/void)
-- =============================================================================
create table public.stamp_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_card_id uuid not null references public.customer_cards (id) on delete restrict,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  session_token text not null unique,
  source text not null default 'qr_scan'
    check (source in ('qr_scan', 'admin_manual')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'voided')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table public.stamp_sessions is
  'Stamp event log — QR scans and admin manual issues; voided = admin reversal';

create index stamp_sessions_merchant_status_idx on public.stamp_sessions (merchant_id, status);
create index stamp_sessions_customer_card_id_idx on public.stamp_sessions (customer_card_id);
create index stamp_sessions_pending_idx on public.stamp_sessions (merchant_id, created_at desc)
  where status = 'pending';
create index stamp_sessions_approved_idx on public.stamp_sessions (customer_card_id, created_at desc)
  where status = 'approved';

-- =============================================================================
-- 6. redemptions — OTP-verified claim codes
-- =============================================================================
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_card_id uuid not null references public.customer_cards (id) on delete restrict,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  redemption_code text not null unique,
  cycle_number integer not null default 1 check (cycle_number >= 1),
  status text not null default 'pending' check (status in ('pending', 'redeemed')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

comment on table public.redemptions is 'Reward claim codes — single-use after OTP verification';

create index redemptions_merchant_id_idx on public.redemptions (merchant_id);
create index redemptions_customer_card_id_idx on public.redemptions (customer_card_id);

-- =============================================================================
-- 7. audit_log — Super Admin actions
-- =============================================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id) on delete restrict,
  action text not null,
  target_type text not null
    check (target_type in ('merchant', 'customer', 'stamp', 'redemption')),
  target_id uuid not null,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Super Admin actions — service role writes only';

create index audit_log_admin_id_idx on public.audit_log (admin_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

-- =============================================================================
-- 8. otp_tokens — hashed OTPs (server-only via API routes)
-- =============================================================================
create table public.otp_tokens (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  purpose text not null default 'redemption' check (purpose in ('redemption', 'signup')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.otp_tokens is 'Hashed OTPs — redemption MVP; signup purpose reserved for v2';

create index otp_tokens_phone_purpose_idx on public.otp_tokens (phone, purpose, expires_at desc);
