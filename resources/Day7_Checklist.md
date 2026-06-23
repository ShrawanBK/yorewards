# YORewards — Day 7 Checklist (Customer PWA — Auth, Wallet, Scan & Rewards)

> **Goal:** Ship the **customer PWA** (`apps/customer`) so a user can log in by phone, collect stamps via QR scan, wait for merchant approval in real time, unlock rewards via OTP, and show a redemption code to the merchant — completing the **full three-app loop**.  
> **Reference:** PRD §1.4 (animations), §6.2, §8.1, §10 · Technical Doc §3.1, §5, §6, §7.1–7.2  
> **Prerequisite:** Day 6 admin MVP ([`Day6_Checklist.md`](Day6_Checklist.md)) · Day 5 merchant MVP ([`Day5_Checklist.md`](Day5_Checklist.md))  
> **Resequenced:** Original PRD Day 5/6 customer work lands here after merchant + admin are ready.

---

## Implementation status

| Area                                             | Status                                                      |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Phase 0 — Prerequisites + FDA scaffold           | ⏳ Partial (`canvas-confetti` pending; legacy cleanup done) |
| Phase A — Customer auth + onboarding             | ✅ Done                                                     |
| Phase B — Wallet home + card grid                | ✅ Done                                                     |
| Phase C — QR scan + stamp session                | ✅ Done                                                     |
| Phase D — Pending / success / rejected screens   | ✅ Done                                                     |
| Phase E — Card detail + stamp animations         | ⏳ Planned                                                  |
| Phase F — Reward unlock + OTP + redemption code  | ⏳ Planned                                                  |
| Phase G — Profile + shell + bottom nav           | ⏳ Partial (G1 shell + nav ✅; G2 profile ✅)               |
| Phase H — Query layer + error codes + i18n audit | ⏳ Planned                                                  |
| Phase I — Hardening + E2E + docs                 | ⏳ Planned                                                  |
| Day 7 git commit                                 | ⏳ When you ask                                             |

**Target:** Real iPhone test: scan merchant branch QR → merchant approves → stamp on wallet → reach target → OTP → redeem at merchant.

PWA install manifest + production deploy → [`Day8_Checklist.md`](Day8_Checklist.md).

---

## MVP definition — customer PWA “done” (end of Day 7)

A customer can:

1. **Log in** with phone number (no OTP at login — PRD MVP / V2 defers signup OTP).
2. **Onboard** with name (first visit only).
3. Open **wallet** — branded card grid (TanStack Query, PRD responsive grid).
4. **Scan** merchant branch QR → create pending `stamp_sessions` row with `location_id` attribution.
5. See **pending** screen (Supabase Realtime only here) → **success** or **rejected** with reason.
6. View **card detail** — stamp grid, progress, reward info, scan CTA.
7. When target reached: **Claim reward** → SMS OTP (Sparrow NP / Twilio FI) → **6-char redemption code**.
8. Merchant confirms code (Day 4 `/merchant/redeem`) → card resets to new cycle via `complete_redemption`.
9. **Profile** — phone, name (read-only MVP), logout.
10. **Mobile shell** — bottom nav: Wallet / Scan / Profile (PRD §1.5); 44px tap targets on primary CTAs.

**Suspended customer (Day 6):** scan and stamp creation blocked; show admin `status_reason` when present.

---

## Already in repo (do not rebuild)

| Item                                                                          | Location                                                     | Day 7 task                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| Phone login API (lookup + session)                                            | `apps/customer/app/api/auth/customer/login/route.ts`         | Migrate to server actions + error codes; wire FDA |
| Onboarding API                                                                | `apps/customer/app/api/auth/customer/onboarding/route.ts`    | Same                                              |
| `findCustomerByPhone`, `establishCustomerSession`, `getCustomerIdFromSession` | `@repo/supabase/queries/customers`                           | Use as-is; add missing helpers below              |
| `createPendingStampSession`                                                   | `@repo/supabase/queries/stamps`                              | Call from scan action                             |
| `createPendingRedemption`, `getRedemptionByCode`                              | `@repo/supabase/queries/redemptions`                         | Use after OTP verify                              |
| `generateSixDigitOTP`                                                         | `@repo/utils/otp`                                            | Reward SMS only                                   |
| Branch QR URL format                                                          | `buildLoyaltyCardQrUrl` — `/scan?m=&c=&l=`                   | Parse in scanner + deep-link handler              |
| Merchant Realtime queue + approve/reject                                      | Day 4 merchant app                                           | E2E verify                                        |
| Merchant redeem (6-char code)                                                 | Day 4 `/merchant/redeem`                                     | E2E verify                                        |
| Admin customer suspend + `status_reason`                                      | Day 6 admin                                                  | Block scan when `status = suspended`              |
| Session proxy                                                                 | `apps/customer/proxy.ts`                                     | Keep aligned with `@repo/supabase/proxy`          |
| Partial login/onboarding forms                                                | `apps/customer/components/*`                                 | Move to `src/features/auth/`                      |
| Auth Zustand stub                                                             | `apps/customer/stores/auth-store.ts`                         | Move to `features/auth/store/`                    |
| i18n scaffold                                                                 | `apps/customer/messages/en.json` (`auth.*`, partial `nav.*`) | Expand all namespaces                             |
| `(main)` session guard                                                        | `apps/customer/app/(main)/layout.tsx`                        | Extend via `CustomerProtectedShell`               |

**Stub / replace:** `apps/customer/app/(main)/wallet/page.tsx` (“coming Day 4”) → full `WalletHomeView`.

---

## Build order (dependency chain)

```text
0. Phase 0 — FDA scaffold, QueryProvider, deps (partial)                 ⏳
      ↓
1. Phase A — Finish auth + onboarding (error codes, redirects)               ✅
      ↓
2. Phase B + H1 — getCustomerWalletCards + useCustomerWallet                ✅
      ↓
3. Phase G1 — CustomerShell + bottom nav (Wallet / Scan / Profile)           ✅
      ↓
4. Phase C + H1 — getOrCreateCustomerCard + scan action + html5-qrcode         ✅
      ↓
5. Phase D — Realtime pending / success / rejected                           ✅
      ↓
6. Phase E — Card detail + Framer Motion                                     ⏳
      ↓
7. Phase F + H1 — OTP send/verify + redemption code + confetti               ⏳
      ↓
8. Phase G2 — Profile + logout                                               ⏳
      ↓
9. Phase I — lint / types / build / manual E2E / Technical Doc               ⏳
```

---

## Phase 0 — Prerequisites + FDA scaffold

### 0.1 Prerequisites

- [ ] Day 6 admin code-complete (merchant + admin apps runnable locally)
- [ ] Supabase migrations applied (`pnpm exec supabase db push` if needed — incl. Day 6 `status_reason`)
- [ ] Demo merchant: active, loyalty card configured, branch QR downloaded (Day 3–5)
- [ ] Local ports: customer `3000`, merchant `3001`, admin `3002`

### 0.2 Locked-stack dependencies (`apps/customer/package.json`)

Add only PRD / Technical Doc §2 packages (no substitutes):

- [x] `@tanstack/react-query` — wallet + card detail server state
- [x] `html5-qrcode` — camera scanner
- [x] `framer-motion` — stamp pop-in, card float, page motion (PRD §1.4)
- [ ] `canvas-confetti` — reward unlock celebration
- [x] `lucide-react` — nav + UI icons (via `@repo/ui` patterns)

### 0.3 Environment variables (customer + server actions)

| Variable                                                           | Purpose                                          |
| ------------------------------------------------------------------ | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`                                         | Supabase client                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                    | Supabase client                                  |
| `SUPABASE_SERVICE_ROLE_KEY`                                        | Phone lookup, OTP, scan validation (server only) |
| `NEXT_PUBLIC_CUSTOMER_APP_URL`                                     | QR deep links (`http://localhost:3000` local)    |
| `SPARROW_SMS_TOKEN`                                                | Nepal (+977) redemption OTP                      |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | Finland (+358) redemption OTP                    |

Dev fallback: document console-log OTP when SMS env missing (dev only — never in production).

### 0.4 FDA layout (`apps/customer/src/` — match merchant/admin)

- [x] `src/features/auth/` — login, onboarding, guards, store
- [x] `src/features/wallet/` — wallet home, card detail hooks/components (detail UI → Phase E)
- [x] `src/features/scan/` — scanner UI + scan server action
- [x] `src/features/stamp/` — pending/success/rejected/expired views + Realtime hook
- [ ] `src/features/reward/` — OTP send/verify + code display
- [x] `src/features/profile/` — profile view + logout action
- [x] `src/widgets/CustomerShell/` — mobile layout + bottom nav
- [x] `src/widgets/CustomerProtectedShell/` — session guard wrapper
- [x] `src/shared/providers/` — `QueryProvider`, `CustomerProviders`
- [x] `src/shared/utils/` — `resolve-action-error`, `action-feedback`
- [ ] Thin `app/` routes only — compose from `@/features/*` / `@/widgets/*`
- [ ] Remove or migrate legacy `apps/customer/components/`, `stores/` at repo root of app

### 0.5 App routes (target tree — Technical Doc §3.1)

```
apps/customer/app/
├── (auth)/
│   ├── login/page.tsx
│   └── onboarding/page.tsx
├── (main)/
│   ├── layout.tsx              → CustomerProtectedShell
│   ├── wallet/page.tsx
│   ├── wallet/[cardId]/page.tsx
│   ├── scan/page.tsx
│   ├── stamp/pending/[sessionId]/page.tsx
│   ├── stamp/success/[sessionId]/page.tsx
│   ├── stamp/rejected/[sessionId]/page.tsx
│   ├── stamp/expired/[sessionId]/page.tsx
│   ├── reward/[cardId]/page.tsx              → OTP stub (Phase F)
│   └── profile/page.tsx
├── layout.tsx
└── page.tsx                    → /wallet if session else /login
```

---

## Phase A — Customer auth + onboarding — PRD §8.1

### A1. Auth flow

- [x] Phone entry `/login` — `react-hook-form` + zod, i18n (`auth.*`)
- [x] Returning user: `findCustomerByPhone` → `establishCustomerSession` → redirect `/wallet`
- [x] New user: return `isNew` → redirect `/onboarding?phone=…` (no session until name saved)
- [x] Session via httpOnly cookies (`@repo/supabase` server client + `proxy.ts`)
- [x] `features/auth/store/authStore.ts` — client UI state only (`'use client'`)
- [x] Route guard: unauthenticated → `/login`; authed on `/login` → `/wallet`

### A2. Onboarding

- [x] `/onboarding` — name entry; create `customers` row + `ensureCustomerAuthUser` + session
- [x] Validate phone query param; missing → back to `/login`
- [x] Redirect: new user completes onboarding → `/wallet`
- [x] i18n: `onboarding.*`

### A3. Server mutations

- [x] Replace raw JSON error strings with server actions + `fail("CODE")` pattern
- [x] Add customer auth codes to `@repo/utils/action-error` + `apps/customer/messages/en.json` → `errors.actions.*`
- [x] No hardcoded English in components (incl. zod messages inside components with `useTranslations`)

---

## Phase B — Wallet home — PRD §6.2, §8.1

### B1. Data (`@repo/supabase` — Phase H1)

- [x] `getCustomerWalletCards(customerId)` — join `merchants`, `loyalty_cards`, stamp progress, `reward_status`, branding fields
- [x] TanStack Query: `useCustomerWallet(customerId)` — key `['wallet', customerId]`, stale 30s (Technical Doc §5.2)
- [x] `invalidateCustomerWallet` helper (for stamp success / redemption — wire in Phases D & F)

### B2. UI

- [x] `features/wallet/components/WalletHomeView.tsx` — branded card grid
- [x] Responsive grid: 1 col mobile → 2 col `@640px` → 3 col `@1024px` (PRD §1.5)
- [x] Card float animation on load — stagger 80ms (PRD §1.4)
- [x] “Reward ready” banner when `reward_status` is `pending_otp` or `unlocked`
- [x] Empty state — “Scan a QR at a participating business” + CTA to `/scan`
- [x] Route: `/wallet`; `/` redirects per PRD §8.1
- [x] i18n: `wallet.*`

---

## Phase C — QR scan + stamp session — PRD §6.2

### C1. Scanner

- [x] `/scan` — `html5-qrcode` camera view + QR pulse ring animation (PRD §1.4)
- [x] **Deep link:** handle `/scan?m={merchantId}&c={loyaltyCardId}&l={locationId}` from printed branch QR (merchant `buildLoyaltyCardQrUrl`)
- [x] **Camera scan:** parse same query params from scanned URL (`parseLoyaltyQrText`)
- [x] Camera permission denied → i18n error + **Allow camera** (user-gesture re-request) + link back to wallet
- [x] Invalid / malformed QR → i18n error (`scan.invalidQr` / `SCAN_INVALID_QR`) — not generic 500

### C2. Validation (server action)

- [x] Customer session required (`getCustomerIdFromSession`)
- [x] Customer `status = active` (not suspended); if suspended → `CUSTOMER_SUSPENDED_REASON` with `status_reason` when present (Day 6)
- [x] Merchant `status = active`
- [x] Loyalty card exists, `is_active = true`
- [x] Location belongs to merchant and `is_active = true` (when `l` present)
- [x] No duplicate pending session for same card — reuse existing pending session within 5 min window
- [x] Block scan when `reward_status = pending_otp` or `unlocked` — direct to `/reward/[cardId]` instead

### C3. Session creation

- [x] `getOrCreateCustomerCard(customerId, loyaltyCardId, merchantId)` — `@repo/supabase/queries/customer-wallet`
- [x] `createPendingStampSession({ merchantId, customerCardId, locationId })` — `@repo/supabase/queries/stamps`
- [x] Min spend: display-only on card UI (merchant rule text — no server block MVP)
- [x] Session expiry ~5 min (existing `isWithinPendingWindow` on merchant side)
- [x] Redirect → `/stamp/pending/[sessionId]`
- [x] i18n: `scan.*`

### C4. Merchant integration (E2E)

- [ ] Pending row appears in merchant Realtime queue with correct customer name + branch _(verify in Phase I2)_
- [x] `location_id` stored on `stamp_sessions` for analytics (via `createPendingStampSession`)

**Implementation:** `features/scan/` (`ScanView`, `QrScanner`, `submitStampScanAction`, `parseLoyaltyQr*`) · route `app/(main)/scan/page.tsx`

---

## Phase D — Stamp result screens — PRD §8.1

### D1. Pending (Realtime — only Realtime subscription in customer app)

- [x] `/stamp/pending/[sessionId]` — subscribe to `stamp_sessions` UPDATE for `id=eq.{sessionId}`
- [x] Pending spinner — rotating dashed ring + pulsing center dot (PRD §1.4)
- [x] On `approved` → `/stamp/success/[sessionId]`
- [x] On `rejected` → `/stamp/rejected/[sessionId]` with `rejection_reason` from server
- [x] On `expired` or timeout → `/stamp/expired/[sessionId]` + CTA scan again
- [x] Unsubscribe on unmount; no Realtime on wallet/list views

### D2. Success

- [x] `/stamp/success/[sessionId]` — “Stamp added!” + stamp pop-in (`scale 0 → 1.15 → 1`, 300ms spring)
- [x] Show progress toward reward (current / target)
- [x] If `reward_status` now `pending_otp` → prominent “Claim reward” CTA
- [x] CTA: wallet or scan again

### D3. Rejected

- [x] `/stamp/rejected/[sessionId]` — merchant reason when present
- [x] CTA back to wallet or `/scan`

### D4. i18n

- [x] `stamp.*` namespace in `apps/customer/messages/en.json` (incl. `stamp.expired`)

**Implementation:** `features/stamp/` · `getStampSuccessContextForCustomer` · routes under `app/(main)/stamp/*`

---

## Phase E — Card detail — PRD §8.1

- [ ] `/wallet/[cardId]` — stamp grid, reward description, min spend text, merchant branding
- [ ] TanStack Query: `useCustomerCard(cardId)` — key `['card', cardId]`
- [ ] Framer Motion stamp fill / progress shimmer (PRD §1.4)
- [ ] Reuse shared visuals from `@repo/ui` / merchant `LoyaltyCardPreviewV2` where sensible (no cross-app feature imports)
- [ ] Scan CTA → `/scan` (or deep link if merchant known)
- [ ] Claim reward CTA when `pending_otp` → `/reward/[cardId]`
- [ ] Show existing redemption code when `reward_status = unlocked` and pending redemption exists
- [ ] i18n: `card.*`

---

## Phase F — Reward unlock + OTP — PRD §6.2, §6.5

### F1. Unlock detection

- [ ] Stamp approval at target sets `reward_status = pending_otp` (already in `approve_stamp_session` / `increment_stamps`)
- [ ] Wallet banner + card detail “Claim reward” when `pending_otp`

### F2. OTP send (`@repo/supabase` or `features/reward/api`)

- [ ] `/reward/[cardId]` — confirm phone (read-only display), send OTP button
- [ ] Generate OTP via `generateSixDigitOTP`; hash with bcrypt; insert `otp_tokens` (`purpose: redemption`, 5 min expiry)
- [ ] Route by `customers.country_code`: Sparrow (+977) / Twilio (+358) — server-only (Technical Doc §6.2)
- [ ] Rate limit: max sends per phone/card window (basic MVP guard)

### F3. OTP verify + redemption

- [ ] Verify hash → on success:
  - [ ] Set `customer_cards.reward_status = unlocked`
  - [ ] Generate unique **6-character** alphanumeric redemption code (match merchant `REDEMPTION_CODE_INVALID` length check)
  - [ ] `createPendingRedemption({ merchantId, customerCardId, redemptionCode, cycleNumber, locationId })`
  - [ ] Delete or invalidate spent `otp_tokens` row
- [ ] Display code large, monospace, copy-to-clipboard
- [ ] `canvas-confetti` burst on success (brand colors, ~3s)
- [ ] Instructions: show code to merchant at counter
- [ ] Merchant redeem (Day 4) → `complete_redemption` RPC resets card

### F4. i18n + errors

- [ ] `reward.*` strings
- [ ] Error codes: `OTP_SEND_FAILED`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED`, `REWARD_NOT_READY`, `REDEMPTION_CREATE_FAILED` → `errors.actions.*`

---

## Phase G — Profile + mobile shell

### G1. CustomerShell + bottom nav (PRD §1.5)

- [x] `widgets/CustomerShell` — main content + fixed bottom nav on mobile
- [x] Nav items: **Wallet** (`/wallet`), **Scan** (`/scan`), **Profile** (`/profile`)
- [x] Active route indicator; 44×44px min tap targets
- [x] `viewTransitionName` isolation on bottom nav (`customer-bottom-nav`)
- [x] i18n: `nav.wallet`, `nav.scan`, `nav.profile`, `nav.aria`

### G2. Profile + logout

- [x] `/profile` — phone, name (read-only MVP), logout button
- [x] Logout: clear Supabase session + redirect `/login`
- [x] i18n: `profile.*`

### G3. Route protection

- [x] `(main)/layout.tsx` — `getCustomerIdFromSession`; redirect `/login` if missing
- [x] `(auth)/*` — redirect `/wallet` if already authed
- [x] `proxy.ts` matcher unchanged; session refresh via `@repo/supabase/proxy`

---

## Phase H — Shared query layer + cross-cutting quality

### H1. `@repo/supabase` queries to add or complete

| Function                                                         | Used by              |
| ---------------------------------------------------------------- | -------------------- |
| `getCustomerWalletCards(customerId)`                             | Wallet home          |
| `getCustomerCardById(customerId, cardId)`                        | Card detail          |
| `getOrCreateCustomerCard(customerId, loyaltyCardId, merchantId)` | Scan                 |
| `getStampSessionForCustomer(sessionId, customerId)`              | Pending/rejected/expired guard |
| `getStampSuccessContextForCustomer(sessionId, customerId)`       | Success screen                 |
| `findActivePendingSessionForCard(customerCardId)`                | Scan duplicate guard |
| `sendRedemptionOtp(customerId, cardId)`                          | Reward flow (server) |
| `verifyRedemptionOtp(customerId, cardId, otp)`                   | Reward flow (server) |

Export from `@repo/supabase/queries/*`; keep SMS/Twilio calls in server actions (not client).

### H2. Error codes (`@repo/utils/action-error`)

- [ ] Customer-specific codes listed in phases A, C, F
- [ ] Mirror messages in `apps/customer/messages/en.json`

### H3. i18n audit

- [ ] Every user-facing string via `next-intl` (labels, placeholders, buttons, headings, validation, `aria-label`s)
- [ ] Namespaces: `app`, `nav`, `auth`, `onboarding`, `wallet`, `scan`, `stamp`, `card`, `reward`, `profile`, `errors`

### H4. Accessibility + motion

- [ ] 44px tap targets on scan, claim, copy-code CTAs
- [ ] `@media (prefers-reduced-motion: reduce)` for Framer / view transitions (project skill)
- [ ] Focus visible on nav + primary buttons

---

## Phase I — Hardening + E2E + sign-off

### I1. Automated

- [ ] `pnpm exec turbo lint --filter=customer`
- [ ] `pnpm exec turbo check-types --filter=customer`
- [ ] `pnpm exec turbo build --filter=customer`

### I2. Full loop (manual)

- [ ] New customer: phone → onboarding → wallet empty state
- [ ] Scan branch QR at active merchant (or open deep link)
- [ ] Merchant approves → customer pending → success → wallet shows card + stamp count
- [ ] Repeat until stamp target → `pending_otp` banner
- [ ] Claim reward → SMS OTP (or dev console) → 6-char code displayed
- [ ] Merchant `/merchant/redeem` confirms → customer card resets (`collecting`, stamps 0, cycle +1)
- [ ] Admin suspend customer → scan blocked with reason
- [ ] Admin audit log shows stamp/redemption-related events where applicable

### I3. Device testing

- [ ] QR scan on **real iPhone** (Safari — PRD requirement; test early in Phase C)
- [ ] Android Chrome smoke test

### I4. Docs + commit

- [ ] Update Technical Doc — Customer MVP ✅ + Implementation Status table
- [ ] Mark this checklist implementation table ✅
- [ ] Day 7 git commit (when you ask)

---

## PRD routes checklist (§8.1)

| Route                        | Phase | Notes                            |
| ---------------------------- | ----- | -------------------------------- |
| `/`                          | B     | → `/wallet` or `/login`          |
| `/login`                     | A     |                                  |
| `/onboarding`                | A     |                                  |
| `/wallet`                    | B     |                                  |
| `/wallet/[cardId]`           | E     |                                  |
| `/scan`                      | C     | ✅ + query deep link `?m=&c=&l=` |
| `/stamp/pending/[sessionId]` | D     | ✅ Realtime                      |
| `/stamp/success/[sessionId]` | D     | ✅                               |
| `/stamp/rejected/[sessionId]` | D    | ✅                               |
| `/stamp/expired/[sessionId]` | D     | ✅                               |
| `/reward/[cardId]`           | F     | OTP + code                       |
| `/profile`                   | G     |                                  |

---

## PRD animations checklist (§1.4)

| Animation        | Where          | Phase                           |
| ---------------- | -------------- | ------------------------------- | --- |
| Stamp pop-in     | Success screen | D                               | ✅  |
| Card float       | Wallet load    | B                               |     |
| Progress shimmer | Card detail    | E                               |     |
| Page slide-in    | Route changes  | H/I optional (view transitions) |     |
| QR pulse ring    | Scanner open   | C                               | ✅  |
| Reward confetti  | OTP success    | F                               |     |
| Pending spinner  | Pending screen | D                               | ✅  |

---

## Agent skills (Day 7)

| Skill                           | Purpose                               |
| ------------------------------- | ------------------------------------- |
| `supabase`                      | RLS, Realtime, RPCs, customer session |
| `vercel-react-view-transitions` | Optional stamp/screen transitions     |
| `server-action-errors.mdc`      | Customer mutations                    |
| `vercel-react-best-practices`   | Query boundaries, client/server split |
| PRD §1.4 animations             | Pending spinner, success pop-in       |

---

## Out of scope (Day 8+ / V2)

| Item                                            | When                                          |
| ----------------------------------------------- | --------------------------------------------- |
| PWA manifest + `next-pwa`                       | [`Day8_Checklist.md`](Day8_Checklist.md)      |
| Privacy policy `/privacy`                       | Day 8                                         |
| Production Vercel deploy                        | Day 8                                         |
| Empty/error polish (offline, invalid QR copy)   | Day 8 Phase C                                 |
| Browser push notifications                      | Day 8 stub or V2                              |
| Phone OTP at login                              | V2 (PRD §12)                                  |
| Profile data deletion flow                      | Day 8 GDPR stub                               |
| `@repo/ui` shared stamp-grid package extraction | Optional — can live in customer feature first |

---

## Done when

- [ ] All §8.1 customer routes functional (not stubs)
- [ ] FDA: thin `app/`, features under `apps/customer/src/features/*`
- [ ] Real scan → approve → wallet update works against live merchant app
- [ ] OTP → 6-char code → merchant redeem completes cycle
- [ ] Suspended customer cannot scan; reason shown when available
- [ ] Bottom nav works on 375px viewport
- [ ] Realtime used **only** on stamp pending screen
- [ ] Lint, types, build pass for `customer`
- [ ] Real device QR test documented in Phase I2
- [ ] Ready for Day 8 polish + launch

---

_Previous: [`Day6_Checklist.md`](Day6_Checklist.md) · Next: [`Day8_Checklist.md`](Day8_Checklist.md) (polish & launch)_
