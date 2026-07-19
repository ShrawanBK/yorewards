# YORewards — Day 5 Checklist (Merchant MVP — Finish & Ship-Ready)

> **Goal:** Close the **merchant dashboard MVP** — settings & preferences, status UX, branch context, polish, and sign-off — so **Day 6** can focus on **super admin** without merchant blockers.  
> **Reference:** PRD §6.1, §6.3, routes table · Technical Doc §4.7, §6, Implementation Status  
> **Prerequisite:** Day 4 complete — stamp queue (Realtime), redeem, analytics, customers list, demo seed, error codes, sidebar business/branch switcher  
> **Resequenced from PRD §11:** Original “Day 5 = customer stamp flow” → [`Day7_Checklist.md`](Day7_Checklist.md). **Day 6 = admin** → [`Day6_Checklist.md`](Day6_Checklist.md).

---

## Implementation status (June 2026)

| Area                                                              | Status        |
| ----------------------------------------------------------------- | ------------- |
| Phase A — Day 4 close-out + docs                                  | ⏳ Manual E2E / commit when ready |
| Phase B — Settings & account (`/merchant/settings`)               | ✅ Done       |
| Phase C — Business preferences + branch context                   | ✅ Done       |
| Phase D — Non-active merchant UX (pending / suspended / rejected) | ✅ Done       |
| Phase E — Polish, lint, empty states                              | ✅ Done       |
| Phase F — Merchant MVP verification                               | ⏳ Manual E2E sign-off |
| Day 5 git commit                                                  | ⏳ When you ask |

**Target:** A merchant owner can run the full counter workflow (configure card → print branch QR → approve stamps → redeem rewards → view analytics/customers) and manage account/business context from **Settings** — with no “coming soon” on critical paths.

---

## MVP definition — merchant app “done” (end of Day 5)

An owner with at least one business can:

1. **Register / sign in** and add multiple businesses (Day 2).
2. **Wait for admin approval** or see clear status if suspended/rejected (Day 5 polish).
3. **Configure loyalty card** + download **per-branch QR** (Day 3).
4. **Switch business and counter branch** from the sidebar (Day 4 polish).
5. **Approve/reject stamps** (Realtime queue) and **confirm redemptions** (Day 4).
6. **View analytics** and **customer list** with branch filter (Day 4).
7. **Settings:** see account email, active business summary, links to business hub / loyalty card, theme (Day 5).
8. Pass **lint, types, build** for `merchant` app.

Customer scan → wallet → OTP → live redemption E2E is **Day 7** ([`Day7_Checklist.md`](Day7_Checklist.md)).

---

## Build order (dependency chain)

```text
0. Close Day 4 (manual E2E note, update Technical Doc status)          ⏳
      ↓
1. features/settings — account + business preferences UI               ✅
      ↓
2. Wire active branch cookie → demo seed + optional display labels     ✅
      ↓
3. Pending / suspended / rejected merchant UX (not just dashboard)     ✅
      ↓
4. Polish: lint fixes, empty states, loyalty alert, error codes audit  ✅
      ↓
5. Full merchant MVP manual test + sign-off                            ⏳
      ↓
6. Day 6 — super admin ([`Day6_Checklist.md`](Day6_Checklist.md))                   ⏳
      ↓
7. Day 7 — customer PWA ([`Day7_Checklist.md`](Day7_Checklist.md))                 ⏳
      ↓
8. Day 8 — polish & launch ([`Day8_Checklist.md`](Day8_Checklist.md))               ⏳
```

---

## Phase A — Day 4 close-out

- [ ] Run Day 4 manual E2E ([`Day4_Checklist.md`](Day4_Checklist.md) §G2) — queue, redeem, tab badge, business switch
- [ ] Optional: RLS smoke ([`Day4_Checklist.md`](Day4_Checklist.md) §G3)
- [x] Update **Technical Doc → Implementation Status** — Day 5 merchant MVP marked ✅
- [ ] Git commit Day 4/5 merchant work (when ready)

---

## Phase B — Settings & account (`/merchant/settings`)

> **FDA:** `features/settings/` · thin page in `app/merchant/(protected)/settings/page.tsx`

### B1. Feature scaffold

- [x] `features/settings/components/MerchantSettingsView.tsx`
- [x] `features/settings/index.ts` public API
- [x] Replace “coming soon” stub on settings page

### B2. Account section (read-only MVP)

- [x] Display signed-in **email** from Supabase auth session
- [x] Link to **log out** (same as sidebar) or note “use sidebar to sign out”
- [x] i18n: `settings.account.*`

### B3. Active business section

- [x] Show **active business** name, category, country, status badge
- [x] Link: **Manage business & branches** → `/merchant/business`
- [x] Link: **Loyalty card & QR codes** → `/merchant/loyalty-card`
- [x] If multiple businesses: note “Switch business in the sidebar” (no duplicate switcher required)
- [x] i18n: `settings.business.*`

### B4. Preferences section

- [x] **Theme** — reuse `ThemeToggle` or link to existing control (light/dark)
- [x] **Counter branch** — when 2+ active branches, show current branch + “change in sidebar” hint (or compact select mirroring sidebar)
- [x] i18n: `settings.preferences.*`

### B5. Out of scope (v2 — see [`V2_Backlog.md`](../v2/V2_Backlog.md))

- [ ] Change password / change email
- [ ] Notification preferences (email/push)
- [ ] Billing / subscription

---

## Phase C — Branch context wiring

> Sidebar branch switcher exists; ensure backend fixtures respect it.

- [x] **Demo seed** (`seedDemoStampQueueAction`) — use **active location cookie** (or primary fallback) for `location_id` on seeded stamp sessions + redemption
- [x] **Dashboard / queue** — show “Working at: {branch}” near stamp queue header (from session data)
- [x] **Customers page** — default branch filter from active location cookie (`?branch=` redirect when 2+ branches)

---

## Phase D — Non-active merchant UX

> PRD: active merchants use queue/redeem; others need clear messaging.

### D1. Status routing

- [x] Review `requireMerchantSession` / dashboard access for `pending` | `suspended` | `rejected`
- [x] **Pending:** dashboard with status panel + loyalty card config allowed (configure while waiting)
- [x] **Suspended / rejected:** block stamp queue + redeem; show reason where available (`rejection_reason`)
- [x] `/merchant/pending` redirects to dashboard (status panel covers onboarding)

### D2. Status panel polish

- [x] `MerchantStatusPanel` — verify copy for all statuses; links to loyalty card + settings for non-active
- [x] i18n audit for `business.status.*` / dashboard status strings

---

## Phase E — Polish & hardening

- [x] Fix merchant **lint** warnings (`LoyaltyCardPreview.tsx`, `MerchantSettingsView.tsx`)
- [x] **Server action errors** — spot-check all merchant actions return codes only ([`.cursor/rules/server-action-errors.mdc`](../.cursor/rules/server-action-errors.mdc))
- [x] **Success toasts** — personalized i18n feedback via `showActionSuccess` + `{customer}`, `{branch}`, etc.
- [x] **Empty states** — analytics, customers, redeem, queue (new merchant with zero data)
- [x] **a11y** — sidebar `<select>` labels, settings headings, 44px tap targets on queue actions
- [x] **i18n** — no hardcoded English in settings UI
- [x] Remove or gate **dev-only** UI (`Load demo data`) — confirm `isDevEnvironment` guard

---

## Phase F — Merchant MVP verification

### F1. Automated

- [x] `pnpm exec turbo lint --filter=merchant`
- [x] `pnpm exec turbo check-types --filter=merchant`
- [x] `pnpm exec turbo build --filter=merchant`

### F2. Manual E2E (full merchant journey)

- [ ] New owner: sign up → add business → see **pending** status
- [ ] **Pending:** configure loyalty card while waiting (save works)
- [ ] Admin approves → merchant sees **active** → download branch QR PNG
- [ ] Sidebar: switch business (if 2+) and branch (if 2+)
- [ ] Dev: load demo data → approve stamp → redeem code → analytics + customers update
- [ ] Settings: email visible, business links work, theme toggles
- [ ] Suspended merchant (test account): queue/redeem blocked with clear message

### F3. Sign-off

- [x] Mark this checklist **Implementation status** table ✅ (code complete; manual E2E pending)
- [x] Update Technical Doc — **Merchant Dashboard MVP complete**; next = Day 6 customer + admin
- [ ] Day 5 git commit (when you ask)

---

## Files created / modified (Day 5)

```text
apps/merchant/src/features/settings/
apps/merchant/src/shared/utils/merchant-status.ts
apps/merchant/src/shared/utils/action-feedback.ts
apps/merchant/src/features/dashboard/components/MerchantStatusPanel.tsx
apps/merchant/src/features/stamp-queue/components/StampQueuePanel.tsx
apps/merchant/src/app/merchant/(protected)/customers/page.tsx
apps/merchant/messages/en.json
resources/YORewards_Technical_Doc.md
resources/Day5_Checklist.md
```

---

## Agent skills (Day 5)

| Skill                         | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `merchant-ui`                 | Settings layout, glass cards, sidebar consistency |
| `shadcn`                      | Settings sections, badges, links                  |
| `vercel-react-best-practices` | Thin pages, server/client split                   |
| `accessibility.mdc`           | Settings form labels, status announcements        |
| `server-action-errors.mdc`    | Any new server actions                            |

---

## Out of scope for Day 5 (Day 6+)

| Item                                                             | When                                  |
| ---------------------------------------------------------------- | ------------------------------------- |
| Super admin dashboard, customers, audit, manual stamp tool       | Day 6 — [`Day6_Checklist.md`](Day6_Checklist.md) |
| Customer phone login, wallet, QR scanner                           | Day 7 — [`Day7_Checklist.md`](Day7_Checklist.md) |
| Stamp session from real scan + customer Realtime                 | Day 7                                 |
| OTP (Sparrow / Twilio) + customer reward unlock                  | Day 7                                 |
| PWA manifest, privacy policy, production deploy all 3 apps       | Day 8 — [`Day8_Checklist.md`](Day8_Checklist.md) |
| Branch-scoped loyalty programs (per-branch cards / redeem rules) | V2 — [`V2_Backlog.md`](../v2/V2_Backlog.md) |

---

## Done when

- [x] `/merchant/settings` is useful (account + business + preferences) — not a stub
- [x] Non-active merchants see clear, correct UX
- [x] Demo seed respects active counter branch
- [x] Lint, types, build pass for `merchant`
- [ ] Full merchant manual E2E (F2) passes
- [x] Technical Doc updated; ready to start Day 6 admin
- [ ] Day 5 git commit (when you ask)

---

## What's next

| Day | Focus | Checklist |
| --- | ----- | --------- |
| **6** | Super Admin — full platform control | [`Day6_Checklist.md`](Day6_Checklist.md) |
| **7** | Customer PWA — scan, wallet, OTP | [`Day7_Checklist.md`](Day7_Checklist.md) |
| **8** | Polish, privacy, production deploy | [`Day8_Checklist.md`](Day8_Checklist.md) |

---

_Previous: [`Day4_Checklist.md`](Day4_Checklist.md) · V2: [`V2_Backlog.md`](../v2/V2_Backlog.md) · **Start:** [`Day6_Checklist.md`](Day6_Checklist.md)_
