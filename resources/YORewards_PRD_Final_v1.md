# YORewards — Product Requirements Document

### Your Loyalty. Rewarded.

> **Version:** 1.0 · **Date:** May 2026 · **Status:** Draft — Ready for Development  
> **Markets:** Nepal 🇳🇵 · Finland 🇫🇮 · **Platform:** PWA — Next.js 14 (App Router)  
> **Build Target:** 1 Week — Cursor Agent · **Stack:** Locked — Do not deviate

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Executive Summary](#2-executive-summary)
3. [Target Markets](#3-target-markets)
4. [Users & Roles](#4-users--roles)
5. [Authentication Design](#5-authentication-design)
6. [Functional Requirements](#6-functional-requirements)
7. [Technology Stack](#7-technology-stack)
8. [App Routes](#8-app-routes)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [MVP Scope](#10-mvp-scope)
11. [Seven-Day Build Plan](#11-seven-day-build-plan)
12. [Known Limitations](#12-known-limitations--mvp)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Brand Identity

YORewards is bold, vibrant, and built for people — not enterprises. The brand must feel energetic, trustworthy, and fun across both Nepali and Finnish markets.

### 1.1 Logo Concept

| Attribute       | Spec                                                                               |
| --------------- | ---------------------------------------------------------------------------------- |
| **Wordmark**    | YORewards — 'YO' in brand purple-to-pink gradient, 'Rewards' in dark neutral       |
| **Logo Mark**   | Rounded square containing bold 'Y' — gradient background purple → pink             |
| **Personality** | Vibrant, youthful, trustworthy. Think Revolut meets a loyalty app for real people. |
| **Typography**  | Inter or Plus Jakarta Sans — bold for headings, regular for body                   |
| **Tone**        | Friendly, direct, energetic. Never corporate. Never boring.                        |

### 1.2 Brand Color Palette

> These colors are non-negotiable. Every UI element must use this palette. Applied via Tailwind CSS custom config.

| Role        | Name           | Hex       | Usage                                             |
| ----------- | -------------- | --------- | ------------------------------------------------- |
| **Primary** | Brand Purple   | `#7C3AED` | Buttons, logo, active states, card accents        |
| **Accent**  | Brand Pink     | `#EC4899` | Gradient partner, highlights, reward badges       |
| **Success** | Emerald Green  | `#10B981` | Stamp confirmed, reward unlocked, approved states |
| **Warm**    | Amber          | `#F59E0B` | Merchant card variant, warnings, min spend alerts |
| **Deep**    | Midnight       | `#1E1B4B` | Headings, dark text on light backgrounds          |
| **Surface** | Lavender White | `#F8F7FF` | App background, card surfaces, input backgrounds  |
| **Error**   | Red            | `#EF4444` | Stamp rejected, errors, destructive actions       |

```ts
// tailwind.config.ts — add to all apps
colors: {
  brand: {
    purple:  '#7C3AED',
    pink:    '#EC4899',
    green:   '#10B981',
    amber:   '#F59E0B',
    deep:    '#1E1B4B',
    surface: '#F8F7FF',
    red:     '#EF4444',
  }
}
```

### 1.3 Merchant Card Design System

Every merchant gets a uniquely colored loyalty card. The card is the product — it must feel like a real, physical card that lives in a wallet. Implemented as a styled React component.

- Card renders with merchant's chosen primary color as a gradient background
- Merchant logo sits top-left; business name and category below it
- Stamp grid: N circles — filled (✓) vs empty (○) — animated on state change
- Progress bar beneath stamp grid with shimmer animation
- Reward description displayed at card bottom
- Cards sorted by most recently stamped

**Sample cards:**

| Merchant                     | Location  | Stamps | Reward                 |
| ---------------------------- | --------- | ------ | ---------------------- |
| Brew & Co. (Café)            | Kathmandu | 7 / 10 | Free regular coffee    |
| Helsinki Hair Studio (Salon) | Helsinki  | 3 / 8  | 50% off next haircut   |
| Momo House (Restaurant)      | Pokhara   | 5 / 5  | 🎉 Free plate of momos |

### 1.4 Animation Specifications

Use **Framer Motion** for all animations. Subtle, fast, purposeful — never gratuitous.

| Animation        | Trigger            | Implementation                                             |
| ---------------- | ------------------ | ---------------------------------------------------------- |
| Stamp pop-in     | Stamp approved     | `scale(0) → scale(1.15) → scale(1)`, 300ms, spring easing  |
| Card float       | Wallet home load   | `translateY(8px) → translateY(0)`, staggered 80ms per card |
| Progress shimmer | Always on          | Gradient sweep across bar, 2s loop                         |
| Page slide-in    | Every route change | `translateY(12px) + opacity 0→1`, 250ms ease-out           |
| QR pulse ring    | Scanner open       | Expanding ring opacity 1→0, 1.5s loop, brand purple        |
| Reward confetti  | Reward unlocked    | `canvas-confetti`, brand colors, 3s burst                  |
| Pending spinner  | Awaiting approval  | Rotating dashed ring with pulsing center dot               |

### 1.5 Responsiveness Rules

- Mobile-first — design for 375px, scale up
- Wallet card grid: 1 col mobile → 2 col tablet (640px+) → 3 col desktop (1024px+)
- Merchant dashboard: single column mobile, sidebar layout desktop
- All tap targets minimum **44×44px** — critical for stamp approval button
- Stamp grid wraps gracefully — max 5 per row on mobile
- Bottom nav bar on mobile for customer app (Wallet / Scan / Profile)
- PWA installable — `manifest.json` with brand icons at 192px and 512px

---

## 2. Executive Summary

YORewards is a digital loyalty stamp wallet platform for small and medium businesses in Nepal and Finland. It replaces paper punch cards with branded digital loyalty cards — one app, all your cards, each uniquely designed per merchant.

Customers collect stamps by visiting businesses and scanning a QR code. Merchants control and approve every stamp via a real-time dashboard. When a stamp target is reached, a reward unlocks — and a lightweight OTP verification fires only at that moment to confirm the customer's phone identity before redemption.

### The Problem

| Customers                            | Merchants                                 |
| ------------------------------------ | ----------------------------------------- |
| Lose or forget paper punch cards     | Zero data on loyal customers              |
| Carry a separate card per business   | Paper cards easily forged or self-stamped |
| No visibility into reward progress   | No digital tool built for these markets   |
| Not all customers have email (Nepal) | No way to measure loyalty program ROI     |

---

## 3. Target Markets

|                 | Nepal 🇳🇵                                                                              | Finland 🇫🇮                                                          |
| --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Opportunity** | High mobile penetration. No local loyalty platform. Young urban Kathmandu population. | Strong café/salon culture. Paper stamps dominant. Founder is local. |
| **Customers**   | Urban youth 18–40. Phone-first, not email-first.                                      | Consumers 18–50. Email-comfortable.                                 |
| **Businesses**  | Cafes, restaurants, salons, bakeries, pharmacies                                      | Independent cafes, gyms, barbershops, studios                       |
| **Currency**    | NPR — Nepalese Rupee                                                                  | EUR — Euro                                                          |
| **Compliance**  | No special regulation for MVP                                                         | GDPR mandatory. Supabase EU West (Frankfurt).                       |
| **SMS OTP**     | Sparrow SMS API                                                                       | Twilio (free trial for MVP)                                         |

---

## 4. Users & Roles

| Role            | Who                                      | Primary Goal                                                             |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| **Customer**    | Anyone visiting a participating business | Collect stamps at all favourite businesses in one place and earn rewards |
| **Merchant**    | Business owner or staff at point of sale | Run a digital loyalty program with zero technical complexity             |
| **Super Admin** | Internal YORewards team (founder)        | Verify merchants, manage platform integrity, monitor usage               |

### Customer

- Identified by phone number (primary identity in Nepal and Finland)
- Holds unlimited loyalty cards across multiple merchants
- No account needed before scanning — frictionless first experience
- Account created automatically on first scan

### Merchant

- Registers a business with name, category, country, and contact details
- **One owner account can run multiple businesses** — each business has its own profile, loyalty card(s), and QR code (e.g. a café _and_ a salon under one login)
- Creates and customises a loyalty card
- Receives a unique QR code per loyalty card
- Approves or rejects every stamp request — no auto-stamping
- **Branches/outlets of the same business** (multi-location) — Day 3: one loyalty card shared across all branches; stamps from any branch count toward the same card; per-branch QR for counter attribution (see Technical Doc §4.7)

### Super Admin

- Approves new merchant registrations
- Can suspend or deactivate merchants or customers
- Read access to all platform data
- Can manually issue or void stamps with audit log
- Views platform-wide analytics

---

## 5. Authentication Design

Authentication is tiered by risk level — minimal friction for customers, verified identity for merchants and admins.

| Role                        | Method                           | Provider                 | Rationale                                                         |
| --------------------------- | -------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| **Customer**                | Phone number — no OTP at login   | Supabase custom auth     | Nepal: high mobile, low email penetration. Stamps are low-stakes. |
| **Customer (reward claim)** | SMS OTP fires at redemption only | Sparrow SMS / Twilio     | Verify phone identity only when real value is at stake            |
| **Merchant**                | Email + password                 | Supabase Auth (built-in) | Same secure pattern as admin; no magic link, no SMS cost          |
| **Super Admin**             | Email + password                 | Supabase Auth (built-in) | Single internal user. Highest access.                             |

### 5.1 Customer Auth Flow

1. Customer opens app or scans merchant QR for the first time
2. App prompts: enter your phone number
3. No OTP sent — phone stored as unique identifier
4. If phone exists → logged in immediately
5. If new → name entry screen → account created → logged in
6. Session persists via JWT in httpOnly cookie

### 5.2 Merchant Auth Flow

1. Merchant opens the dashboard → **sign in** or **sign up** with email + password (no magic link)
2. Sign up creates auth account only (email + password) → redirected to **add business** if no `merchants` row exists
3. Add business collects business name, category, country, contact email, optional phone → `merchants` row created with `status = pending`
4. Super Admin approves registration → merchant signs in → lands on dashboard
5. Active merchant configures loyalty card, stamp rules, and reward offers (Day 3) before customers can scan
6. Session persists via Supabase Auth httpOnly cookie

### 5.3 Reward Redemption OTP Flow

1. Customer reaches stamp target → `customer_cards.reward_status`: `pending_otp` (and `targets_reached` increments)
2. Customer taps 'Claim Reward' → OTP sent to registered phone
3. Customer enters 6-digit OTP → verified → `reward_status`: `unlocked`, redemption row created with code
4. Customer shows code to merchant → merchant confirms → `complete_redemption` RPC resets stamps and starts new cycle
5. OTP expires in 5 minutes — one attempt per claim
6. This is the **only moment SMS cost is incurred** (~1 SMS per 10 visits)

**Reward status state machine** (on `customer_cards`):

| Status        | Meaning                                                          |
| ------------- | ---------------------------------------------------------------- |
| `collecting`  | Earning stamps toward target                                     |
| `pending_otp` | Target reached — customer must verify phone to claim             |
| `unlocked`    | OTP verified — redemption code active, awaiting merchant confirm |

After merchant confirms, status returns to `collecting` with `current_stamps = 0` and `cycle_number` incremented. Completion is tracked on `redemptions.status`, not on `customer_cards`.

### 5.4 Known Limitation — Documented

> ⚠️ Since customers are not OTP-verified at registration, anyone can register with any phone number. Risk is negligible for MVP — stamps have zero monetary value. OTP at redemption prevents the only meaningful fraud vector. Full phone OTP at registration introduced in v2.

---

## 6. Functional Requirements

### 6.1 Merchant — Loyalty Card Configuration

**Card Identity**

- Business logo upload — JPG/PNG, max 2MB, Supabase Storage
- Primary brand color — color picker with preset palette + custom hex
- Card name — max 40 characters
- Card description — shown to customer, max 120 characters
- Live card preview — updates in real time as merchant edits

**Stamp Rules**

- Stamp target — integer from 5 to 50
- Minimum spend per visit to qualify (optional, 0 = no minimum)
  - Displayed on customer card: e.g. 'Min. spend NPR 300 per visit'
  - Merchant confirms spend threshold before tapping Approve (honour system)

**Reward Types — 3 Supported**

| Type               | Merchant Configures  | Customer Sees                      | Example                      |
| ------------------ | -------------------- | ---------------------------------- | ---------------------------- |
| **Free Item**      | Item name            | 'Your 10th coffee is on us!'       | 10 stamps → free coffee      |
| **% Discount**     | Discount % + scope   | 'Get 50% off your next visit!'     | 10 stamps → 50% off          |
| **Fixed Discount** | Amount in NPR or EUR | 'Get NPR 200 off your next visit!' | 10 stamps → NPR 200 / €5 off |

**QR Code**

- Each merchant card gets a unique static QR code
- Downloadable as PNG — printable for counter display
- Each scan generates a one-time session token (expires 5 minutes) — prevents replay attacks

### 6.2 Customer — Wallet & Card Experience

**Wallet Home**

- Visual card grid — each card renders with full merchant branding
- Sorted by most recently stamped
- 'Reward Ready' green banner on cards with `reward_status` `pending_otp` or `unlocked`
- Empty state: prompt to scan first QR

**Card Detail**

- Full branded card render — logo, colors, name, category
- Stamp grid: filled circles (earned) vs empty rings (remaining)
- Progress bar with shimmer animation
- Reward type, description, and minimum spend clearly displayed
- 'Scan to Earn' button → opens QR scanner
- If reward ready (`pending_otp`): 'Claim Reward' CTA → triggers OTP verification
- If OTP verified (`unlocked`): show redemption code to present to merchant

**Stamp Flow**

- Customer scans merchant QR → session token created → pending stamp request logged
- 'Waiting for merchant approval...' screen with animated spinner (Supabase Realtime)
- On approval: 'Stamp Added!' success screen with pop-in animation
- On rejection: rejection screen with merchant's reason
- Pending request auto-expires after 5 minutes

**Reward Redemption**

1. Customer taps 'Claim Reward' (when `pending_otp`)
2. OTP sent to registered phone
3. Customer enters OTP → verified → `reward_status` set to `unlocked`, unique 6-digit alphanumeric code generated (`redemptions` row)
4. Customer shows code to merchant
5. Merchant enters code → validates → confirms via `complete_redemption` RPC
6. Stamp count resets to 0, new cycle starts (`cycle_number` increments), customer notified
7. Code is single-use — cannot be reused

### 6.3 Merchant — Dashboard

**Stamp Approval Queue (Primary View)**

- Live feed of pending stamp requests via Supabase Realtime
- Each request: customer first name, timestamp, card name
- Two actions: Approve ✓ or Reject ✗
- Optional short rejection reason
- Expired requests (5 min) auto-removed
- Browser tab notification badge on new request

**Redemption Management**

- Enter 6-digit code from customer screen
- System validates → shows customer name, reward description, stamp history (approved `stamp_sessions`, excluding `voided`)
- Merchant confirms → `complete_redemption` RPC → logged → customer card resets
- Double redemption prevented: code single-use

**Analytics**

- Total active cards (customers currently collecting)
- Stamps issued: today / this week / this month
- Rewards redeemed: today / this week / this month
- Redemption rate: `redeemed count ÷ sum(targets_reached)` for merchant's `customer_cards` (both stored counters — no guesswork)
- Recent activity feed: last 20 approved/`voided` `stamp_sessions` + redemptions

### 6.4 Super Admin — Dashboard

- Merchant approval queue: review → approve or reject with reason
- Merchant management: list, filter by country/category/status, suspend or reactivate
- Customer management: view all, see active cards, suspend accounts
- Platform analytics: total merchants, customers, stamps, rewards (all-time + by period)
- Manual stamp tool: issue (`issue_stamp_manual` RPC) or void (`void_stamp` RPC on a specific approved `stamp_session`) with `audit_log` entry
- Full audit log: all admin actions timestamped with admin ID

### 6.5 Notifications

| Trigger            | Recipient | Channel               | Message                                   |
| ------------------ | --------- | --------------------- | ----------------------------------------- |
| New stamp request  | Merchant  | In-app real-time      | 'New stamp request from [Name]'           |
| Stamp approved     | Customer  | In-app real-time      | 'Stamp added at [Merchant]!'              |
| Stamp rejected     | Customer  | In-app real-time      | 'Not approved — [reason]'                 |
| Reward unlocked    | Customer  | In-app + browser push | 'Reward earned at [Merchant]!'            |
| OTP for redemption | Customer  | SMS                   | 'Your YORewards code: XXXXXX'             |
| Reward redeemed    | Customer  | In-app                | 'Reward redeemed! New cycle started.'     |
| Merchant approved  | Merchant  | Email                 | 'Your account is live — set up your card' |

---

## 7. Technology Stack

> 🔴 **This stack is locked. Cursor must use these exact technologies. Do not substitute, upgrade, or add libraries without explicit instruction.**

| Layer           | Package                         | Notes                                                     |
| --------------- | ------------------------------- | --------------------------------------------------------- |
| Framework       | `next`                          | App Router. Full-stack.                                   |
| Language        | `typescript`                    | No `any`. Types everywhere.                               |
| UI Components   | `shadcn/ui`                     | Radix UI primitives. Premium look.                        |
| Styling         | `tailwindcss`                   | Brand config applied.                                     |
| Animations      | `framer-motion`                 | All animations. Spring physics.                           |
| Confetti        | `canvas-confetti`               | Reward unlock celebration.                                |
| Server State    | `@tanstack/react-query`         | All data fetching + caching.                              |
| Client State    | `zustand`                       | Auth session, wallet state.                               |
| Database        | `supabase (postgres)`           | Free tier. EU West (Frankfurt). RLS enabled.              |
| Auth            | `@supabase/auth-helpers-nextjs` | Email+password (merchant/admin), custom phone (customer). |
| Real-time       | `supabase realtime`             | Stamp queue only. Not mixed with TanStack.                |
| Storage         | `supabase storage`              | Merchant logos.                                           |
| Image Compress  | `browser-image-compression`     | Compress before upload.                                   |
| QR Generate     | `qrcode.react`                  | Merchant QR as SVG.                                       |
| QR Scan         | `html5-qrcode`                  | Browser camera. Test on real iPhone early.                |
| SMS — Nepal     | `sparrow-sms (REST)`            | OTP at redemption for +977 only.                          |
| SMS — Finland   | `twilio`                        | OTP at redemption for +358 only.                          |
| i18n            | `next-intl`                     | English MVP. All strings in `/messages/en.json`.          |
| PWA             | `next-pwa`                      | Customer app only. Brand manifest.                        |
| Hosting         | `vercel`                        | 3 deployments. Auto-deploy from GitHub.                   |
| Forms           | `react-hook-form + zod`         | All form validation.                                      |
| Icons           | `lucide-react`                  | Ships with shadcn/ui.                                     |
| Package Manager | `pnpm`                          | Required for Turborepo monorepo.                          |

---

## 8. App Routes

### 8.1 Customer PWA — `apps/customer` · `localhost:3000` · `app.yorewards.com`

| Route                        | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `/`                          | Redirect to `/wallet` if logged in, else `/login`  |
| `/login`                     | Phone number entry → account lookup or creation    |
| `/onboarding`                | Name entry — first-time customers only             |
| `/wallet`                    | Wallet home — branded card grid                    |
| `/wallet/[cardId]`           | Card detail — stamp grid, reward info, scan button |
| `/scan`                      | QR scanner — camera view                           |
| `/stamp/pending/[sessionId]` | Real-time approval waiting screen                  |
| `/stamp/success`             | Stamp confirmed screen                             |
| `/stamp/rejected`            | Stamp rejected screen with reason                  |
| `/reward/[cardId]`           | Reward claim — OTP entry → redemption code display |
| `/profile`                   | Phone number, name, logout                         |

### 8.2 Merchant Dashboard — `apps/merchant` · `localhost:3001` · `merchant.yorewards.com`

| Route                    | Description                                   |
| ------------------------ | --------------------------------------------- |
| `/merchant/login`        | Email + password sign in / sign up            |
| `/merchant/register`     | Redirects to sign-up tab on login             |
| `/merchant/add-business` | First business or additional businesses       |
| `/merchant/business`     | Business hub — list, detail, branches (Day 3) |
| `/merchant/dashboard`    | Stamp queue + quick stats (Day 4+)            |
| `/merchant/loyalty-card` | Loyalty card config + live preview + branch QR |
| `/merchant/redeem`       | Redemption code entry + confirmation          |
| `/merchant/analytics`    | Full analytics dashboard                      |
| `/merchant/settings`     | Business profile + account settings           |

### 8.3 Super Admin — `apps/admin` · `localhost:3002` · `admin.yorewards.com`

| Route                   | Description                              |
| ----------------------- | ---------------------------------------- |
| `/admin/login`          | Email + password login                   |
| `/admin/dashboard`      | Platform overview stats                  |
| `/admin/merchants`      | Merchant list — filter, approve, suspend |
| `/admin/merchants/[id]` | Merchant detail + action log             |
| `/admin/customers`      | Customer list — view cards, suspend      |
| `/admin/stamps`         | Manual stamp issue or void tool          |
| `/admin/audit`          | Full audit log of all admin actions      |

---

## 9. Non-Functional Requirements

| Requirement         | Specification                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Performance**     | Stamp approval round-trip < 3 seconds on 4G. App first load < 4 seconds.                                                                                                       |
| **Reliability**     | Core flow degrades gracefully on slow connections. Clear error messages always.                                                                                                |
| **Security**        | One-time QR session tokens, 5-min expiry. Merchant approves every stamp. Redemption codes single-use. JWT auth with httpOnly cookies. Supabase RLS on all tables from day one. |
| **GDPR**            | Supabase EU West. Privacy policy page required at launch. Data deletion option in customer profile.                                                                            |
| **PWA**             | Installable on iOS and Android home screen. Works in mobile browser.                                                                                                           |
| **Accessibility**   | WCAG AA contrast ratios. Min tap target 44×44px. All interactive elements labelled.                                                                                            |
| **i18n Scaffold**   | `next-intl` with `en` locale. All strings in `/messages/en.json`. `ne` and `fi` added in v2.                                                                                   |
| **RLS**             | Supabase Row Level Security enabled from Day 1 — not as an afterthought.                                                                                                       |
| **Version Control** | Commit to GitHub after every day's build.                                                                                                                                      |

---

## 10. MVP Scope

### ✅ In Scope

- Customer PWA: wallet, QR scan, stamp flow, OTP-gated reward redemption
- Merchant dashboard: card setup + live preview, stamp approval queue, redemption, analytics
- Super Admin dashboard: merchant approval, user management, platform stats, audit log
- Phone-number-based customer identity (no OTP at login)
- Multi-business per owner: one merchant login can create and manage several businesses
- Multi-branch per business: outlets under one business share one loyalty card; per-branch QR codes
- Email + password for merchant and admin
- SMS OTP via Sparrow SMS (Nepal) and Twilio (Finland) — at reward redemption only
- All 3 reward types: Free Item, Percentage Discount, Fixed Discount
- Minimum spend rule per stamp (optional, configurable)
- Real-time stamp approval via Supabase Realtime
- Branded loyalty card renderer with merchant colors and logo
- Framer Motion animations as specified in Section 1.4
- `canvas-confetti` reward unlock celebration
- QR code generation (`qrcode.react`) and scanning (`html5-qrcode`)
- PWA install support with brand manifest
- GDPR-compliant hosting (EU West) + privacy policy page
- i18n scaffold (English only, structure ready for `ne` + `fi`)
- Supabase RLS from day one

### ❌ Out of Scope for MVP

- Phone OTP at customer registration (v2)
- Nepali or Finnish language translations (scaffold only)
- WhatsApp bot ordering integration (Phase 2)
- Per-branch analytics dashboards (basic `location_id` attribution in Day 3; charts Day 4+)
- Multiple staff accounts per merchant
- POS or payment gateway integration
- Merchant subscription billing
- Cross-merchant reward marketplace
- Native iOS/Android app (PWA covers mobile in MVP)
- Email marketing or campaign tools
- Referral or social sharing features

---

## 11. Seven-Day Build Plan

> 💡 **Cursor session starter:** _"You are building YORewards. Follow the PRD and Technical Implementation Document exactly. Use only the specified stack. Do not add any libraries not in the stack. Start by reading the folder structure, then build today's task."_

> 📐 **Schema rule:** Day 1 creates all **8 MVP tables** via Supabase migrations — additive only from Day 1 onward. v2 adds columns and new tables; never drop or recreate core tables. See Technical Doc §4.5.

> 🏗️ **Sequencing rule:** Build the **merchant side first** — card config, stamp rules, offers, QR, then stamp queue and redemption. Only after the merchant backend and dashboard are usable does the **customer PWA** get auth, wallet, scanner, and stamp flows. Customers need real cards and an approval queue to test against.

| Day   | Focus                    | Deliverables                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Foundation               | Turborepo init. All 3 Next.js apps. Supabase project (EU West). All **8 tables** with RLS (incl. `otp_tokens`). Forward-compatible columns baked in (`customers.status`, `merchants.rejection_reason`). Migration-first setup in `supabase/migrations/`. Tailwind brand config. shadcn/ui. next-intl scaffold. `@repo/supabase` + `@repo/utils`. All env vars. GitHub + Vercel deployments. |
| **2** | Auth (Admin + Merchant)  | Merchant email+password register/login. Admin email+password. Route guards. Dashboard stub + account status. **Minimal admin merchant approval queue** (list + approve/reject with reason). **No customer auth yet** — see Day 5.                                                                                                                                                           |
| **3** | Merchant Card + Branches | **`merchant_locations` migration** + business hub UI (list, detail, add/edit branches). `/merchant/loyalty-card` — PRD §6.1 loyalty card config (logo, colors, name, description). **Stamp rules** (target 5–50, optional minimum spend). **All 3 reward types**. Live card preview. Logo compression. **Per-branch QR** generation + PNG download. See [`Day3_Checklist.md`](Day3_Checklist.md).   |
| **4** | Merchant Dashboard       | Stamp approval queue (Supabase Realtime). Approve/reject with optional reason. Redemption code entry + `complete_redemption`. Basic merchant analytics. Browser tab badge on new requests. Merchant settings stub.                                                                                                                                                                          |
| **5** | Customer + Stamp Flow    | Customer phone login + onboarding + Zustand authStore. QR scanner. Stamp session creation. Customer pending + success + rejected screens. **Basic wallet home** (read-only card grid via TanStack Query). Framer Motion stamp animations. **Test on real iPhone today.**                                                                                                                    |
| **6** | Rewards + Admin          | Card detail polish. Reward unlock detection. OTP send (Sparrow + Twilio). OTP verification. Redemption code display. Cycle reset. canvas-confetti. Super Admin dashboard (platform overview). Customer management. Merchant analytics page. Audit log UI. Manual stamp tool.                                                                                                                |
| **7** | Polish & Launch          | PWA manifest + icons + next-pwa. Browser push for reward unlock. All empty + error states. Privacy policy page (GDPR). Mobile responsiveness pass. Full end-to-end test all 3 reward types. Production deploy all 3 Vercel apps.                                                                                                                                                            |

---

## 12. Known Limitations — MVP

| Limitation                            | Risk Level                             | Fix in v2                                                      |
| ------------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| Customer phone not verified at signup | 🟡 Low — stamps have no monetary value | OTP at reward redemption prevents theft. Full phone OTP in v2. |
| Minimum spend is honour system        | 🟡 Low — merchant self-polices         | POS integration in v3 can auto-verify spend.                   |
| Single staff account per merchant     | 🟠 Medium — merchant must share login  | Multi-staff with role permissions in v2.                       |
| English only                          | 🟡 Low for MVP validation              | next-intl scaffold ready. Translations in v2.                  |
| Super Admin approval bottleneck       | 🟠 Medium — founder must respond fast  | Auto-approve with verification in v2.                          |

---

## 13. Future Roadmap

| Phase | Timeline  | Features                                                                                                                                                          |
| ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2** | Month 2   | Phone OTP at signup, Nepali + Finnish translations, multi-staff merchant accounts, subscription billing (Stripe + eSewa/MobilePay)                                |
| **3** | Month 3   | WhatsApp Business API bot — browse menu, order, auto-earn stamps                                                                                                  |
| **4** | Month 4–5 | Native React Native / Expo app, push notifications via Expo, **multi-location / outlet support** (shared card + cross-branch stamping, per-branch QR & analytics) |
| **5** | Month 6+  | Cross-merchant reward exchange, eSewa / MobilePay auto-stamp on payment, advanced cohort analytics, SEA expansion                                                 |

---

_YORewards — Your Loyalty. Rewarded. · Nepal 🇳🇵 · Finland 🇫🇮_
