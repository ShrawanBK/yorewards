# YORewards — Technical Implementation Document

### Full Stack Architecture · Monorepo Structure · Implementation Guide

> **Version:** 1.1 · **Date:** June 2026 · **Audience:** Development team / Cursor agent  
> **Stack:** Next.js 16 (App Router) · TypeScript · Supabase · Turborepo  
> **Architecture:** Turborepo monorepo — 3 separate Next.js apps  
> **Hosting:** Vercel (3 deployments) · Supabase EU West (Frankfurt)

---

## Implementation Status

| Area                                                                      | Status                                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Turborepo + pnpm workspace                                                | ✅ Done                                                                  |
| Customer PWA — `apps/customer`                                            | ✅ Day 7 MVP — auth, wallet, scan, OTP, redeem loop · `localhost:3000` |
| Merchant Dashboard — `apps/merchant`                                      | ✅ Scaffolded — local `localhost:3001` · prod `merchant.yorewards.com`   |
| Super Admin — `apps/admin`                                                | ✅ Day 6 MVP complete — all §8.3 routes · FDA · `localhost:3002` |
| `@repo/eslint-config`, `@repo/typescript-config`, `@repo/tailwind-config` | ✅ Done — brand colors live in `tailwind-config`                         |
| `@repo/ui`                                                                | ✅ Done — shadcn (`button`, `input`, `label`, `card`, `badge`, `sonner`) |
| `@repo/supabase`, `@repo/utils`                                           | ✅ Done                                                                  |
| `supabase/` folder (migrations + RLS)                                     | ✅ Done — pushed to cloud                                                |
| next-intl scaffold (all 3 apps)                                           | ✅ Done — `messages/en.json`, middleware, provider                       |
| Local `.env.local` (all 3 apps)                                           | ✅ Done — gitignored                                                     |
| Vercel deployments                                                        | ⏳ Deferred                                                              |
| Admin + merchant auth, approval queue                                     | ✅ Done — email + password (no magic link)                               |
| Multi-business per owner (queries + switcher)                             | ✅ Done                                                                  |
| Merchant business hub UI (list + detail)                                  | ✅ Done (Day 2) — Day 3 polish + branches panel                          |
| Branches / outlets (`merchant_locations`)                                 | ✅ Done — migration + business hub CRUD                                  |
| Loyalty card config (PRD §6.1)                                            | ✅ Done — `/merchant/loyalty-card` + live preview + branch QR PNG          |
| Merchant stamp queue + redeem + analytics (PRD §6.3)                      | ✅ Done (Day 4) — Realtime queue, `/merchant/redeem`, `/merchant/analytics`, customers list |
| Merchant settings + status UX + branch context + success feedback         | ✅ Done (Day 5) — [`Day5_Checklist.md`](../resources/Day5_Checklist.md) |
| Super Admin — full platform (dashboard, customers, stamps, audit)         | ✅ Done (Day 6) — [`Day6_Checklist.md`](../resources/Day6_Checklist.md) |
| Customer auth + wallet + scan + OTP                                       | ✅ Done (Day 7) — [`Day7_Checklist.md`](../resources/Day7_Checklist.md) |
| PWA, privacy, production deploy                                           | ⏳ Day 8 — [`Day8_Checklist.md`](../resources/Day8_Checklist.md) |

**Next up (Day 8):** PWA manifest, privacy policy, production deploy — see [`Day8_Checklist.md`](../resources/Day8_Checklist.md).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack — Locked](#2-technology-stack--locked)
3. [Folder Structure — Per App](#3-folder-structure--per-app)
4. [Database Design](#4-database-design)
5. [State Management](#5-state-management)
6. [Authentication Implementation](#6-authentication-implementation)
7. [Core Stamp Flow Implementation](#7-core-stamp-flow-implementation)
8. [Environment Variables](#8-environment-variables)
9. [Critical Pitfalls & How to Avoid Them](#9-critical-pitfalls--how-to-avoid-them)
10. [Seven-Day Build Plan](#10-seven-day-build-plan)

---

## 1. Architecture Overview

YORewards is a **Turborepo monorepo** containing three independent Next.js applications sharing a common Supabase backend, a shared UI component library, shared TypeScript types, and shared utility functions.

> 💡 **Why Turborepo?** Clean separation between customer, merchant, and admin codebases. No merchant code ships to the customer app. Shared packages eliminate duplication. Three separate Vercel deployments from one Git repo. Scales cleanly into v2 without restructuring.

### 1.1 Monorepo Structure

```
yorewards/
├── supabase/                    ← Day 1: CLI config + migrations
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── apps/
│   ├── customer/                → app.yorewards.com   (local: port 3000)
│   ├── merchant/                → merchant.yorewards.com (local: port 3001)
│   └── admin/                   → admin.yorewards.com (local: port 3002)
├── packages/
│   ├── ui/                      → @repo/ui — shared shadcn/ui components
│   ├── eslint-config/           → @repo/eslint-config
│   ├── typescript-config/       → @repo/typescript-config
│   ├── tailwind-config/         → @repo/tailwind-config — brand colors + PostCSS
│   ├── supabase/                → @repo/supabase — Day 1: client, types, queries
│   └── utils/                   → @repo/utils — Day 1: phone, currency, OTP helpers
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                 → Root scripts delegate via turbo run
├── resources/                   → PRD, this doc, Turborepo setup guide
└── .env.example                 → All env vars documented — never commit real values
```

### 1.2 App Responsibilities

| App        | Domain                   | Primary Users   | Responsibilities                                                                 |
| ---------- | ------------------------ | --------------- | -------------------------------------------------------------------------------- |
| `customer` | `app.yorewards.com`      | End users       | Wallet, QR scan, stamp flow, reward redemption. PWA installable. Mobile-first.   |
| `merchant` | `merchant.yorewards.com` | Business owners | Card setup, stamp approval queue, redemption, analytics. Tablet/desktop primary. |
| `admin`    | `admin.yorewards.com`    | Founder (you)   | Merchant approval, user management, platform analytics, audit log. Desktop only. |

### 1.3 Package Sharing Strategy

| Type                        | Lives in                        | Rule                            |
| --------------------------- | ------------------------------- | ------------------------------- |
| Used by 2+ apps identically | `packages/`                     | Share it                        |
| Used by 2+ apps differently | `packages/` with props/variants | Share base, customise via props |
| Used by 1 app only          | `apps/[app]/`                   | Keep it there                   |
| Config that differs per app | `apps/[app]/.env`               | Env vars — never hardcoded      |

### 1.4 npm / pnpm Package Levels

```
Root package.json          → Dev tools only (TypeScript, ESLint, Prettier, Turbo)
packages/*/package.json    → Own deps + peerDeps for React/Next.js (never bundle React)
apps/*/package.json        → App-specific deps + workspace:* for local packages
node_modules/ (root)       → Hoisted shared packages (React, Next.js — installed once)
```

> ⚠️ **Always use `peerDependencies`** for React and Next.js in shared packages — never bundle them. Bundling causes version conflicts and hooks errors.

### 1.6 Development Conventions

- **Open the repo root** in your editor — pnpm and Turbo expect commands from root.
- **Run app-specific tasks** with `--filter`: `pnpm exec turbo dev --filter=customer`
- **Per-app env files** live in `apps/<app>/.env.local` (or root `.env.local` for shared Supabase keys)
- See `resources/Turborepo_App_Setup_Guide.md` for adding new apps

---

## 2. Technology Stack — Locked

> 🔴 Every library below is mandatory. Do not substitute, upgrade, or add packages without explicit approval. This prevents Cursor from drifting to incompatible versions.

| Layer           | Package                         | Notes                                            |
| --------------- | ------------------------------- | ------------------------------------------------ |
| Framework       | `next`                          | App Router. Full-stack.                          |
| Language        | `typescript`                    | No `any`. Types everywhere.                      |
| UI Components   | `shadcn/ui`                     | Radix UI primitives. Premium look.               |
| Styling         | `tailwindcss`                   | Brand config applied.                            |
| Animations      | `framer-motion`                 | All animations. Spring physics.                  |
| Confetti        | `canvas-confetti`               | Reward unlock celebration.                       |
| Server State    | `@tanstack/react-query`         | All data fetching + caching.                     |
| Client State    | `zustand`                       | Auth session, wallet state.                      |
| Database        | `supabase (postgres)`           | Free tier. EU West (Frankfurt). RLS enabled.     |
| Auth            | `@supabase/auth-helpers-nextjs` | Magic link, email+pw, custom phone.              |
| Real-time       | `supabase realtime`             | Stamp queue only. Not mixed with TanStack.       |
| Storage         | `supabase storage`              | Merchant logos.                                  |
| Image Compress  | `browser-image-compression`     | Compress before upload.                          |
| QR Generate     | `qrcode.react`                  | Merchant QR as SVG.                              |
| QR Scan         | `html5-qrcode`                  | Browser camera. Test on real iPhone early.       |
| SMS — Nepal     | `sparrow-sms (REST)`            | OTP at redemption for +977 only.                 |
| SMS — Finland   | `twilio`                        | OTP at redemption for +358 only.                 |
| i18n            | `next-intl`                     | English MVP. All strings in `/messages/en.json`. |
| PWA             | `next-pwa`                      | Customer app only. Brand manifest.               |
| Hosting         | `vercel`                        | 3 deployments. Auto-deploy from GitHub.          |
| Forms           | `react-hook-form + zod`         | All form validation.                             |
| Icons           | `lucide-react`                  | Ships with shadcn/ui.                            |
| Package Manager | `pnpm`                          | Required for Turborepo monorepo.                 |

### 2.1 Tailwind Brand Configuration

Brand colors and fonts live in `@repo/tailwind-config` (`packages/tailwind-config/tailwind.config.ts`). Each app presets the shared config:

```ts
// apps/customer/tailwind.config.ts
import sharedConfig from "@repo/tailwind-config";

export default {
  presets: [sharedConfig],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
};
```

PostCSS is shared the same way: `export { default } from "@repo/tailwind-config/postcss";`

### 2.2 Critical Integration Rules

> ⚠️ **Supabase Realtime vs TanStack Query — do not mix**  
> Realtime: stamp approval queue **only** (push-based, low latency).  
> TanStack Query: everything else (wallet cards, analytics, merchant data).  
> Mixing both on the same data causes double renders and stale state bugs.

> ⚠️ **Zustand — client components only**  
> Next.js App Router server components do not have access to Zustand store.  
> Every component using Zustand must have `'use client'` at the top.  
> Failure causes hydration mismatch errors that are hard to debug.

> ⚠️ **Supabase RLS — Day 1, not Day 7**  
> Enable Row Level Security on **every** Supabase table before writing any query code.  
> Without RLS, any authenticated user can read any other user's data.  
> Tell Cursor: _"Enable RLS on this table and write policies before any other step."_

---

## 3. Folder Structure — Per App

### 3.1 Customer PWA (`apps/customer` · `localhost:3000` · `app.yorewards.com`)

```
apps/customer/
├── app/                                → Thin routes only (compose from features/widgets)
├── src/
│   ├── features/
│   │   ├── auth/                       → Login, onboarding, guards, store
│   │   ├── wallet/                     → Wallet home, card detail
│   │   ├── scan/                       → QR scanner + scan action
│   │   ├── stamp/                      → Pending/success/rejected/expired + Realtime
│   │   ├── reward/                     → OTP send/verify + redemption code
│   │   └── profile/                    → Profile + logout
│   └── widgets/
│       ├── CustomerShell/              → Bottom nav (Wallet / Scan / Profile)
│       └── CustomerProtectedShell/     → Session guard
├── messages/en.json                    → All UI strings (next-intl)
└── public/                             → PWA manifest (Day 8)
```

### 3.2 Merchant Dashboard (`apps/merchant` · `localhost:3001` · `merchant.yorewards.com`)

```
apps/merchant/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              → Email magic link
│   │   ├── register/page.tsx           → Business registration
│   │   ├── auth/callback/route.ts      → Magic link callback handler
│   │   └── pending/page.tsx            → Awaiting admin approval
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx          → Stamp queue + quick stats (PRIMARY)
│   │   ├── card/page.tsx               → Card config + live preview
│   │   ├── card/qr/page.tsx            → QR display + download
│   │   ├── redeem/page.tsx             → Redemption code entry
│   │   ├── analytics/page.tsx          → Full analytics
│   │   └── settings/page.tsx           → Business profile
│   └── layout.tsx
├── components/
│   ├── stamp-queue/                    → Real-time queue UI (Realtime)
│   ├── card-preview/                   → Live card preview renderer
│   ├── analytics/                      → Stats + activity feed components
│   └── qr-display/                     → QR code + download
├── lib/
│   ├── store/                          → Zustand (authStore, merchantStore)
│   ├── hooks/                          → TanStack Query hooks
│   └── realtime/                       → Supabase Realtime subscription
└── messages/
    └── en.json
```

### 3.3 Super Admin (`apps/admin` · `localhost:3002` · `admin.yorewards.com`)

```
apps/admin/src/
├── features/
│   ├── auth/           → login, guards (requireAdminSession)
│   ├── merchants/      → queue + merchant actions ✅
│   ├── dashboard/      → Phase C
│   ├── customers/      → Phase E
│   ├── stamps/         → Phase F
│   └── audit/          → Phase G
├── widgets/
│   └── AdminShell/     → sidebar nav (Phase B)
└── shared/
    └── utils/          → resolve-action-error, action-feedback

apps/admin/app/admin/
├── login/page.tsx
└── (protected)/
    ├── layout.tsx      → requireAdminSession
    └── merchants/page.tsx
```

### 3.4 Shared Packages Structure

**Exists today:**

| Package                      | Name                      | Purpose                                                        |
| ---------------------------- | ------------------------- | -------------------------------------------------------------- |
| `packages/ui`                | `@repo/ui`                | Shared React components (shadcn/ui + loyalty card, stamp grid) |
| `packages/eslint-config`     | `@repo/eslint-config`     | Shared ESLint rules                                            |
| `packages/typescript-config` | `@repo/typescript-config` | Shared `tsconfig` bases                                        |
| `packages/tailwind-config`   | `@repo/tailwind-config`   | Brand colors, fonts, PostCSS                                   |

**Planned (Day 1 — future reference, not in repo yet):**

```
packages/supabase/          → @repo/supabase
  src/client.ts             → createClient setup
  src/types.ts              → Generated DB types (supabase gen types)
  src/queries/              → customers, merchants, stamps, cards, redemptions

packages/utils/             → @repo/utils
  src/phone.ts              → normalisePhone(), detectCountry()
  src/currency.ts           → formatNPR(), formatEUR()
  src/otp.ts                → generateSixDigitOTP()
```

---

## 4. Database Design

> 💡 **SQL is easier than you think here.** Supabase generates a TypeScript client automatically from your schema. You write: `supabase.from('cards').select('*')`. The Supabase dashboard shows all data visually like a spreadsheet. Use the Table Editor for initial setup — you almost never write raw SQL.

### 4.1 Core Tables

#### `customers`

| Column           | Type          | Notes                                                                        |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| `id`             | `uuid`        | Primary key. Auto-generated.                                                 |
| `phone`          | `text`        | UNIQUE. Primary identifier. E.164 format e.g. `+9779800000000`               |
| `name`           | `text`        | Customer's first name. Set at onboarding.                                    |
| `country_code`   | `text`        | `'NP'` or `'FI'`. Determines SMS provider for OTP.                           |
| `status`         | `text`        | `'active'` \| `'suspended'`. Default: `active`. v2-ready — no table rewrite. |
| `status_reason`  | `text`        | Nullable. Admin note when suspended; cleared on reactivate.                  |
| `created_at`     | `timestamptz` | Auto-set on insert.                                                          |
| `last_active_at` | `timestamptz` | Updated on each login.                                                       |
| `deleted_at`     | `timestamptz` | Nullable. Soft-delete for GDPR. Null = active record.                        |

#### `merchants`

| Column             | Type          | Notes                                                                                                              |
| ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`               | `uuid`        | Primary key. One row = one **business**.                                                                           |
| `user_id`          | `uuid`        | References `auth.users(id)`. Owner. **Not unique** — one owner may own many businesses (multi-business per owner). |
| `business_name`    | `text`        | Display name of the business.                                                                                      |
| `category`         | `text`        | e.g. `'cafe'`, `'salon'`, `'restaurant'`.                                                                          |
| `country`          | `text`        | `'NP'` or `'FI'`.                                                                                                  |
| `logo_url`         | `text`        | Supabase Storage URL. Null until uploaded.                                                                         |
| `primary_color`    | `text`        | Hex e.g. `'#7C3AED'`. Default: brand purple.                                                                       |
| `status`           | `text`        | `'pending'` \| `'active'` \| `'suspended'` \| `'rejected'`. Default: `pending`.                                    |
| `email`            | `text`        | Contact email. Used for magic link auth.                                                                           |
| `phone`            | `text`        | Contact phone. Optional.                                                                                           |
| `created_at`       | `timestamptz` | Auto-set.                                                                                                          |
| `approved_at`      | `timestamptz` | Set when Super Admin approves.                                                                                     |
| `approved_by`      | `uuid`        | Super Admin user ID.                                                                                               |
| `rejection_reason` | `text`        | Nullable. Set when Super Admin rejects registration.                                                               |
| `status_reason`    | `text`        | Nullable. Admin note when suspended; cleared on reactivate.                                                        |

#### `merchant_locations` (branches / outlets)

| Column        | Type          | Notes                                                                                   |
| ------------- | ------------- | --------------------------------------------------------------------------------------- |
| `id`          | `uuid`        | Primary key.                                                                            |
| `merchant_id` | `uuid`        | References `merchants(id)`. CASCADE delete.                                             |
| `name`        | `text`        | Branch label e.g. `'Thamel'`, `'Airport kiosk'`.                                        |
| `address`     | `text`        | Optional street address.                                                                |
| `city`        | `text`        | Optional.                                                                               |
| `is_primary`  | `boolean`     | Default branch for UI; **at most one** `true` per `merchant_id` (partial unique index). |
| `is_active`   | `boolean`     | `false` = hidden from QR list; prefer over hard delete.                                 |
| `created_at`  | `timestamptz` | Auto-set.                                                                               |
| `updated_at`  | `timestamptz` | Auto-updated on change.                                                                 |

> **Migration:** `20260611120000_merchant_locations.sql` — backfills one primary location per existing merchant.  
> **Invariant:** Branches never get their own `merchants` row. One `loyalty_cards` row per business; all branch QRs stamp the same card.

#### `loyalty_cards`

| Column               | Type          | Notes                                                        |
| -------------------- | ------------- | ------------------------------------------------------------ |
| `id`                 | `uuid`        | Primary key.                                                 |
| `merchant_id`        | `uuid`        | References `merchants(id)`.                                  |
| `card_name`          | `text`        | e.g. `'Coffee Lovers Card'`. Max 40 chars.                   |
| `description`        | `text`        | Shown to customer. Max 120 chars.                            |
| `stamp_target`       | `integer`     | Between 5 and 50.                                            |
| `min_spend`          | `numeric`     | Minimum spend per visit. `0` = no minimum.                   |
| `min_spend_currency` | `text`        | `'NPR'` or `'EUR'`.                                          |
| `reward_type`        | `text`        | `'free_item'` \| `'percent_discount'` \| `'fixed_discount'`. |
| `reward_value`       | `text`        | Item name (free_item) or amount/percent (discounts).         |
| `reward_description` | `text`        | Human-readable. e.g. `'Free regular coffee'`.                |
| `is_active`          | `boolean`     | False = paused. No new customers can join.                   |
| `created_at`         | `timestamptz` | Auto-set.                                                    |

#### `customer_cards` (the wallet item)

| Column              | Type          | Notes                                                               |
| ------------------- | ------------- | ------------------------------------------------------------------- |
| `id`                | `uuid`        | Primary key.                                                        |
| `customer_id`       | `uuid`        | References `customers(id)`.                                         |
| `loyalty_card_id`   | `uuid`        | References `loyalty_cards(id)`.                                     |
| `merchant_id`       | `uuid`        | Denormalised for fast wallet queries.                               |
| `current_stamps`    | `integer`     | Stamp count in active cycle. Resets on redemption.                  |
| `total_stamps_ever` | `integer`     | All-time count. Never resets.                                       |
| `reward_status`     | `text`        | `'collecting'` \| `'pending_otp'` \| `'unlocked'`. See §4.6.        |
| `cycle_number`      | `integer`     | Starts at 1; increments on each completed redemption.               |
| `targets_reached`   | `integer`     | Times stamp target hit — analytics denominator for redemption rate. |
| `last_stamped_at`   | `timestamptz` | Used for wallet sort order.                                         |
| `created_at`        | `timestamptz` | Auto-set.                                                           |

#### `stamp_sessions` (stamp event log)

| Column             | Type          | Notes                                                                                        |
| ------------------ | ------------- | -------------------------------------------------------------------------------------------- |
| `id`               | `uuid`        | Primary key.                                                                                 |
| `customer_card_id` | `uuid`        | References `customer_cards(id)`.                                                             |
| `merchant_id`      | `uuid`        | References `merchants(id)`.                                                                  |
| `location_id`      | `uuid`        | Nullable. References `merchant_locations(id)`. **Attribution only** — which counter scanned. |
| `session_token`    | `text`        | UNIQUE. One-time token per QR scan (or UUID for admin issue).                                |
| `source`           | `text`        | `'qr_scan'` \| `'admin_manual'`.                                                             |
| `status`           | `text`        | `'pending'` \| `'approved'` \| `'rejected'` \| `'expired'` \| `'voided'`.                    |
| `rejection_reason` | `text`        | Optional. Set by merchant on reject.                                                         |
| `created_at`       | `timestamptz` | Auto-set. Expires 5 minutes after this (QR pending only).                                    |
| `resolved_at`      | `timestamptz` | Set when approved/rejected/expired/voided.                                                   |

#### `redemptions`

| Column             | Type          | Notes                                                                               |
| ------------------ | ------------- | ----------------------------------------------------------------------------------- |
| `id`               | `uuid`        | Primary key.                                                                        |
| `customer_card_id` | `uuid`        | References `customer_cards(id)`.                                                    |
| `merchant_id`      | `uuid`        | References `merchants(id)`.                                                         |
| `location_id`      | `uuid`        | Nullable. References `merchant_locations(id)`. Branch where redeemed (attribution). |
| `redemption_code`  | `text`        | UNIQUE. 6-digit alphanumeric. Single use.                                           |
| `cycle_number`     | `integer`     | Snapshot of `customer_cards.cycle_number` at OTP verify.                            |
| `status`           | `text`        | `'pending'` \| `'redeemed'`.                                                        |
| `created_at`       | `timestamptz` | Created when OTP verified.                                                          |
| `redeemed_at`      | `timestamptz` | Set when merchant confirms.                                                         |

#### `audit_log`

| Column        | Type          | Notes                                                            |
| ------------- | ------------- | ---------------------------------------------------------------- |
| `id`          | `uuid`        | Primary key.                                                     |
| `admin_id`    | `uuid`        | Super Admin user ID.                                             |
| `action`      | `text`        | e.g. `'approve_merchant'`, `'suspend_customer'`, `'void_stamp'`. |
| `target_type` | `text`        | `'merchant'` \| `'customer'` \| `'stamp'` \| `'redemption'`.     |
| `target_id`   | `uuid`        | ID of the affected record.                                       |
| `notes`       | `text`        | Optional admin notes.                                            |
| `created_at`  | `timestamptz` | Auto-set.                                                        |

#### `otp_tokens` (reward redemption only)

| Column       | Type          | Notes                                                              |
| ------------ | ------------- | ------------------------------------------------------------------ |
| `id`         | `uuid`        | Primary key.                                                       |
| `phone`      | `text`        | Customer phone.                                                    |
| `otp_hash`   | `text`        | Bcrypt hash — never store plain OTP.                               |
| `purpose`    | `text`        | `'redemption'` (v2: extend to `'signup'` — same table, no rewrite) |
| `expires_at` | `timestamptz` | 5-minute expiry.                                                   |
| `created_at` | `timestamptz` | Auto-set.                                                          |

### 4.2 Row Level Security — Required Policies

> ⚠️ **Enable RLS before anything else.** Migration: `20260607130000_rls_policies.sql`

**Auth models (two roles, two JWT paths):**

| Role                 | Auth                         | RLS identity                                                                |
| -------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| **Merchant / Admin** | Supabase Auth (`auth.uid()`) | `current_merchant_ids()` → **all** businesses owned via `merchants.user_id` |
| **Customer**         | Custom session JWT (Day 2)   | `current_customer_id()` via `app_metadata.customer_id`                      |
| **Admin writes**     | Service role                 | Bypasses RLS — never expose key to browser                                  |

> **Day 2 requirement:** Customer login API route must issue a Supabase-compatible JWT (or session) with `app_metadata.customer_id` set to `customers.id`. Phone lookup on login uses **service role** server-side (anon cannot SELECT by phone).

> **Multi-business per owner:** merchant policies scope to `merchant_id IN (SELECT public.current_merchant_ids())` so one logged-in owner can read/write data for **any business they own**. "Which business is active" is a client/display concern; the `WITH CHECK` guarantees writes target an owned business. (`current_merchant_id()` is retained but deprecated — it returns one arbitrary owned business.) Introduced in migration `20260607150000_multi_business_ownership.sql`.

**Helper functions:** `public.current_customer_id()`, `public.current_merchant_ids()` (and legacy `public.current_merchant_id()`)

| Table                | Who Can Read                                                  | Who Can Write                                                                     |
| -------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `customers`          | Own record only (`deleted_at IS NULL`)                        | Insert: anon (signup). Update: own. Admin suspend via service role.               |
| `merchants`          | Owned records (any business) + active merchants for wallet/QR | Insert/update: own (`user_id = auth.uid()`). Admin via service role.              |
| `merchant_locations` | Merchant: locations for owned businesses                      | Insert/update: own (`merchant_id IN current_merchant_ids()`). Deactivate in app.  |
| `loyalty_cards`      | Active cards: public read; merchant: all own                  | Merchant who owns the card.                                                       |
| `customer_cards`     | Own cards + merchant's cards                                  | Insert: customer (first scan). Update: merchant or customer (reward_status).      |
| `stamp_sessions`     | Customer (own) + Merchant (their queue)                       | Insert: customer. Update: merchant (approve/reject). Admin void via service role. |
| `redemptions`        | Customer (own) + Merchant (their redemptions)                 | Insert: service role (OTP verify). Update: merchant (`complete_redemption`).      |
| `audit_log`          | Denied (no policies)                                          | Service role only.                                                                |
| `otp_tokens`         | Denied (no policies)                                          | Service role only.                                                                |

### 4.3 Supabase Type Generation

Run after **every** schema change. Commit the output. Cursor writes much better code with accurate types.

```bash
# Run from monorepo root (cloud-linked — no Docker required)
pnpm exec supabase db push
pnpm supabase:types   # writes packages/supabase/src/types.generated.ts (gitignored)

# Merge new tables/columns into packages/supabase/src/types.ts (strict unions kept manually)

# Import in any app:
import type { Database } from '@repo/supabase/types'
```

### 4.4 Database Migrations

```
supabase/migrations/
  README.md                          ← What each file does (start here)
  20260607120000_extensions.sql      ← pgcrypto
  20260607120001_tables.sql          ← 8 tables + indexes
  20260607120002_functions.sql       ← RPCs
  20260607120003_realtime_and_grants.sql
  20260607130000_rls_policies.sql    ← RLS policies (Section C)
  20260607*_add_*.sql                ← Future additive migrations only
```

Anyone cloning the repo runs `supabase db push` and their database matches production exactly.

### 4.6 Business Logic — RPCs & State Machines

> All multi-step mutations go through Postgres RPCs (atomic, auditable). Admin tools use **service role**; merchant/customer flows use authenticated clients where RLS allows.

#### Reward status (`customer_cards.reward_status`)

```
collecting ──(target hit on approve)──► pending_otp
pending_otp ──(OTP verified)──────────► unlocked
unlocked ──(complete_redemption)──────► collecting  (+ current_stamps = max(stamps − target, 0), cycle_number++)
```

Redemption completion lives on `redemptions.status` (`pending` → `redeemed`), not as a card status.

#### Stamp sessions (`stamp_sessions`)

| `source`       | `status` flow                                     | Used for                              |
| -------------- | ------------------------------------------------- | ------------------------------------- |
| `qr_scan`      | `pending` → `approved` \| `rejected` \| `expired` | Customer scan + merchant queue        |
| `admin_manual` | `approved` (immediate)                            | Super Admin issue tool                |
| either         | `approved` → `voided`                             | Super Admin void (row kept for audit) |

**Stamp history query:** `WHERE status = 'approved'` (exclude `voided`). Pending/expired never counted as earned stamps.

#### Database RPCs

| RPC                                     | Caller               | Purpose                                                            |
| --------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| `increment_stamps(card_id, new_status)` | Merchant approve     | +1 stamp; sets `pending_otp` + `targets_reached++` when target hit |
| `void_stamp(session_id)`                | Admin (service role) | Void one approved session; decrement; recalc status                |
| `issue_stamp_manual(card_id)`           | Admin (service role) | Insert `admin_manual` approved session + increment                 |
| `complete_redemption(redemption_id)`    | Merchant confirm     | Mark redeemed; subtract `stamp_target`, carry overflow; `cycle_number++` |

#### Analytics formulas (merchant dashboard)

| Metric                    | Query                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Stamps issued (period)    | Count `stamp_sessions` where `status = 'approved'` and `created_at` in range         |
| Rewards redeemed (period) | Count `redemptions` where `status = 'redeemed'` and `redeemed_at` in range           |
| Redemption rate           | `SUM(redeemed redemptions) ÷ SUM(customer_cards.targets_reached)` for merchant       |
| Active collectors         | Count `customer_cards` where `reward_status = 'collecting'` and `current_stamps > 0` |

---

### 4.5 Forward-Compatible Schema — v2 Without Rewrites

> 🔴 **Never recreate tables.** All schema changes after Day 1 are **additive migrations** (`ALTER TABLE … ADD COLUMN`, new tables with FKs to existing UUIDs). Production data must survive every upgrade.

| Rule                                                      | Why                                                        | v2 example                                                                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **UUID primary keys everywhere**                          | Stable references across migrations                        | New `merchant_staff` table FKs to existing `merchants.id`                                                                 |
| **Text status columns, not Postgres enums**               | Add new values without `ALTER TYPE` pain                   | `'suspended'` on customers already works; v2 adds `'signup'` to `otp_tokens.purpose`                                      |
| **Nullable columns for future features**                  | Ship MVP without using every column                        | `merchants.rejection_reason`, `customers.deleted_at`                                                                      |
| **`stamp_sessions` = stamp event log**                    | Every stamp (QR or admin) is a row; void = status `voided` | Admin void/issue without a separate `stamp_events` table                                                                  |
| **Denormalised `merchant_id` on child rows**              | Fast RLS + wallet queries today                            | Outlets add optional `location_id` on `stamp_sessions` / `redemptions` (attribution only — balance stays business-scoped) |
| **`loyalty_cards` separate from `merchants`**             | One merchant → many cards/locations later                  | Outlets add rows, not schema surgery                                                                                      |
| **`merchants.user_id` not unique (owner FK)**             | One owner → many businesses without rewrites               | Multi-business per owner ships in MVP; multi-**staff** later = `merchant_staff(user_id, merchant_id, role)`               |
| **Outlet = child of a merchant, never a `merchants` row** | Keeps one shared card + cross-branch stamping correct      | Outlets land as `merchant_locations(merchant_id, …)`; registering a branch as its own merchant would split the balance    |
| **`auth.users` for merchant identity**                    | Supabase Auth owns credentials                             | v2 multi-staff = new `merchant_staff(user_id, merchant_id, role)` — `merchants.user_id` stays owner                       |
| **Soft delete over hard delete**                          | GDPR + audit retention                                     | `customers.deleted_at`; queries filter `WHERE deleted_at IS NULL`                                                         |
| **One migration file per change**                         | Reproducible dev/staging/prod                              | `20260701_add_merchant_staff.sql` — never edit old migrations                                                             |

**v2 features that add tables (not rewrites):**

| v2 feature                | New artifact                                                       | Existing tables unchanged                                                   |
| ------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Phone OTP at signup       | Extend `otp_tokens.purpose`                                        | `customers`                                                                 |
| Multi-staff merchants     | `merchant_staff` table                                             | `merchants`, `loyalty_cards`                                                |
| Subscription billing      | `subscriptions` table                                              | `merchants`                                                                 |
| Per-stamp void/history UI | Optional `stamp_events` in v2                                      | `stamp_sessions` with `voided` status + `source`                            |
| Outlets / branches        | ✅ Day 3 — `merchant_locations` + nullable `location_id` on events | `merchants`, `loyalty_cards`, `customer_cards` (card stays business-scoped) |

### 4.7 Ownership Model — Multi-Business & Branches (MVP)

Three distinct concepts — do not conflate them:

| Concept             | Meaning                                   | Status    | Modeled as                                  |
| ------------------- | ----------------------------------------- | --------- | ------------------------------------------- |
| **Owner**           | A person who logs in (`auth.users`)       | MVP ✅    | `merchants.user_id` (**not unique**)        |
| **Business**        | A brand/storefront with its own card + QR | MVP ✅    | a `merchants` row                           |
| **Outlet / branch** | A physical location of one business       | MVP Day 3 | `merchant_locations` (child of `merchants`) |

**Multi-business per owner (done)**

- One owner → many businesses. Each business is its own `merchants` row with its own `loyalty_cards`.
- RLS is set-based: `merchant_id IN (SELECT public.current_merchant_ids())`.
- Merchant app picks an **active business** via switcher; writes pass explicit `merchant_id`, validated by `WITH CHECK`.

**Branches per business (Day 3)**

1. `merchant_locations` — migration `20260611120000_merchant_locations.sql`.
2. Backfill one **primary** location per existing merchant on migrate.
3. Nullable `location_id` on **event** tables only: `stamp_sessions`, `redemptions` (attribution + per-branch analytics).
4. QR codes encode `loyalty_card_id` + `location_id` — each counter identifiable; **all** branch QRs resolve to the **same** card.
5. Merchant UI: **Business hub** (`/merchant/business`) — list businesses, view detail, add/edit/deactivate branches.

**Invariant (write this in stone):**

- A customer holds **one** `customer_cards` row per business (`unique (customer_id, loyalty_card_id)`), so stamps from **any** branch increment the **same** balance, and a reward earned at branch A is redeemable at branch B.
- `location_id` is **attribution only** — it must never filter or partition the stamp count or redemption scope (redemption stays `merchant_id`-scoped).
- An outlet is **always a child of a merchant**, never its own `merchants` row. Registering a branch as a separate merchant would split the card balance and break cross-branch stamping.

---

## 5. State Management

### 5.1 Zustand — Client State

Keep stores minimal. Only put state here that is needed across multiple components and doesn't come from the server.

| Store           | State                                                      | Used By                            |
| --------------- | ---------------------------------------------------------- | ---------------------------------- |
| `authStore`     | `session, user, role (customer/merchant/admin), isLoading` | All apps — layout, route guards    |
| `walletStore`   | `selectedCardId, scanResult, pendingSessionId`             | Customer app — scan and stamp flow |
| `merchantStore` | `merchantProfile, activeCardId, stampQueue[]`              | Merchant app — dashboard           |

> ⚠️ Every component using Zustand **must** have `'use client'` at the top.

### 5.2 TanStack Query — Server State

TanStack Query handles all data fetching from Supabase. Use it for everything except the stamp approval real-time queue.

| Query Key                   | Data                                     | Stale Time                           |
| --------------------------- | ---------------------------------------- | ------------------------------------ |
| `['wallet', customerId]`    | All `customer_cards`                     | 30 seconds — refetch on window focus |
| `['card', cardId]`          | Single `customer_card` + `loyalty_card`  | 10 seconds                           |
| `['merchant', merchantId]`  | Merchant profile + card config           | 5 minutes                            |
| `['locations', merchantId]` | `merchant_locations` for active business | 5 minutes                            |
| `['analytics', merchantId]` | Stamp + redemption counts                | 1 minute                             |
| `['admin', 'merchants']`    | All merchants list                       | 30 seconds                           |
| `['admin', 'platform']`     | Platform-wide stats                      | 1 minute                             |

### 5.3 Supabase Realtime — Stamp Queue Only

```ts
// apps/merchant/lib/realtime/stamp-queue.ts
// Merchant: subscribe to incoming stamp requests
const channel = supabase
  .channel("stamp-queue")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "stamp_sessions",
      filter: `merchant_id=eq.${merchantId}`,
    },
    (payload) => {
      // Add to local queue in Zustand merchantStore
      addToQueue(payload.new);
    },
  )
  .subscribe();

// apps/customer/lib/realtime/stamp-status.ts
// Customer: subscribe to own session status change
const channel = supabase
  .channel("stamp-status")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "stamp_sessions",
      filter: `id=eq.${sessionId}`,
    },
    (payload) => {
      // Navigate based on payload.new.status
      // 'approved' → /stamp/success
      // 'rejected' → /stamp/rejected
    },
  )
  .subscribe();
```

---

## 6. Authentication Implementation

### 6.1 Customer Auth — Phone + No OTP

```ts
// packages/supabase/src/queries/customers.ts
export async function loginOrCreateCustomer(phone: string, name?: string) {
  // Normalise phone to E.164 format
  const normalised = normalisePhone(phone); // e.g. +9779800000000

  // Check if customer exists
  const { data: existing } = await supabase
    .from("customers")
    .select("id, name")
    .eq("phone", normalised)
    .single();

  if (existing) {
    await supabase
      .from("customers")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);
    return { customer: existing, isNew: false };
  }

  // New customer — create record
  const { data: created } = await supabase
    .from("customers")
    .insert({ phone: normalised, name, country_code: detectCountry(phone) })
    .select()
    .single();

  return { customer: created, isNew: true };
}
```

### 6.2 Reward Redemption OTP Flow

```ts
// apps/customer/app/api/otp/send/route.ts
export async function sendRedemptionOTP(phone: string, countryCode: string) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Store hashed OTP — never store plain OTP
  await supabase.from("otp_tokens").insert({
    phone,
    otp_hash: await bcrypt.hash(otp, 10),
    expires_at: expiry.toISOString(),
    purpose: "redemption",
  });

  // Send via correct provider
  if (countryCode === "NP") {
    await fetch("https://api.sparrowsms.com/v2/sms/", {
      method: "POST",
      body: JSON.stringify({
        token: process.env.SPARROW_SMS_TOKEN,
        from: "YORewards",
        to: phone,
        text: `Your YORewards code: ${otp}. Valid 5 minutes.`,
      }),
    });
  } else {
    await twilioClient.messages.create({
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: `Your YORewards code: ${otp}. Valid 5 minutes.`,
    });
  }
}
```

### 6.3 Merchant Auth — Magic Link

```ts
// apps/merchant/lib/api/auth.ts
export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "https://merchant.yorewards.com/auth/callback",
    },
  });
  return { error };
}

// Handle callback in:
// apps/merchant/app/auth/callback/route.ts  (Next.js Route Handler)
```

### 6.4 Admin Auth — Email + Password

```ts
// apps/admin/lib/api/auth.ts
export async function adminLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { session: data.session, error };
}
```

---

## 7. Core Stamp Flow Implementation

### 7.1 QR Code — Merchant Side

```tsx
// apps/merchant/components/qr-display/MerchantQR.tsx
import { QRCodeSVG } from "qrcode.react";

// QR encodes a URL — customer scans and browser opens it
// `l` = branch (merchant_locations.id) for attribution; same card balance across branches
const qrValue = `https://app.yorewards.com/scan?m=${merchantId}&c=${cardId}&l=${locationId}`;

export function MerchantQR({ merchantId, cardId }: Props) {
  return (
    <QRCodeSVG
      value={qrValue}
      size={280}
      fgColor="#1E1B4B"
      bgColor="#FFFFFF"
      level="H" // High error correction — important for printed QRs
    />
  );
}
```

### 7.2 Stamp Session Creation — Customer Side

```ts
// apps/customer/app/(main)/scan/page.tsx
async function handleScan(merchantId: string, cardId: string) {
  // 1. Get or create customer_card (wallet item)
  const customerCard = await getOrCreateCustomerCard(
    customerId,
    cardId,
    merchantId,
  );

  // 2. Create one-time session token
  const sessionToken = crypto.randomUUID();

  // 3. Insert stamp_session with 'pending' status
  const { data: session } = await supabase
    .from("stamp_sessions")
    .insert({
      customer_card_id: customerCard.id,
      merchant_id: merchantId,
      session_token: sessionToken,
      status: "pending",
    })
    .select()
    .single();

  // 4. Redirect to pending screen — Realtime handles the rest
  router.push(`/stamp/pending/${session.id}`);
}
```

### 7.3 Stamp Approval — Merchant Side

```ts
// packages/supabase/src/queries/stamps.ts
export async function approveStamp(sessionId: string, customerCardId: string) {
  // 1. Update session to 'approved'
  await supabase
    .from("stamp_sessions")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("id", sessionId);

  // 2. Increment stamp count atomically (prevents race conditions)
  const { data: card } = await supabase
    .from("customer_cards")
    .select("current_stamps, loyalty_card_id")
    .eq("id", customerCardId)
    .single();

  const newCount = card.current_stamps + 1;
  const loyaltyCard = await getLoyaltyCard(card.loyalty_card_id);
  const rewardReached = newCount >= loyaltyCard.stamp_target;

  // Use DB RPC for atomic increment — prevents double-stamp race condition
  await supabase.rpc("increment_stamps", {
    card_id: customerCardId,
    new_status: rewardReached ? "pending_otp" : "collecting",
  });
  // Supabase Realtime pushes session update to customer instantly
}
```

### 7.4 Admin Stamp Tools & Redemption Complete

```ts
// Admin void — pick an approved stamp_session from history
await supabase.rpc("void_stamp", { p_session_id: sessionId });
await supabase.from("audit_log").insert({
  admin_id,
  action: "void_stamp",
  target_type: "stamp",
  target_id: sessionId,
  notes,
});

// Admin manual issue
const { data: sessionId } = await supabase.rpc("issue_stamp_manual", {
  p_card_id: customerCardId,
});

// Merchant confirms redemption code
await supabase.rpc("complete_redemption", { p_redemption_id: redemptionId });
```

---

## 8. Environment Variables

> Set in three places: `.env.local` (dev), Vercel Preview env, Vercel Production env. **Do all three on Day 1.**

### 8.1 Shared — All Apps

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Server only — never expose to browser
```

### 8.2 Customer App (Customer PWA — `localhost:3000` / `app.yorewards.com`)

```bash
# Dev: http://localhost:3000 · Prod: https://app.yorewards.com
NEXT_PUBLIC_APP_URL=https://app.yorewards.com
NEXT_PUBLIC_MERCHANT_URL=https://merchant.yorewards.com
SPARROW_SMS_TOKEN=your-sparrow-token              # Nepal OTP
SPARROW_SMS_FROM=YORewards
TWILIO_ACCOUNT_SID=your-twilio-sid               # Finland OTP
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OTP_BCRYPT_ROUNDS=10                             # For hashing OTPs
```

### 8.3 Merchant App (Merchant Dashboard — `localhost:3001` / `merchant.yorewards.com`)

```bash
# Dev: http://localhost:3001 · Prod: https://merchant.yorewards.com
NEXT_PUBLIC_MERCHANT_URL=https://merchant.yorewards.com
NEXT_PUBLIC_APP_URL=https://app.yorewards.com
```

### 8.4 Admin App (Super Admin — `localhost:3002` / `admin.yorewards.com`)

```bash
# Dev: http://localhost:3002 · Prod: https://admin.yorewards.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yorewards.com
ADMIN_EMAIL=your-admin-email@yorewards.com       # Single super admin account
```

**Authorization (Day 6 Phase A):**

- `requireAdminSession()` in `apps/admin/src/features/auth/utils/requireAdminAuth.ts` — used by `(protected)/layout.tsx`; redirects unauthenticated users to `/admin/login` and signs out non-admins.
- `requireAdminForAction()` — used by every admin server action; returns `fail("UNAUTHORIZED")` or `fail("FORBIDDEN")`.
- Admin check: `user.app_metadata.role === 'admin'` **or** signed-in email matches `ADMIN_EMAIL` (case-insensitive).
- Login rejects non-admin credentials with `FORBIDDEN` after sign-out.
- FDA layout under `apps/admin/src/features/*` (auth, merchants, dashboard, customers, stamps, audit) + `widgets/AdminShell`.
- Platform stats: `@repo/supabase/queries/platform` (`getPlatformStats`, `getPlatformRecentActivity`) via **service role** — admin app enforces access with `requireAdminSession()` before calling.
- **Routes (PRD §8.3):** `/admin/login`, `/admin/dashboard`, `/admin/merchants`, `/admin/merchants/[id]`, `/admin/customers`, `/admin/customers/[id]`, `/admin/stamps`, `/admin/audit`.
- **Manual stamps:** `@repo/supabase/queries/admin-stamps` — typed lookup (phone, customer name, merchant, loyalty card name, full card UUID) → `issue_stamp_manual` / `void_stamp` RPCs + `audit_log`.
- **Audit log:** `@repo/supabase/queries/admin-audit` — paginated log with action/target filters; all merchant, customer, and stamp mutations write `audit_log` rows.

---

## 9. Critical Pitfalls & How to Avoid Them

| Severity | Pitfall                          | What Goes Wrong                                         | How to Avoid                                                            |
| -------- | -------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| 🔴       | RLS not enabled                  | Any user reads any other user's data. Silent data leak. | Enable RLS on every table on Day 1. First Cursor prompt of the project. |
| 🔴       | Realtime + TanStack on same data | Double renders, stale state, confusing bugs.            | Realtime: stamp queue only. TanStack: everything else.                  |
| 🔴       | Zustand in server components     | Hydration mismatch errors. Hard to debug.               | Every Zustand component needs `'use client'`.                           |
| 🟡       | QR scanner on iOS Safari         | Camera permission fails silently or crashes.            | Test `html5-qrcode` on real iPhone on **Day 4**. Not emulator.          |
| 🟡       | Magic link expires silently      | Merchant clicks link 90 min later, gets blank page.     | Add 'Link expired — request new one' screen on auth callback.           |
| 🟡       | Logo upload too large            | Supabase Storage slow UX. Free tier 50MB limit.         | Use `browser-image-compression` before every upload. Max: 500KB.        |
| 🟡       | Three envs not configured        | Preview deploys fail with missing API keys.             | Set `.env.local`, Vercel Preview, and Vercel Production on Day 1.       |
| 🟡       | Cursor context lost mid-session  | Agent forgets stack, introduces wrong libraries.        | Start each session with PRD + this doc. Use `--filter` for app scope.   |
| 🟢       | Supabase types outdated          | TypeScript errors after schema changes.                 | Run `supabase gen types` after every schema change. Commit the file.    |
| 🟢       | iOS PWA push notifications       | iOS Safari has limited push support.                    | Use in-app only for iOS. Browser push works on Android + desktop.       |
| 🟢       | Stamp count race condition       | Two fast approvals double-increment.                    | Use Supabase RPC (DB function) for increment — atomic operation.        |

---

## 10. Build Plan (Days 1–8)

> Full day-by-day deliverables are in **PRD Section 11**. Per-day checklists live in `resources/Day*_Checklist.md`.

| Day   | Technical focus  | Key outputs                                                                                                                                           |
| ----- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Foundation       | ~~Turborepo + 3 apps~~ ✅ · Supabase + 8 tables + RLS · forward-compatible columns · `@repo/supabase` · shadcn/ui · next-intl · env vars · Vercel     |
| **2** | Auth             | Merchant/admin email+password, route guards, multi-business switcher, admin approval queue                                                            |
| **3** | Cards + branches | `merchant_locations` migration, business hub UI, PRD §6.1 card config, live preview, per-branch QR PNG — [`Day3_Checklist.md`](Day3_Checklist.md) |
| **4** | Merchant counter | Realtime queue, approval flow, redeem, analytics, customers — [`Day4_Checklist.md`](Day4_Checklist.md) |
| **5** | Merchant MVP     | Settings, preferences, status UX, branch context, sign-off — [`Day5_Checklist.md`](Day5_Checklist.md) |
| **6** | Super Admin      | Platform dashboard, customers, manual stamps, audit log, FDA — [`Day6_Checklist.md`](Day6_Checklist.md) |
| **7** | Customer PWA     | ✅ Auth, wallet, scan, Realtime stamp flow, OTP, redemption — [`Day7_Checklist.md`](Day7_Checklist.md) |
| **8** | Launch           | PWA manifest, privacy policy, E2E, production deploy — [`Day8_Checklist.md`](Day8_Checklist.md) |

> 📋 **Session starter:** _"Build YORewards per PRD + Technical Doc. Use only the locked stack. Check Implementation Status first."_

---

_YORewards — Technical Implementation Document · v1.1_  
_Build clean. Ship fast. Validate everything. · Nepal 🇳🇵 · Finland 🇫🇮_
