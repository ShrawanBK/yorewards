# YORewards — Technical Implementation Document

### Full Stack Architecture · Monorepo Structure · Implementation Guide

> **Version:** 1.0 · **Date:** May 2026 · **Audience:** Development team / Cursor agent  
> **Stack:** Next.js 14 · TypeScript · Supabase · Turborepo  
> **Architecture:** Turborepo monorepo — 3 separate Next.js apps  
> **Hosting:** Vercel (3 deployments) · Supabase EU West (Frankfurt)

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

YORewards is a **Turborepo monorepo** containing three independent Next.js 14 applications sharing a common Supabase backend, a shared UI component library, shared TypeScript types, and shared utility functions.

> 💡 **Why Turborepo?** Clean separation between customer, merchant, and admin codebases. No merchant code ships to the customer app. Shared packages eliminate duplication. Three separate Vercel deployments from one Git repo. Scales cleanly into v2 without restructuring.

### 1.1 Monorepo Structure

```
yorewards/
├── supabase/                    ← Supabase CLI config + migrations (version control for DB)
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── apps/
│   ├── customer/                → app.yorewards.com        (Customer PWA)
│   ├── merchant/                → merchant.yorewards.com   (Merchant Dashboard)
│   └── admin/                   → admin.yorewards.com      (Super Admin)
├── packages/
│   ├── ui/                      → Shared shadcn/ui components
│   ├── supabase/                → Supabase client + generated DB types + query functions
│   ├── utils/                   → Shared helpers (formatters, validators, OTP)
│   └── config/                  → Shared Tailwind + TypeScript configs
├── turbo.json
├── package.json                 → Root workspace config (pnpm)
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

### 1.5 Cursor Agent Rule — Critical

> ⚠️ **One Cursor window per app — non-negotiable.**  
> Open `apps/customer`, `apps/merchant`, and `apps/admin` as **separate Cursor projects**.  
> Never open the monorepo root in Cursor — it confuses the agent about which `package.json`, `tsconfig`, and env file to use.

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

```ts
// packages/config/tailwind.base.ts
import type { Config } from "tailwindcss";

export const brandColors = {
  purple: "#7C3AED", // Primary — buttons, logo, active states
  pink: "#EC4899", // Accent — gradient partner, highlights
  green: "#10B981", // Success — stamp confirmed, reward unlocked
  amber: "#F59E0B", // Warm — warnings, min spend alerts
  deep: "#1E1B4B", // Dark — headings, dark text
  surface: "#F8F7FF", // Background — app bg, card surfaces
  red: "#EF4444", // Error — rejected, destructive
};

export const tailwindBase: Partial<Config> = {
  theme: {
    extend: {
      colors: { brand: brandColors },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
};
```

Each app extends this base:

```ts
// apps/customer/tailwind.config.ts
import { tailwindBase } from "@yorewards/config/tailwind.base";
const config = {
  ...tailwindBase,
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
export default config;
```

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

### 3.1 Customer App (`apps/customer`)

```
apps/customer/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              → Phone number entry
│   │   └── onboarding/page.tsx         → Name entry (first time only)
│   ├── (main)/
│   │   ├── wallet/page.tsx             → Wallet home — card grid
│   │   ├── wallet/[cardId]/page.tsx    → Card detail
│   │   ├── scan/page.tsx               → QR scanner
│   │   ├── stamp/
│   │   │   ├── pending/[id]/page.tsx   → Awaiting approval (Realtime)
│   │   │   ├── success/page.tsx        → Stamp confirmed
│   │   │   └── rejected/page.tsx       → Stamp rejected + reason
│   │   ├── reward/[cardId]/page.tsx    → Claim reward + OTP verification
│   │   └── profile/page.tsx            → Phone, name, logout
│   ├── layout.tsx                      → Root layout + providers
│   └── page.tsx                        → Redirect logic
├── components/
│   ├── loyalty-card/                   → Card renderer (branded)
│   ├── stamp-grid/                     → Stamp circle grid component
│   ├── qr-scanner/                     → html5-qrcode wrapper
│   └── wallet/                         → Wallet UI components
├── lib/
│   ├── store/                          → Zustand stores (authStore, walletStore)
│   ├── hooks/                          → TanStack Query hooks
│   └── api/                            → Supabase query functions
├── messages/
│   └── en.json                         → All UI strings — no hardcoded text in components
└── public/
    └── manifest.json                   → PWA manifest
```

### 3.2 Merchant App (`apps/merchant`)

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
│   ├── analytics/                      → Chart components (recharts)
│   └── qr-display/                     → QR code + download
├── lib/
│   ├── store/                          → Zustand (authStore, merchantStore)
│   ├── hooks/                          → TanStack Query hooks
│   └── realtime/                       → Supabase Realtime subscription
└── messages/
    └── en.json
```

### 3.3 Admin App (`apps/admin`)

```
apps/admin/
├── app/
│   ├── login/page.tsx                  → Email + password
│   ├── dashboard/page.tsx              → Platform overview stats
│   ├── merchants/page.tsx              → Merchant list + approval queue
│   ├── merchants/[id]/page.tsx         → Merchant detail + action log
│   ├── customers/page.tsx              → Customer list + suspend
│   ├── stamps/page.tsx                 → Manual stamp issue/void
│   └── audit/page.tsx                  → Full audit log
├── components/
│   ├── merchant-table/
│   ├── customer-table/
│   └── audit-log/
└── lib/
    ├── store/
    └── hooks/
```

### 3.4 Shared Packages Structure

```
packages/
├── ui/
│   └── src/
│       ├── index.ts                    → Barrel export
│       ├── loyalty-card/              → Base card component (variants: customer/merchant-preview/admin)
│       ├── stamp-grid/                → Base stamp grid
│       └── [other shared components]
├── supabase/
│   └── src/
│       ├── index.ts
│       ├── client.ts                  → createClient setup
│       ├── types.ts                   → Generated DB types (run: supabase gen types)
│       └── queries/
│           ├── customers.ts           → getCustomer(), createCustomer()
│           ├── merchants.ts           → getMerchant(), approveMerchant()
│           ├── stamps.ts              → createStampSession(), approveStamp()
│           ├── cards.ts               → getLoyaltyCard(), createCard()
│           └── redemptions.ts         → createRedemption(), redeemCode()
├── utils/
│   └── src/
│       ├── index.ts
│       ├── phone.ts                   → normalisePhone(), detectCountry()
│       ├── currency.ts                → formatNPR(), formatEUR()
│       └── otp.ts                     → generateSixDigitOTP()
└── config/
    ├── tailwind.base.ts               → Brand colors + fonts
    └── tsconfig.base.json             → Shared TypeScript config
```

---

## 4. Database Design

> 💡 **SQL is easier than you think here.** Supabase generates a TypeScript client automatically from your schema. You write: `supabase.from('cards').select('*')`. The Supabase dashboard shows all data visually like a spreadsheet. Use the Table Editor for initial setup — you almost never write raw SQL.

### 4.1 Core Tables

#### `customers`

| Column           | Type          | Notes                                                          |
| ---------------- | ------------- | -------------------------------------------------------------- |
| `id`             | `uuid`        | Primary key. Auto-generated.                                   |
| `phone`          | `text`        | UNIQUE. Primary identifier. E.164 format e.g. `+9779800000000` |
| `name`           | `text`        | Customer's first name. Set at onboarding.                      |
| `country_code`   | `text`        | `'NP'` or `'FI'`. Determines SMS provider for OTP.             |
| `created_at`     | `timestamptz` | Auto-set on insert.                                            |
| `last_active_at` | `timestamptz` | Updated on each login.                                         |

#### `merchants`

| Column          | Type          | Notes                                                           |
| --------------- | ------------- | --------------------------------------------------------------- |
| `id`            | `uuid`        | Primary key.                                                    |
| `user_id`       | `uuid`        | References `auth.users(id)`. Supabase auth user.                |
| `business_name` | `text`        | Display name of the business.                                   |
| `category`      | `text`        | e.g. `'cafe'`, `'salon'`, `'restaurant'`.                       |
| `country`       | `text`        | `'NP'` or `'FI'`.                                               |
| `logo_url`      | `text`        | Supabase Storage URL. Null until uploaded.                      |
| `primary_color` | `text`        | Hex e.g. `'#7C3AED'`. Default: brand purple.                    |
| `status`        | `text`        | `'pending'` \| `'active'` \| `'suspended'`. Default: `pending`. |
| `email`         | `text`        | Contact email. Used for magic link auth.                        |
| `phone`         | `text`        | Contact phone. Optional.                                        |
| `created_at`    | `timestamptz` | Auto-set.                                                       |
| `approved_at`   | `timestamptz` | Set when Super Admin approves.                                  |
| `approved_by`   | `uuid`        | Super Admin user ID.                                            |

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

| Column              | Type          | Notes                                                              |
| ------------------- | ------------- | ------------------------------------------------------------------ |
| `id`                | `uuid`        | Primary key.                                                       |
| `customer_id`       | `uuid`        | References `customers(id)`.                                        |
| `loyalty_card_id`   | `uuid`        | References `loyalty_cards(id)`.                                    |
| `merchant_id`       | `uuid`        | Denormalised for fast wallet queries.                              |
| `current_stamps`    | `integer`     | Stamp count in active cycle. Resets on redemption.                 |
| `total_stamps_ever` | `integer`     | All-time count. Never resets.                                      |
| `reward_status`     | `text`        | `'collecting'` \| `'pending_otp'` \| `'unlocked'` \| `'redeemed'`. |
| `last_stamped_at`   | `timestamptz` | Used for wallet sort order.                                        |
| `created_at`        | `timestamptz` | Auto-set.                                                          |

#### `stamp_sessions` (QR scan events)

| Column             | Type          | Notes                                                       |
| ------------------ | ------------- | ----------------------------------------------------------- |
| `id`               | `uuid`        | Primary key.                                                |
| `customer_card_id` | `uuid`        | References `customer_cards(id)`.                            |
| `merchant_id`      | `uuid`        | References `merchants(id)`.                                 |
| `session_token`    | `text`        | UNIQUE. One-time token per QR scan.                         |
| `status`           | `text`        | `'pending'` \| `'approved'` \| `'rejected'` \| `'expired'`. |
| `rejection_reason` | `text`        | Optional. Set by merchant on reject.                        |
| `created_at`       | `timestamptz` | Auto-set. Expires 5 minutes after this.                     |
| `resolved_at`      | `timestamptz` | Set when approved/rejected/expired.                         |

#### `redemptions`

| Column             | Type          | Notes                                     |
| ------------------ | ------------- | ----------------------------------------- |
| `id`               | `uuid`        | Primary key.                              |
| `customer_card_id` | `uuid`        | References `customer_cards(id)`.          |
| `merchant_id`      | `uuid`        | References `merchants(id)`.               |
| `redemption_code`  | `text`        | UNIQUE. 6-digit alphanumeric. Single use. |
| `status`           | `text`        | `'pending'` \| `'redeemed'`.              |
| `created_at`       | `timestamptz` | Created when OTP verified.                |
| `redeemed_at`      | `timestamptz` | Set when merchant confirms.               |

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

### 4.2 Row Level Security — Required Policies

> ⚠️ **Enable RLS before anything else.** Tell Cursor at the start of Day 1: _"Enable RLS on every table. Customers can only read their own records. Merchants can only read records belonging to their merchant_id. Admin has service role (bypasses RLS)."_

| Table            | Who Can Read                                  | Who Can Write                                                                              |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `customers`      | Own record only                               | Insert: anyone (sign up). Update: own record.                                              |
| `merchants`      | Own record only                               | Insert: anyone (register). Update: own record.                                             |
| `loyalty_cards`  | All authenticated users                       | Merchant who owns the card.                                                                |
| `customer_cards` | Own cards only                                | Insert: customer on first scan. Update: merchant (stamp count) + customer (reward_status). |
| `stamp_sessions` | Customer (own) + Merchant (their queue)       | Insert: customer. Update: merchant (approve/reject).                                       |
| `redemptions`    | Customer (own) + Merchant (their redemptions) | Insert: system. Update: merchant only.                                                     |
| `audit_log`      | Admin only                                    | Admin only (service role).                                                                 |

### 4.3 Supabase Type Generation

Run after **every** schema change. Commit the output. Cursor writes much better code with accurate types.

```bash
# Run from monorepo root
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  --schema public \
  > packages/supabase/src/types.ts

# Import in any app:
import type { Database } from '@yorewards/supabase/types'
```

### 4.4 Database Migrations

```
supabase/migrations/
  20260529_001_init.sql              ← All 7 tables created
  20260529_002_add_min_spend.sql     ← Schema change example
  20260529_003_rls_policies.sql      ← RLS policies
```

Anyone cloning the repo runs `supabase db push` and their database matches production exactly.

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

| Query Key                   | Data                                    | Stale Time                           |
| --------------------------- | --------------------------------------- | ------------------------------------ |
| `['wallet', customerId]`    | All `customer_cards`                    | 30 seconds — refetch on window focus |
| `['card', cardId]`          | Single `customer_card` + `loyalty_card` | 10 seconds                           |
| `['merchant', merchantId]`  | Merchant profile + card config          | 5 minutes                            |
| `['analytics', merchantId]` | Stamp + redemption counts               | 1 minute                             |
| `['admin', 'merchants']`    | All merchants list                      | 30 seconds                           |
| `['admin', 'platform']`     | Platform-wide stats                     | 1 minute                             |

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
const qrValue = `https://app.yorewards.com/scan?m=${merchantId}&c=${cardId}`;

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

---

## 8. Environment Variables

> Set in three places: `.env.local` (dev), Vercel Preview env, Vercel Production env. **Do all three on Day 1.**

### 8.1 Shared — All Apps

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Server only — never expose to browser
```

### 8.2 Customer App

```bash
NEXT_PUBLIC_APP_URL=https://app.yorewards.com
NEXT_PUBLIC_MERCHANT_URL=https://merchant.yorewards.com
SPARROW_SMS_TOKEN=your-sparrow-token              # Nepal OTP
SPARROW_SMS_FROM=YORewards
TWILIO_ACCOUNT_SID=your-twilio-sid               # Finland OTP
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OTP_BCRYPT_ROUNDS=10                             # For hashing OTPs
```

### 8.3 Merchant App

```bash
NEXT_PUBLIC_MERCHANT_URL=https://merchant.yorewards.com
NEXT_PUBLIC_APP_URL=https://app.yorewards.com
```

### 8.4 Admin App

```bash
NEXT_PUBLIC_ADMIN_URL=https://admin.yorewards.com
ADMIN_EMAIL=your-admin-email@yorewards.com       # Single super admin account
```

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
| 🟡       | Cursor context lost mid-session  | Agent forgets stack, introduces wrong libraries.        | New Cursor session every day. Paste PRD + folder structure at start.    |
| 🟢       | Supabase types outdated          | TypeScript errors after schema changes.                 | Run `supabase gen types` after every schema change. Commit the file.    |
| 🟢       | iOS PWA push notifications       | iOS Safari has limited push support.                    | Use in-app only for iOS. Browser push works on Android + desktop.       |
| 🟢       | Stamp count race condition       | Two fast approvals double-increment.                    | Use Supabase RPC (DB function) for increment — atomic operation.        |

---

## 10. Seven-Day Build Plan

> 📋 **Cursor session starter prompt — paste at start of every session:**  
> _"You are building YORewards. Follow the Technical Implementation Document exactly. Use only the specified stack. Do not add any libraries not in the stack. Start by reading the folder structure, then build today's task."_

| Day   | Focus             | App(s)              | Exact Deliverables                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | Foundation        | All                 | Turborepo + pnpm init. All 3 Next.js apps scaffolded. Supabase project created (EU West). All 7 tables + RLS enabled. Tailwind brand config in `packages/config`. shadcn/ui installed in all apps. next-intl scaffold (`en.json`). All env vars set (`.env.local` + Vercel Preview + Vercel Production). GitHub repo created. All 3 apps deployed to Vercel.                                                                                                                               |
| **2** | Auth & Onboarding | All                 | Customer phone login + Zustand `authStore`. Customer onboarding (name entry). Merchant email magic link + auth callback route. Merchant register form. Admin email+password login. Route guards on all protected pages. Merchant pending approval screen.                                                                                                                                                                                                                                  |
| **3** | Card System       | Merchant            | Merchant card config form (name, description, logo, color, stamp target, min spend, all 3 reward types). `browser-image-compression` on logo upload. Live card preview renderer (branded, real-time). QR generation with `qrcode.react`. QR PNG download.                                                                                                                                                                                                                                  |
| **4** | Stamp Flow        | Customer + Merchant | Customer QR scanner (`html5-qrcode`). Stamp session creation on scan. Supabase Realtime subscription in merchant dashboard. Merchant stamp queue UI (approve/reject + reason). Customer pending screen (Realtime). Stamp success + rejected screens. Framer Motion: stamp pop-in, page transitions, pending spinner. **Test on real iPhone today.**                                                                                                                                        |
| **5** | Wallet & Rewards  | Customer + Merchant | Customer wallet home (TanStack Query, card grid, sort by last stamped). Card detail (stamp grid, progress bar shimmer). Reward unlock detection. OTP send (Sparrow SMS + Twilio). OTP verification. Redemption code generation + display. Merchant redemption code entry + confirmation. Cycle reset. `canvas-confetti` on reward unlock.                                                                                                                                                  |
| **6** | Admin & Analytics | Admin + Merchant    | Super Admin dashboard (platform stats). Merchant approval queue + approve/reject. Merchant list + filter. Customer list + suspend. Manual stamp issue/void + `audit_log` insert. Full audit log table. Merchant analytics page (stamps + redemptions by period).                                                                                                                                                                                                                           |
| **7** | Polish & Launch   | All                 | PWA `manifest.json` + icons (192px, 512px) + `next-pwa` config. Browser push notifications for reward unlock (Android + desktop). All empty states (wallet, queue, analytics). All error states (network fail, expired QR, invalid code). Privacy policy page (GDPR — required for Finnish users). Mobile responsiveness pass on all 3 apps. Full end-to-end test: register merchant → admin approve → customer scan → stamp → reward → OTP → redeem. Production deploy all 3 Vercel apps. |

---

_YORewards — Technical Implementation Document · v1.0 · Confidential_  
_Build clean. Ship fast. Validate everything. · Nepal 🇳🇵 · Finland 🇫🇮_
