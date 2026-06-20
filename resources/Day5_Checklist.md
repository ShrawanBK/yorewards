# YORewards — Day 5 Checklist (Merchant MVP — Finish & Ship-Ready)

> **Goal:** Close the **merchant dashboard MVP** — settings & preferences, status UX, branch context, polish, and sign-off — so **Day 6** can focus on **customer PWA + super admin** without merchant blockers.  
> **Reference:** PRD §6.1, §6.3, routes table · Technical Doc §4.7, §6, Implementation Status  
> **Prerequisite:** Day 4 complete — stamp queue (Realtime), redeem, analytics, customers list, demo seed, error codes, sidebar business/branch switcher  
> **Resequenced from PRD §11:** Original “Day 5 = customer stamp flow” moves to **[`Day6_Checklist.md`](Day6_Checklist.md)** (create when starting Day 6).

---

## Implementation status (June 2026)

| Area                                                              | Status                          |
| ----------------------------------------------------------------- | ------------------------------- |
| Phase A — Day 4 close-out + docs                                  | ⏳ Planned                      |
| Phase B — Settings & account (`/merchant/settings`)               | 🔄 In progress                  |
| Phase C — Business preferences + branch context                   | 🔄 Demo seed uses active branch |
| Phase D — Non-active merchant UX (pending / suspended / rejected) | ⏳ Planned                      |
| Phase E — Polish, lint, empty states                              | ⏳ Planned                      |
| Phase F — Merchant MVP verification                               | ⏳ Planned                      |
| Day 5 git commit                                                  | ⏳ When you ask                 |

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

Customer scan → wallet → OTP → live redemption E2E is **Day 6** (needs customer PWA).

---

## Build order (dependency chain)

```text
0. Close Day 4 (manual E2E note, update Technical Doc status)          ⏳
      ↓
1. features/settings — account + business preferences UI               ⏳
      ↓
2. Wire active branch cookie → demo seed + optional display labels     ⏳
      ↓
3. Pending / suspended / rejected merchant UX (not just dashboard)     ⏳
      ↓
4. Polish: lint fixes, empty states, loyalty alert, error codes audit  ⏳
      ↓
5. Full merchant MVP manual test + sign-off                            ⏳
      ↓
6. Day 6 — customer PWA + admin (separate checklist)                   ⏳
```

---

## Phase A — Day 4 close-out

- [ ] Run Day 4 manual E2E ([`Day4_Checklist.md`](Day4_Checklist.md) §G2) — queue, redeem, tab badge, business switch
- [ ] Optional: RLS smoke ([`Day4_Checklist.md`](Day4_Checklist.md) §G3)
- [ ] Update **Technical Doc → Implementation Status** — Day 4 merchant dashboard marked ✅
- [ ] Git commit Day 4 merchant work (when ready)

---

## Phase B — Settings & account (`/merchant/settings`)

> **FDA:** `features/settings/` · thin page in `app/merchant/(protected)/settings/page.tsx`

### B1. Feature scaffold

- [ ] `features/settings/components/MerchantSettingsView.tsx`
- [ ] `features/settings/index.ts` public API
- [ ] Replace “coming soon” stub on settings page

### B2. Account section (read-only MVP)

- [ ] Display signed-in **email** from Supabase auth session
- [ ] Link to **log out** (same as sidebar) or note “use sidebar to sign out”
- [ ] i18n: `settings.account.*`

### B3. Active business section

- [ ] Show **active business** name, category, country, status badge
- [ ] Link: **Manage business & branches** → `/merchant/business`
- [ ] Link: **Loyalty card & QR codes** → `/merchant/loyalty-card`
- [ ] If multiple businesses: note “Switch business in the sidebar” (no duplicate switcher required)
- [ ] i18n: `settings.business.*`

### B4. Preferences section

- [ ] **Theme** — reuse `ThemeToggle` or link to existing control (light/dark)
- [ ] **Counter branch** — when 2+ active branches, show current branch + “change in sidebar” hint (or compact select mirroring sidebar)
- [ ] i18n: `settings.preferences.*`

### B5. Out of scope (v2 — see [`V2_Backlog.md`](V2_Backlog.md))

- [ ] Change password / change email
- [ ] Notification preferences (email/push)
- [ ] Billing / subscription

---

## Phase C — Branch context wiring

> Sidebar branch switcher exists; ensure backend fixtures respect it.

- [ ] **Demo seed** (`seedDemoStampQueueAction`) — use **active location cookie** (or primary fallback) for `location_id` on seeded stamp sessions + redemption
- [ ] **Dashboard / queue** — optional: show “Working at: {branch}” near stamp queue header (from session data)
- [ ] **Customers page** — optional: default branch filter from active location cookie (`?branch=`)

---

## Phase D — Non-active merchant UX

> PRD: active merchants use queue/redeem; others need clear messaging.

### D1. Status routing

- [ ] Review `requireMerchantSession` / dashboard access for `pending` | `suspended` | `rejected`
- [ ] **Pending:** dashboard with status panel + loyalty card config allowed? (configure while waiting — PRD flow)
- [ ] **Suspended / rejected:** block stamp queue + redeem; show reason where available (`rejection_reason`)
- [ ] Replace bare redirect on `/merchant/pending` if a dedicated pending view helps onboarding

### D2. Status panel polish

- [ ] `MerchantStatusPanel` — verify copy for all statuses; link to settings or support contact placeholder
- [ ] i18n audit for `business.status.*` / dashboard status strings

---

## Phase E — Polish & hardening

- [ ] Fix merchant **lint** warnings (e.g. `LoyaltyCardPreview.tsx` unused vars)
- [ ] **Server action errors** — spot-check all merchant actions return codes only ([`.cursor/rules/server-action-errors.mdc`](../.cursor/rules/server-action-errors.mdc))
- [ ] **Empty states** — analytics, customers, redeem, queue (new merchant with zero data)
- [ ] **a11y** — sidebar `<select>` labels, settings headings, 44px tap targets on queue actions
- [ ] **i18n** — no hardcoded English in new settings UI
- [ ] Remove or gate **dev-only** UI (`Load demo data`) — confirm `isDevEnvironment` guard

---

## Phase F — Merchant MVP verification

### F1. Automated

- [ ] `pnpm exec turbo lint --filter=merchant`
- [ ] `pnpm exec turbo check-types --filter=merchant`
- [ ] `pnpm exec turbo build --filter=merchant`

### F2. Manual E2E (full merchant journey)

- [ ] New owner: sign up → add business → see **pending** status
- [ ] Admin approves → merchant sees **active** → configure loyalty card → download branch QR PNG
- [ ] Sidebar: switch business (if 2+) and branch (if 2+)
- [ ] Dev: load demo data → approve stamp → redeem code → analytics + customers update
- [ ] Settings: email visible, business links work, theme toggles
- [ ] Suspended merchant (test account): queue/redeem blocked with clear message

### F3. Sign-off

- [ ] Mark this checklist **Implementation status** table ✅
- [ ] Update Technical Doc — **Merchant Dashboard MVP complete**; next = Day 6 customer + admin
- [ ] Day 5 git commit (when you ask)

---

## Files to create / modify (planned)

```text
apps/merchant/src/features/settings/
  components/MerchantSettingsView.tsx
  index.ts
apps/merchant/src/app/merchant/(protected)/settings/page.tsx   # thin compose
apps/merchant/messages/en.json                                 # settings.* expanded
apps/merchant/src/features/stamp-queue/api/stampQueueActions.ts  # branch-aware demo seed
resources/YORewards_Technical_Doc_v1.md                      # Implementation Status
resources/V2_Backlog.md                                        # ✅ branch-scoped loyalty noted
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
| Customer phone login, wallet, QR scanner                         | Day 6                                 |
| Stamp session from real scan + customer Realtime                 | Day 6                                 |
| OTP (Sparrow / Twilio) + customer reward unlock                  | Day 6                                 |
| Super admin platform dashboard, audit log UI, manual stamp tool  | Day 6                                 |
| PWA manifest, privacy policy, production deploy all 3 apps       | Day 7                                 |
| Branch-scoped loyalty programs (per-branch cards / redeem rules) | V2 — [`V2_Backlog.md`](V2_Backlog.md) |

---

## Done when

- [ ] `/merchant/settings` is useful (account + business + preferences) — not a stub
- [ ] Non-active merchants see clear, correct UX
- [ ] Demo seed respects active counter branch
- [ ] Lint, types, build pass for `merchant`
- [ ] Full merchant manual E2E (F2) passes
- [ ] Technical Doc updated; Day 6 checklist ready to start customer + admin
- [ ] Day 5 git commit (when you ask)

---

## Day 6 preview (customer + admin — not Day 5)

Day 6 connects merchants to real customers:

1. Customer auth + onboarding + wallet (TanStack Query)
2. QR scan → `stamp_sessions` → merchant queue (Realtime)
3. Customer pending / approved / rejected screens
4. OTP → `redemptions` row → merchant redeem UI (already built Day 4)
5. Admin: platform overview, customer management, audit log, manual stamp tool

---

_Previous: [`Day4_Checklist.md`](Day4_Checklist.md) · V2 ideas: [`V2_Backlog.md`](V2_Backlog.md) · Next: Day 6 — customer PWA + super admin_
