# YORewards — Day 7 Checklist (Customer PWA — Auth, Wallet, Scan & Rewards)

> **Goal:** Ship the **customer PWA** (`apps/customer`) so a user can log in by phone, collect stamps via QR scan, wait for merchant approval in real time, unlock rewards via OTP, and show a redemption code to the merchant — completing the **full three-app loop**.  
> **Reference:** PRD §6.2, §8.1, §10 · Technical Doc §3.2, §4, §5, §7.2  
> **Prerequisite:** Day 6 admin MVP ([`Day6_Checklist.md`](Day6_Checklist.md)) · Day 5 merchant MVP ([`Day5_Checklist.md`](Day5_Checklist.md))  
> **Resequenced:** Original PRD Day 5/6 customer work lands here after merchant + admin are ready.

---

## Implementation status

| Area                                              | Status     |
| ------------------------------------------------- | ---------- |
| Phase A — Customer auth + onboarding              | ⏳ Planned |
| Phase B — Wallet home + card grid                 | ⏳ Planned |
| Phase C — QR scan + stamp session                 | ⏳ Planned |
| Phase D — Pending / success / rejected screens    | ⏳ Planned |
| Phase E — Card detail + stamp animations          | ⏳ Planned |
| Phase F — Reward unlock + OTP + redemption code   | ⏳ Planned |
| Phase G — Profile + Realtime subscriptions        | ⏳ Planned |
| Phase H — Customer FDA + i18n + polish            | ⏳ Planned |
| Phase I — E2E + sign-off                          | ⏳ Planned |
| Day 7 git commit                                  | ⏳ When you ask |

**Scaffold note:** `apps/customer` has partial auth/onboarding from early work — audit against this checklist and migrate to FDA.

**Target:** Real iPhone test: scan merchant branch QR → merchant approves → stamp on wallet → reach target → OTP → redeem at merchant.

---

## MVP definition — customer PWA “done” (end of Day 7)

A customer can:

1. **Log in** with phone number (no OTP at login — PRD MVP).
2. **Onboard** with name (first visit only).
3. Open **wallet** — grid of loyalty cards (TanStack Query).
4. **Scan** merchant branch QR → create pending `stamp_sessions` row.
5. See **pending** screen (Realtime) → **success** or **rejected** with reason.
6. View **card detail** — stamp grid, progress, reward info.
7. When target reached: **Claim reward** → SMS OTP (Sparrow NP / Twilio FI) → **6-char redemption code**.
8. Merchant confirms code (Day 4 redeem UI) → card resets to new cycle.
9. **Profile** — phone, name, logout.

PWA install manifest + production deploy → [`Day8_Checklist.md`](Day8_Checklist.md).

---

## Build order (dependency chain)

```text
1. Customer auth (phone lookup/create) + onboarding + auth store           ⏳
      ↓
2. Wallet home — customer_cards query + card grid UI                     ⏳
      ↓
3. QR scanner (html5-qrcode) → createPendingStampSession                 ⏳
      ↓
4. Realtime pending / success / rejected routes                          ⏳
      ↓
5. Card detail page + Framer Motion stamp animations                     ⏳
      ↓
6. Reward unlock detection → OTP send/verify → redemption row + code     ⏳
      ↓
7. Profile + route guards + i18n audit                                   ⏳
      ↓
8. Full E2E with merchant queue + admin (optional manual stamp)          ⏳
```

---

## Phase A — Customer auth + onboarding — PRD §8.1

### A1. Auth flow

- [ ] Phone entry `/login` — react-hook-form + zod, i18n
- [ ] `findCustomerByPhone` / create customer row + Supabase auth user (`ensureCustomerAuthUser`)
- [ ] Session via httpOnly cookies (`@repo/supabase` server client)
- [ ] `features/auth/` — login form, `authStore` (Zustand, client only)
- [ ] Route guard: unauthenticated → `/login`

### A2. Onboarding

- [ ] `/onboarding` — name entry for new customers
- [ ] Redirect logic: new user → onboarding; returning → `/wallet`
- [ ] i18n: `auth.*`, `onboarding.*`

### A3. API routes / actions

- [ ] Server actions or route handlers with error codes + `errors.actions.*`
- [ ] No hardcoded English error strings

---

## Phase B — Wallet home — PRD §6.2, §8.1

### B1. Data

- [ ] `@repo/supabase` query: `getCustomerWalletCards(customerId)` — join merchants, loyalty_cards, stamp progress, `reward_status`
- [ ] TanStack Query hook: `useCustomerWallet` with stable query keys

### B2. UI

- [ ] `features/wallet/components/WalletHomeView.tsx` — branded card grid
- [ ] “Reward ready” banner when `reward_status` is `pending_otp` or `unlocked`
- [ ] Empty state — “Scan a QR at a participating business”
- [ ] Route: `/wallet` (and `/` redirect)
- [ ] i18n: `wallet.*`

---

## Phase C — QR scan + stamp session — PRD §6.2

### C1. Scanner

- [ ] `/scan` — `html5-qrcode` camera view
- [ ] Parse branch QR payload (location id / session token format per Technical Doc)
- [ ] Validate: merchant active, loyalty card configured, customer not suspended

### C2. Session creation

- [ ] Server action: `createPendingStampSession(locationId, customerId)`
- [ ] Enforce: min spend rules display-only; session expiry ~5 min
- [ ] Redirect → `/stamp/pending/[sessionId]`
- [ ] i18n: `scan.*`

### C3. Merchant integration

- [ ] Verify pending row appears in merchant Realtime queue (Day 4)
- [ ] `location_id` attribution from scanned branch QR

---

## Phase D — Stamp result screens — PRD §8.1

### D1. Pending (Realtime)

- [ ] `/stamp/pending/[sessionId]` — Supabase Realtime subscription on `stamp_sessions`
- [ ] Animated spinner (PRD pending spinner spec)
- [ ] On `approved` → navigate to success; on `rejected` → rejected screen with reason
- [ ] Timeout / expired handling

### D2. Success

- [ ] `/stamp/success` — “Stamp added!” + pop-in animation (Framer Motion)
- [ ] Show updated progress toward reward

### D3. Rejected

- [ ] `/stamp/rejected` — reason from merchant (optional)
- [ ] CTA back to wallet or scan again

### D4. i18n

- [ ] `stampQueue.*` or `stamp.*` namespace in `apps/customer/messages/en.json`

---

## Phase E — Card detail — PRD §8.1

- [ ] `/wallet/[cardId]` — stamp grid, reward text, min spend, scan CTA
- [ ] Framer Motion stamp fill animations
- [ ] Shared visual language with merchant `LoyaltyCardPreviewV2` where sensible
- [ ] i18n: `card.*`

---

## Phase F — Reward unlock + OTP — PRD §6.2, §6.5

### F1. Unlock detection

- [ ] When stamps reach target → `customer_cards.reward_status = pending_otp`
- [ ] “Claim reward” CTA on card detail + wallet banner

### F2. OTP send

- [ ] `/reward/[cardId]` — phone confirm + send OTP
- [ ] Sparrow SMS (+977) / Twilio (+358) — env vars, server-only
- [ ] Store hashed OTP in `otp_tokens` with expiry

### F3. OTP verify + redemption

- [ ] Verify OTP → create `redemptions` row with 6-char code
- [ ] Display code to customer (large, copy-friendly)
- [ ] `canvas-confetti` on success (locked stack)
- [ ] Merchant redeem flow (Day 4) completes cycle

### F4. i18n

- [ ] `reward.*`, OTP error messages in `errors.actions.*`

---

## Phase G — Profile + Realtime hygiene

- [ ] `/profile` — phone, name (read-only MVP), logout
- [ ] Realtime **only** on stamp pending screen (not wallet — TanStack elsewhere)
- [ ] `proxy.ts` / middleware route protection aligned with merchant app patterns

---

## Phase H — Customer FDA + quality

- [ ] Migrate pages to `apps/customer/src/features/*` (if not already)
- [ ] Thin `app/` routes only
- [ ] All user-facing strings via `next-intl`
- [ ] 44px tap targets on scan / claim CTAs
- [ ] `pnpm exec turbo lint check-types build --filter=customer`

---

## Phase I — E2E + sign-off

### I1. Full loop (manual)

- [ ] Customer signs up → scans QR at active merchant branch
- [ ] Merchant approves → customer sees success → wallet updates
- [ ] Repeat until stamp target → claim reward → OTP → code
- [ ] Merchant redeems → customer card resets
- [ ] Admin audit log shows relevant events (Day 6)

### I2. Device testing

- [ ] Test QR scan on **real iPhone** (PRD requirement)
- [ ] Test on Android Chrome

### I3. Docs

- [ ] Technical Doc — Customer MVP ✅
- [ ] Day 7 git commit (when you ask)

---

## PRD routes checklist (§8.1)

| Route                        | Phase   |
| ---------------------------- | ------- |
| `/`                          | B       |
| `/login`                     | A       |
| `/onboarding`                | A       |
| `/wallet`                    | B       |
| `/wallet/[cardId]`           | E       |
| `/scan`                      | C       |
| `/stamp/pending/[sessionId]` | D       |
| `/stamp/success`             | D       |
| `/stamp/rejected`            | D       |
| `/reward/[cardId]`           | F       |
| `/profile`                   | G       |

---

## Agent skills (Day 7)

| Skill                              | Purpose                    |
| ---------------------------------- | -------------------------- |
| `supabase`                         | RLS, Realtime, RPCs        |
| `vercel-react-view-transitions`    | Stamp/screen transitions   |
| `server-action-errors.mdc`         | Customer mutations         |
| PRD §6.2 animations               | Pending spinner, success   |

---

## Out of scope (Day 8+)

| Item                    | When                          |
| ----------------------- | ----------------------------- |
| PWA manifest + next-pwa | [`Day8_Checklist.md`](Day8_Checklist.md) |
| Privacy policy page     | Day 8                         |
| Production Vercel deploy | Day 8                        |
| Browser push notifications | Day 8 stub or V2          |
| Phone OTP at login      | V2 (PRD §12)                  |

---

## Done when

- [ ] All §8.1 customer routes functional (not stubs)
- [ ] Real scan → approve → wallet update works against live merchant app
- [ ] OTP → redemption code → merchant redeem completes cycle
- [ ] Lint, types, build pass for `customer`
- [ ] Real device QR test documented
- [ ] Ready for Day 8 polish + launch

---

_Previous: [`Day6_Checklist.md`](Day6_Checklist.md) · Next: [`Day8_Checklist.md`](Day8_Checklist.md) (polish & launch)_
