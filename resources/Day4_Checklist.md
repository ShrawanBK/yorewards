# YORewards — Day 4 Checklist (Merchant MVP — Stamp Queue, Redemption & Analytics)

> **Goal:** Finish the **merchant dashboard** so an active business can **approve/reject stamp requests in real time**, **confirm reward redemptions**, and see **basic analytics** — merchant-side MVP complete before customer PWA work.  
> **Reference:** PRD §6.3, §8.2, §10, §11 · Technical Doc §4.6, §5.2–5.3, §7.3–7.4  
> **Prerequisite:** Day 3 complete — auth, business hub, branches, loyalty card config, per-branch QR PNG

---

## Implementation status (June 2026)

| Area                                                                                        | Status                                        |
| ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Phase A — Stamp/redemption/analytics queries + actions                                      | ✅ Done                                       |
| Phase B — Realtime stamp queue (dashboard)                                                  | ✅ Done                                       |
| Phase C — Redemption flow (`/merchant/redeem`)                                              | ✅ Done                                       |
| Phase D — Analytics (`/merchant/analytics`)                                                 | ✅ Done                                       |
| Phase E — Nav, tab badge, i18n                                                              | ✅ Done                                       |
| Phase F — Dev demo seed + SQL script                                                        | ✅ Done (polished)                            |
| Phase G — Automated verify                                                                  | ✅ Done                                       |
| Phase H — Customer list per business + branch filter                                        | ✅ Done                                       |
| Phase G — Manual E2E + RLS smoke                                                            | ⏳ Your turn (optional before Day 5 sign-off) |
| Day 4 git commit                                                                            | ⏳ When you ask                               |
| **Next:** [`Day5_Checklist.md`](Day5_Checklist.md) — merchant MVP finish (settings, polish) | ⏳                                            |

**Target:** Merchant owner can run a counter shift end-to-end (queue → approve → redeem) using **seeded test data**. Live QR scan E2E lands on **Day 6** (customer PWA).

---

## MVP definition — merchant side “done”

After Day 4, a merchant with `status = active` can:

1. See **live pending stamp requests** on the dashboard (Supabase Realtime).
2. **Approve** or **reject** each request (optional rejection reason); expired requests drop off (~5 min).
3. Enter a customer’s **6-character redemption code**, review reward details, and **confirm** (`complete_redemption` RPC).
4. View **basic stats** (active collectors, stamps issued, rewards redeemed, redemption rate) and a **recent activity** list.
5. Everything above scoped to the **active business** (`merchant_id` from session cookie).

Customer scan → pending session creation is **Day 5**; Day 4 validates merchant UI with fixtures.

---

## Build order (dependency chain)

```text
0. Close Day 3 (commit + smoke)                                                    ⏳
      ↓
1. @repo/supabase stamp/redemption queries + server actions (approve/reject/redeem) ⏳
      ↓
2. features/stamp-queue — Realtime + Zustand queue UI on /merchant/dashboard        ⏳
      ↓
3. features/redemption — /merchant/redeem flow                                      ⏳
      ↓
4. features/analytics — stats + activity feed (/merchant/analytics or dashboard)    ⏳
      ↓
5. Shell nav, browser tab badge, i18n, a11y (44px approve/reject)                 ✅
      ↓
6. Dev seed script + manual E2E                                                     ⏳ manual pending
      ↓
7. Customer list + branch filter (`/merchant/customers`)                            ✅
```

---

## Phase H — Customer list (per business)

Route: `/merchant/customers`

### H1. Query layer

- [x] `getMerchantCustomers(merchantId, locationId?)` — `packages/supabase/src/queries/merchant-customers.ts`
- [x] Branch filter: customers with ≥1 `stamp_sessions` row at that `location_id`
- [x] Columns: name, phone, stamps progress, cycle, reward status, last branch, last visit, all-time stamps

### H2. UI

- [x] `features/customers/` — table + branch `<select>` filter (URL `?branch=`)
- [x] Nav link **Customers** in `MerchantShell`
- [x] i18n: `customers.*`

### H3. Out of scope (v2)

- [ ] Customer detail drawer / full stamp history per customer
- [ ] Export CSV
- [ ] Search by phone/name

---

## Day 4 polish fixes (June 2026)

- [x] Demo seed: unique redemption codes (`DEMO01`–`DEMO99`), reuse existing pending code
- [x] Demo seed: Sam card set to full target before redeem demo; no fake starting stamp count
- [x] Demo seed: partial success — queue loads even if redemption code pool exhausted (warning message)
- [x] Redeem confirm: labels **Stamps this cycle** vs **Approved this cycle** vs **All-time approved visits**
- [x] Redeem confirm: cycle-scoped approved count (since previous redemption)

---

## Phase 0 — Day 3 close-out

- [ ] Run Day 3 manual E2E ([`Day3_Checklist.md`](Day3_Checklist.md) §D2) — business hub, loyalty card, QR PNG, theme toggle
- [ ] Git commit Day 3 merchant work (when ready)
- [ ] Confirm `NEXT_PUBLIC_APP_URL` points at customer app origin in merchant `.env.local` (for QR URLs — scan still Day 5)

**Already delivered in Day 3 (no redo):** business hub, branches, loyalty card config, `LoyaltyCardPreviewV2`, currency picker, per-branch QR download.

---

## Phase A — Database & query layer

> RPCs exist: `increment_stamps`, `complete_redemption` (`supabase/migrations/20260607120002_functions.sql`).  
> Realtime publication includes `stamp_sessions` (`20260607120003_realtime_and_grants.sql`).

### A1. Stamp queries (`packages/supabase/src/queries/stamps.ts`)

- [ ] `getPendingStampSessions(merchantId)` — `status = 'pending'`, join customer first name + card name + branch name (`location_id`)
- [ ] `getStampSessionById(sessionId)` — ownership check via `merchant_id`
- [ ] `approveStampSession(sessionId)` — set `approved` + `resolved_at`, then `increment_stamps(card_id, new_status)` per Technical Doc §7.3
- [ ] `rejectStampSession(sessionId, reason?)` — set `rejected` + optional `rejection_reason`
- [ ] `expireStalePendingSessions(merchantId?)` — mark `pending` older than 5 minutes as `expired` (app on load + optional pg_cron later)

### A2. Redemption queries (`packages/supabase/src/queries/redemptions.ts`)

- [ ] `getRedemptionByCode(merchantId, code)` — `status = 'pending'`, join customer + card + reward text
- [ ] `completeRedemptionForMerchant(redemptionId)` — verify merchant ownership, call `complete_redemption` RPC

### A3. Analytics queries (`packages/supabase/src/queries/analytics.ts`)

- [ ] Active collectors — `customer_cards` where `merchant_id` + `reward_status = 'collecting'` + `current_stamps > 0`
- [ ] Stamps issued — count approved `stamp_sessions` (today / week / month)
- [ ] Rewards redeemed — count `redemptions` where `status = 'redeemed'` (today / week / month)
- [ ] Redemption rate — `redeemed ÷ sum(targets_reached)` per Technical Doc §4.6
- [ ] Recent activity — last 20 approved/`voided` stamp sessions + redemptions (union, sorted by time)

### A4. Optional migration (recommended)

- [ ] Add atomic `approve_stamp_session(p_session_id uuid)` RPC (single transaction: validate pending → approve row → `increment_stamps`) to prevent double-approve races
- [ ] Regenerate types → merge into `packages/supabase/src/types.ts`

### A5. Server actions (`apps/merchant/src/features/`)

- [ ] `features/stamp-queue/api/stampQueueActions.ts` — `approveStampAction`, `rejectStampAction` (auth + active merchant + ownership)
- [ ] `features/redemption/api/redemptionActions.ts` — `lookupRedemptionAction`, `confirmRedemptionAction`
- [ ] All actions: validate inside action (Technical Doc §9 — treat like public API)

---

## Phase B — Stamp approval queue (PRD §6.3 primary view)

> **FDA:** `features/stamp-queue/` · **Realtime only** for queue (TanStack Query for everything else — Technical Doc §5.2 pitfall).

### B1. Realtime subscription

- [ ] `features/stamp-queue/lib/subscribeStampQueue.ts` — `postgres_changes` INSERT on `stamp_sessions` filtered by `merchant_id`
- [ ] Also subscribe UPDATE (approved/rejected/expired) to remove from local queue
- [ ] Cleanup channel on unmount; reconnect handling
- [ ] Client-only Zustand slice: `stampQueue[]`, `addToQueue`, `removeFromQueue`, `setQueue`

### B2. Dashboard UI (`/merchant/dashboard`)

- [ ] Refocus `MerchantDashboard` — **stamp queue is the hero**, stats secondary (PRD §6.3)
- [ ] Queue item: customer first name, card name, branch (if `location_id`), relative time, expiry countdown
- [ ] Actions: **Approve ✓** / **Reject ✗** — min **44×44px** tap targets (PRD §1.5)
- [ ] Reject opens dialog with optional reason (max ~120 chars)
- [ ] Empty queue state: “No pending requests” + link to loyalty card / QR help
- [ ] Loading: initial fetch of pending sessions before Realtime attaches
- [ ] i18n: `stampQueue.*` in `apps/merchant/messages/en.json`

### B3. Expiry UX

- [ ] Hide or grey out sessions older than 5 minutes client-side
- [ ] Call `expireStalePendingSessions` on dashboard mount (and after Realtime INSERT)
- [ ] Optional: subtle “Expired” toast when item ages out while visible

### B4. Browser tab badge

- [ ] `document.title` prefix or `[n] YORewards Merchant` when queue length > 0
- [ ] Clear badge when queue empty or tab focused (PRD §6.3)

---

## Phase C — Redemption management (PRD §6.3)

Route: `/merchant/redeem`

### C1. Feature scaffold

- [ ] `features/redemption/` — components, api, types, `index.ts` public API
- [ ] Thin page: `apps/merchant/src/app/merchant/(protected)/redeem/page.tsx`

### C2. Redemption flow

- [ ] Code input — 6-character alphanumeric, uppercase normalize, accessible label
- [ ] Lookup → show: customer first name, reward description, current stamps, cycle number
- [ ] Stamp history summary — count of approved (non-voided) sessions for this card
- [ ] Confirm button → `complete_redemption` → success state (“Reward redeemed — new cycle started”)
- [ ] Error states: invalid code, already redeemed, wrong merchant, not `pending`
- [ ] i18n: `redemption.*`

> **Note:** Customer OTP → `redemptions` row creation is **Day 5**. Day 4 tests redeem UI by **seeding** a pending redemption row in Supabase (see Phase F).

---

## Phase D — Basic analytics (PRD §6.3)

Route: `/merchant/analytics` (or dedicated section on dashboard — pick one; PRD lists separate route)

### D1. Stats cards

- [ ] Active collectors
- [ ] Stamps issued — today / this week / this month (tabs or segmented control)
- [ ] Rewards redeemed — same periods
- [ ] Redemption rate — single percentage with tooltip explaining formula

### D2. Recent activity feed

- [ ] Last 20 events — stamp approved / redemption completed (icons + relative time)
- [ ] TanStack Query `['analytics', merchantId]` — stale 1 min (Technical Doc §5.2)
- [ ] Empty state for new merchants

### D3. UI

- [ ] `features/analytics/components/MerchantAnalyticsView.tsx`
- [ ] Reuse `PageHeader`, `merchant-glass-card`, status chips
- [ ] i18n: `analytics.*`

### D4. Out of scope (Day 4)

- [ ] Per-branch charts / `location_id` breakdown — v2 or Day 6 stub only
- [ ] Export CSV

---

## Phase E — Navigation & settings

### E1. Shell nav (`MerchantShell`)

- [ ] Add **Redeem** → `/merchant/redeem`
- [ ] Add **Analytics** → `/merchant/analytics` (if not merged into dashboard)
- [ ] Dashboard remains default landing; queue badge optional on nav item

### E2. Settings (`/merchant/settings`)

- [ ] Expand stub **or** keep “coming soon” with clearer MVP copy
- [ ] Minimum if expanded: read-only business profile + link to Business hub for edits
- [ ] Account email display (from auth session) — no password change required for Day 4

### E3. Dashboard quick actions

- [ ] Update links to include Redeem + Analytics
- [ ] Stats cards pull live counts from analytics queries (replace static placeholders if any)

---

## Phase F — Dev fixtures (test before Day 5)

> Merchant queue cannot be filled by QR until customer `/scan` exists. Use fixtures for Day 4 E2E.

- [ ] Document SQL or script: insert test `customer` + `customer_card` + `stamp_sessions` row (`pending`) for active merchant
- [ ] Document SQL or script: insert test `redemptions` row (`pending`, known code) for redeem flow test
- [ ] Optional: `resources/scripts/seed-merchant-demo.sql` or protected dev-only API route (local only)
- [ ] README note in checklist: **never** ship dev seed route to production

---

## Phase G — Verification

### G1. Automated

- [ ] `pnpm exec turbo lint --filter=merchant`
- [ ] `pnpm exec turbo check-types --filter=merchant`
- [ ] `pnpm exec turbo build --filter=merchant`

### G2. Manual E2E (merchant — with seeded data)

- [ ] Log in as **active** merchant → dashboard shows empty queue
- [ ] Seed pending stamp session → appears in queue **without refresh** (Realtime)
- [ ] Approve → item leaves queue; analytics stamp count increments
- [ ] Seed second session → reject with reason → item leaves queue; no stamp increment
- [ ] Wait 5+ min (or backdate row) → expired session not actionable
- [ ] Seed pending redemption → `/merchant/redeem` → enter code → confirm → success
- [ ] Tab badge shows when queue non-empty
- [ ] Switch active business → queue scoped correctly (no cross-merchant leakage)
- [ ] Pending merchant (`status !== active`) — queue/redeem blocked or read-only with notice

### G3. RLS smoke

- [ ] Merchant A cannot approve Merchant B’s stamp session
- [ ] Merchant cannot complete redemption for another merchant’s code
- [ ] Customer role cannot call merchant approve actions (if testable)

---

## Files to create (planned)

```text
packages/supabase/src/queries/stamps.ts
packages/supabase/src/queries/redemptions.ts
packages/supabase/src/queries/analytics.ts
apps/merchant/src/features/stamp-queue/
  components/StampQueuePanel.tsx
  components/StampQueueItem.tsx
  hooks/useStampQueue.ts
  store/stampQueueStore.ts
  lib/subscribeStampQueue.ts
  api/stampQueueActions.ts
  index.ts
apps/merchant/src/features/redemption/
  components/RedemptionCodeForm.tsx
  components/RedemptionConfirmCard.tsx
  api/redemptionActions.ts
  index.ts
apps/merchant/src/features/analytics/
  components/MerchantAnalyticsView.tsx
  api/analyticsQueries.ts          # TanStack Query hooks
  index.ts
apps/merchant/src/app/merchant/(protected)/redeem/page.tsx
apps/merchant/src/app/merchant/(protected)/analytics/page.tsx
apps/merchant/messages/en.json     # stampQueue.*, redemption.*, analytics.*
resources/scripts/seed-merchant-demo.sql   # optional
supabase/migrations/YYYYMMDD_approve_stamp_session_rpc.sql   # optional
```

---

## Agent skills (Day 4)

| Skill                              | Purpose                             |
| ---------------------------------- | ----------------------------------- |
| `supabase`                         | Realtime, RLS, RPCs                 |
| `supabase-postgres-best-practices` | Atomic approve RPC, indexes         |
| `vercel-react-best-practices`      | Realtime vs TanStack split, actions |
| `shadcn`                           | Queue cards, dialogs, redeem form   |
| `merchant-ui`                      | Dark/light, glass cards, contrast   |
| `accessibility.mdc`                | 44px approve/reject, live regions   |

---

## Out of scope for Day 4 (Day 5+)

| Item                                                     | When             |
| -------------------------------------------------------- | ---------------- |
| Customer QR scanner (`/scan`)                            | Day 5            |
| Stamp session creation from scan                         | Day 5            |
| Customer pending / success / rejected screens + Realtime | Day 5            |
| OTP (Sparrow / Twilio) + reward unlock                   | Day 5            |
| Customer wallet grid polish                              | Day 5            |
| Framer Motion stamp pop-in                               | Day 5 (PRD §1.4) |
| Per-branch analytics charts                              | Day 6+           |
| Multi-staff (`merchant_staff`)                           | v2               |
| Push notifications (beyond tab title)                    | v2               |
| Full merchant settings (password, notifications)         | Post-MVP         |

---

## Done when

- [ ] Active merchant has a **working Realtime stamp queue** on the dashboard
- [ ] Approve/reject updates `stamp_sessions` + stamp count correctly
- [ ] Redemption code flow calls `complete_redemption` and resets customer card cycle
- [ ] Basic analytics + activity feed visible
- [ ] Nav includes redeem (+ analytics if separate route)
- [ ] Lint, types, build pass for `merchant`
- [ ] Manual E2E passes with seeded fixtures (G2)
- [ ] Technical Doc **Implementation Status** updated
- [ ] Day 4 git commit (when you ask)

---

## Day 5 preview (merchant MVP finish — not customer yet)

> **Resequenced:** Day 5 closes the **merchant app** (settings, preferences, polish). See [`Day5_Checklist.md`](Day5_Checklist.md).

Day 5 finishes merchant-side MVP:

1. Settings — account email, business links, preferences
2. Branch context on demo seed + optional UI labels
3. Pending / suspended / rejected UX polish
4. Full merchant sign-off before customer work

Day 6 connects customers + admin (see Day 5 checklist §Day 6 preview).

---

_Previous: [`Day3_Checklist.md`](Day3_Checklist.md) · Next: [`Day5_Checklist.md`](Day5_Checklist.md) — merchant MVP finish_
