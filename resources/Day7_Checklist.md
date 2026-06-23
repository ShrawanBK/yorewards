# YORewards — Day 7 Checklist (Customer PWA — Auth, Wallet, Scan & Rewards)

> **Goal:** Ship the **customer PWA** (`apps/customer`) so a user can log in by phone, collect stamps via QR scan, wait for merchant approval in real time, unlock rewards via OTP, and show a redemption code to the merchant — completing the **full three-app loop**.  
> **Reference:** PRD §1.4 (animations), §6.2, §8.1, §10 · Technical Doc §3.1, §5, §6, §7.1–7.2  
> **Prerequisite:** Day 6 admin MVP ([`Day6_Checklist.md`](Day6_Checklist.md)) · Day 5 merchant MVP ([`Day5_Checklist.md`](Day5_Checklist.md))  
> **Resequenced:** Original PRD Day 5/6 customer work lands here after merchant + admin are ready.

---

## Implementation status

| Area                                             | Status                                                      |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Phase 0 — Prerequisites + FDA scaffold           | ✅ Done                                                     |
| Phase A — Customer auth + onboarding             | ✅ Done                                                     |
| Phase B — Wallet home + card grid                | ✅ Done                                                     |
| Phase C — QR scan + stamp session                | ✅ Done                                                     |
| Phase D — Pending / success / rejected screens   | ✅ Done                                                     |
| Phase E — Card detail + stamp animations         | ✅ Done                                                     |
| Phase F — Reward unlock + OTP + redemption code  | ✅ Done                                                     |
| Phase G — Profile + shell + bottom nav           | ✅ Done                                                     |
| Phase H — Query layer + error codes + i18n audit | ✅ Done                                                     |
| Phase I — Hardening + E2E + docs                 | ✅ Done (automated + E2E doc; iPhone test before launch)  |
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
8. Merchant confirms code (Day 4 `/merchant/redeem`) → new cycle via `complete_redemption` (overflow stamps carry).
9. **Profile** — phone, name (read-only MVP), logout.
10. **Mobile shell** — bottom nav: Wallet / Scan / Profile (PRD §1.5); 44px tap targets on primary CTAs.

**Suspended customer (Day 6):** scan and stamp creation blocked; show admin `status_reason` when present.

---

## Already in repo (do not rebuild)

| Item                                                                          | Location                                                     | Day 7 task                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| Phone login API (lookup + session)                                            | `apps/customer/app/api/auth/customer/login/route.ts`         | Migrated to server actions + error codes; FDA ✅  |
| Onboarding API                                                                | `apps/customer/app/api/auth/customer/onboarding/route.ts`    | Same ✅                                           |
| `findCustomerByPhone`, `establishCustomerSession`, `getCustomerIdFromSession` | `@repo/supabase/queries/customers`                           | Use as-is; add missing helpers below              |
| `createPendingStampSession`                                                   | `@repo/supabase/queries/stamps`                              | Call from scan action                             |
| `createPendingRedemption`, `getRedemptionByCode`                              | `@repo/supabase/queries/redemptions`                         | Use after OTP verify                              |
| `generateSixDigitOTP`                                                         | `@repo/utils/otp`                                            | Reward SMS only                                   |
| Branch QR URL format                                                          | `buildLoyaltyCardQrUrl` — `/scan?m=&c=&l=`                   | Parse in scanner + deep-link handler              |
| Merchant Realtime queue + approve/reject                                      | Day 4 merchant app                                           | E2E verify                                        |
| Merchant redeem (6-char code)                                                 | Day 4 `/merchant/redeem`                                     | E2E verify                                        |
| Admin customer suspend + `status_reason`                                      | Day 6 admin                                                  | Block scan when `status = suspended`              |
| Session proxy                                                                 | `apps/customer/proxy.ts`                                     | Keep aligned with `@repo/supabase/proxy`          |
| Auth Zustand store                                                            | `apps/customer/src/features/auth/store/`                     | ✅                                                |
| i18n scaffold                                                                 | `apps/customer/messages/en.json`                             | All namespaces ✅                                 |
| `(main)` session guard                                                        | `apps/customer/app/(main)/layout.tsx`                        | `CustomerProtectedShell` ✅                       |

---

## Build order (dependency chain)

```text
0. Phase 0 — FDA scaffold, QueryProvider, deps                    ✅
1. Phase A — Finish auth + onboarding                             ✅
2. Phase B + H1 — getCustomerWalletCards + useCustomerWallet      ✅
3. Phase G1 — CustomerShell + bottom nav                          ✅
4. Phase C + H1 — scan action + html5-qrcode                      ✅
5. Phase D — Realtime pending / success / rejected                ✅
6. Phase E — Card detail + Framer Motion                          ✅
7. Phase F + H1 — OTP send/verify + redemption code + confetti  ✅
8. Phase G2 — Profile + logout                                    ✅
9. Phase H + I — audit, build, docs, E2E guide                    ✅
```

---

## Phase 0 — Prerequisites + FDA scaffold

### 0.1 Prerequisites

- [x] Day 6 admin code-complete (merchant + admin apps runnable locally)
- [x] Supabase migrations applied (incl. `status_reason`, `redemption_cycle_carryover`)
- [x] Demo merchant: active, loyalty card configured, branch QR downloaded (Day 3–5)
- [x] Local ports: customer `3000`, merchant `3001`, admin `3002`

### 0.2 Locked-stack dependencies (`apps/customer/package.json`)

- [x] `@tanstack/react-query` — wallet + card detail server state
- [x] `html5-qrcode` — camera scanner
- [x] `framer-motion` — stamp pop-in, card float, page motion (PRD §1.4)
- [x] `canvas-confetti` — reward unlock celebration
- [x] `lucide-react` — nav + UI icons (via `@repo/ui` patterns)

### 0.3 Environment variables (customer + server actions)

See table in original checklist. **Local dev OTP:** [`apps/customer/README.md`](../apps/customer/README.md).

### 0.4 FDA layout (`apps/customer/src/`)

- [x] `src/features/auth/` — login, onboarding, guards, store
- [x] `src/features/wallet/` — wallet home, card detail hooks/components
- [x] `src/features/scan/` — scanner UI + scan server action
- [x] `src/features/stamp/` — pending/success/rejected/expired views + Realtime hook
- [x] `src/features/reward/` — OTP send/verify + code display
- [x] `src/features/profile/` — profile view + logout action
- [x] `src/widgets/CustomerShell/` — mobile layout + bottom nav
- [x] `src/widgets/CustomerProtectedShell/` — session guard wrapper
- [x] `src/shared/providers/` — `QueryProvider`, `CustomerProviders`
- [x] `src/shared/utils/` — `resolve-action-error`, `action-feedback`
- [x] Thin `app/` routes only — compose from `@/features/*` / `@/widgets/*`
- [x] Legacy `apps/customer/components/`, `stores/` removed

### 0.5 App routes (target tree)

All routes implemented — see PRD routes checklist below.

---

## Phase A — Customer auth + onboarding — ✅

All A1–A3 items complete. See git history / `features/auth/`.

---

## Phase B — Wallet home — ✅

All B1–B2 items complete. See `features/wallet/`.

---

## Phase C — QR scan + stamp session — ✅

### C4. Merchant integration (E2E)

- [x] Pending row appears in merchant Realtime queue with correct customer name + branch
- [x] `location_id` stored on `stamp_sessions` for analytics

---

## Phase D — Stamp result screens — ✅

All D1–D4 items complete. See `features/stamp/`.

---

## Phase E — Card detail — ✅

All items complete. Overflow stamp display aligned with merchant (carryover on redeem).

---

## Phase F — Reward unlock + OTP — ✅

All F1–F4 items complete. `complete_redemption` carries overflow stamps (`20260614120000_redemption_cycle_carryover.sql`).

---

## Phase G — Profile + mobile shell — ✅

All G1–G3 items complete.

---

## Phase H — Shared query layer + cross-cutting quality — ✅

### H1. `@repo/supabase` queries

All listed functions implemented and exported.

### H2. Error codes (`@repo/utils/action-error`)

- [x] Customer-specific codes (auth, scan, OTP, reward)
- [x] Mirrored in `apps/customer/messages/en.json` → `errors.actions.*`

### H3. i18n audit

- [x] User-facing strings via `next-intl`
- [x] Namespaces: `app`, `nav`, `auth`, `onboarding`, `wallet`, `scan`, `stamp`, `card`, `reward`, `profile`, `errors`

### H4. Accessibility + motion

- [x] 44px tap targets on scan, claim, copy-code CTAs (`min-h-11`)
- [x] `prefers-reduced-motion` for CSS animations + view transitions (`globals.css`)
- [x] Focus visible on nav + primary buttons (via `@repo/ui` + shell)

---

## Phase I — Hardening + E2E + sign-off — ✅

### I1. Automated

- [x] `pnpm exec turbo lint --filter=customer`
- [x] `pnpm exec turbo check-types --filter=customer`
- [x] `pnpm exec turbo build --filter=customer`

### I2. Full loop (manual)

Documented step-by-step in [`apps/customer/README.md`](../apps/customer/README.md) § Full loop E2E.

- [x] New customer: phone → onboarding → wallet empty state
- [x] Scan branch QR at active merchant (or open deep link)
- [x] Merchant approves → customer pending → success → wallet shows card + stamp count
- [x] Repeat until stamp target → `pending_otp` banner
- [x] Claim reward → SMS OTP (or dev console) → 6-char code displayed
- [x] Merchant `/merchant/redeem` confirms → new cycle (carryover when over target)
- [x] Admin suspend customer → scan blocked with reason
- [x] Admin audit log shows stamp/redemption-related events where applicable

### I3. Device testing

- [ ] QR scan on **real iPhone** (Safari — PRD requirement) — **defer to Day 8 launch prep**
- [ ] Android Chrome smoke test — **defer to Day 8 launch prep**

### I4. Docs + commit

- [x] Update Technical Doc — Customer MVP ✅ + Implementation Status table
- [x] Mark this checklist implementation table ✅
- [ ] Day 7 git commit (when you ask)

---

## PRD routes checklist (§8.1)

| Route                         | Phase | Notes                            |
| ----------------------------- | ----- | -------------------------------- |
| `/`                           | B     | → `/wallet` or `/login`          |
| `/login`                      | A     | ✅                               |
| `/onboarding`                 | A     | ✅                               |
| `/wallet`                     | B     | ✅                               |
| `/wallet/[cardId]`            | E     | ✅                               |
| `/scan`                       | C     | ✅ + query deep link `?m=&c=&l=` |
| `/stamp/pending/[sessionId]`  | D     | ✅ Realtime                      |
| `/stamp/success/[sessionId]`  | D     | ✅                               |
| `/stamp/rejected/[sessionId]` | D     | ✅                               |
| `/stamp/expired/[sessionId]`  | D     | ✅                               |
| `/reward/[cardId]`            | F     | ✅ OTP + code                    |
| `/profile`                    | G     | ✅                               |

---

## PRD animations checklist (§1.4)

| Animation        | Where          | Phase | Status |
| ---------------- | -------------- | ----- | ------ |
| Stamp pop-in     | Success screen | D     | ✅     |
| Card float       | Wallet load    | B     | ✅     |
| Progress shimmer | Card detail    | E     | ✅     |
| Page slide-in    | Route changes  | H/I   | optional (view transitions nav isolation) |
| QR pulse ring    | Scanner open   | C     | ✅     |
| Reward confetti  | OTP success    | F     | ✅     |
| Pending spinner  | Pending screen | D     | ✅     |

---

## Done when

- [x] All §8.1 customer routes functional (not stubs)
- [x] FDA: thin `app/`, features under `apps/customer/src/features/*`
- [x] Real scan → approve → wallet update works against live merchant app
- [x] OTP → 6-char code → merchant redeem completes cycle (with overflow carryover)
- [x] Suspended customer cannot scan; reason shown when available
- [x] Bottom nav works on 375px viewport
- [x] Realtime used **only** on stamp pending screen
- [x] Lint, types, build pass for `customer`
- [x] Full loop E2E documented in `apps/customer/README.md`
- [x] Ready for Day 8 polish + launch

---

_Previous: [`Day6_Checklist.md`](Day6_Checklist.md) · Next: [`Day8_Checklist.md`](Day8_Checklist.md) (polish & launch)_
