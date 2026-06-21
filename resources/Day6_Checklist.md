# YORewards — Day 6 Checklist (Super Admin — Full Platform Control)

> **Goal:** Finish the **super admin app** (`apps/admin`) so the founder can approve merchants, monitor the platform, manage customers, issue/void stamps manually, and review a full audit trail — **before** customer PWA work on Day 7.  
> **Reference:** PRD §6.4, §8.3 · Technical Doc §3.3, §4, §8.4, `issue_stamp_manual` / `void_stamp` RPCs  
> **Prerequisite:** Day 5 merchant MVP code-complete ([`Day5_Checklist.md`](Day5_Checklist.md)); optional merchant manual E2E §F2  
> **Resequenced:** Original PRD Day 6 mixed customer + admin — **admin only** on Day 6; customer → [`Day7_Checklist.md`](Day7_Checklist.md)

---

## Implementation status

| Area                                           | Status     |
| ---------------------------------------------- | ---------- |
| Phase A — Admin guard + FDA scaffold           | ✅ Done |
| Phase B — Admin shell + navigation             | ✅ Done |
| Phase C — Platform dashboard                   | ✅ Done |
| Phase D — Merchants (detail + polish)          | ✅ Done |
| Phase E — Customer management                  | ✅ Done |
| Phase F — Manual stamp tool                      | ✅ Done |
| Phase G — Audit log UI                         | ⏳ Planned |
| Phase H — Hardening + sign-off                 | ⏳ Planned |
| Day 6 git commit                               | ⏳ When you ask |

**Already done (Day 2 baseline):** admin login/logout, `/admin/merchants` queue, approve/reject/suspend/reactivate, `audit_log` on merchant actions, error codes + i18n toasts.

**Target:** All PRD §8.3 routes live with consistent FDA, i18n, and audit on every admin mutation.

---

## MVP definition — admin app “done” (end of Day 6)

A signed-in super admin can:

1. **Sign in** with email + password; non-admin users are blocked.
2. See **platform overview** — merchants, customers, stamps, redemptions (all-time + period).
3. **Approve / reject / suspend / reactivate** merchants (existing queue + detail view).
4. **List customers**, view active cards, **suspend / reactivate** accounts.
5. **Issue** a manual stamp or **void** an approved session (RPC + audit log).
6. Browse the full **audit log** with filters.
7. Pass **lint, types, build** for `admin` app.

Customer PWA is **Day 7** — not in scope here.

---

## Build order (dependency chain)

```text
0. Admin role guard + FDA scaffold (features/*)                         ✅
      ↓
1. AdminShell — nav: Dashboard, Merchants, Customers, Stamps, Audit     ✅
      ↓
2. Platform stats queries + /admin/dashboard                            ✅
      ↓
3. /admin/merchants/[id] detail + per-merchant audit slice              ✅
      ↓
4. /admin/customers — list, suspend, detail                           ✅
      ↓
5. /admin/stamps — issue_stamp_manual + void_stamp + audit              ⏳
      ↓
6. /admin/audit — paginated full log                                    ⏳
      ↓
7. Lint / types / build / manual E2E / docs                             ⏳
```

---

## Phase A — Guardrails + FDA scaffold

### A1. Admin authorization

- [x] `requireAdminSession()` — session + verify `ADMIN_EMAIL` env or `user.app_metadata.role === 'admin'`
- [x] Apply to `(protected)/layout.tsx` and every server action
- [x] Return `fail("UNAUTHORIZED")` / `fail("FORBIDDEN")` — add codes to `@repo/utils/action-error` + `apps/admin/messages/en.json`
- [x] Document in Technical Doc §8.4

### A2. Feature-driven layout (`apps/admin/src/`)

- [x] Migrate from flat `components/` + `app/admin/actions.ts` toward FDA (match merchant pattern):
  - `features/auth/` — login form, guards
  - `features/merchants/` — queue, detail, actions
  - `features/dashboard/` — platform stats view
  - `features/customers/` — list, suspend actions
  - `features/stamps/` — manual issue/void tool
  - `features/audit/` — audit log view
  - `widgets/AdminShell/` — sidebar nav + layout
- [x] Each feature: `index.ts` public API; thin pages in `app/admin/(protected)/`

### A3. Shared admin utilities

- [x] `shared/utils/resolve-action-error.ts` — already exists; keep in sync with merchant
- [x] `shared/utils/action-feedback.ts` — success toasts (Sonner + i18n placeholders)
- [x] Root layout: confirm `Toaster` from `@repo/ui/sonner`

---

## Phase B — Admin shell + navigation

- [x] `AdminShell` — desktop sidebar: Dashboard, Merchants, Customers, Stamps, Audit, Log out
- [x] Post-login redirect → `/admin/dashboard` (not only `/admin/merchants`)
- [x] Active route highlighting
- [x] i18n: `nav.dashboard`, `nav.merchants`, `nav.customers`, `nav.stamps`, `nav.audit`, `nav.logout`
- [x] `(protected)/layout.tsx` wraps children with `AdminShell`

---

## Phase C — Platform dashboard (`/admin/dashboard`) — PRD §6.4

### C1. Query layer (`@repo/supabase`)

- [x] `getPlatformStats()` — merchants by status, total customers, stamps issued, redemptions (all-time + today/week/month)
- [x] Optional: `getPlatformRecentActivity(limit)` — last N audit or stamp/redemption events
- [x] Service role or admin-scoped RLS — document choice

### C2. UI

- [x] `features/dashboard/components/AdminDashboardView.tsx`
- [x] Stat cards + period toggle (today / week / month) where applicable
- [x] Link cards → Merchants (pending count), Customers, Audit
- [x] i18n: `dashboard.*`
- [x] Empty/zero state when platform is new

### C3. Page

- [x] `app/admin/(protected)/dashboard/page.tsx` — thin compose

---

## Phase D — Merchants polish — PRD §6.4, §8.3

### D1. Existing queue (migrate + polish)

- [x] Move `MerchantQueue` → `features/merchants/components/`
- [x] Move merchant actions → `features/merchants/api/merchantActions.ts`
- [x] Personalized success toasts (`{name}`) via `showActionSuccess`
- [x] Optional filters: country, category (PRD)

### D2. Merchant detail (`/admin/merchants/[id]`)

- [x] Query: merchant row + branches count + loyalty card summary + recent audit for this merchant
- [x] `MerchantDetailView` — status badge, contact, rejection reason, approve/suspend actions
- [x] Link from queue cards → detail
- [x] i18n: `merchants.detail.*`

### D3. Routes

- [x] `app/admin/(protected)/merchants/page.tsx` — list (existing)
- [x] `app/admin/(protected)/merchants/[id]/page.tsx` — detail

---

## Phase E — Customer management (`/admin/customers`) — PRD §6.4

### E1. Query layer

- [x] `getAllCustomers()` or paginated list — name, phone, status, card count, created_at
- [x] `getCustomerDetail(customerId)` — profile + `customer_cards` with merchant/card names
- [x] `suspendCustomerAction` / `reactivateCustomerAction` — update `customers.status` + audit log

### E2. UI

- [x] `features/customers/components/AdminCustomersView.tsx` — searchable table
- [x] Status badges (active / suspended)
- [x] Suspend / reactivate with confirm dialog
- [x] Optional: `/admin/customers/[id]` detail page
- [x] i18n: `customers.*`

### E3. Server actions

- [x] Error codes only; audit entries: `suspend_customer`, `reactivate_customer`

---

## Phase F — Manual stamp tool (`/admin/stamps`) — PRD §6.4

### F1. Lookup

- [x] Search by customer phone or `customer_cards.id`
- [x] Show card: merchant name, stamp progress, recent approved sessions

### F2. Issue stamp

- [x] Server action calls `issue_stamp_manual(p_card_id)` RPC (service role)
- [x] `audit_log`: action `issue_stamp_manual`, target_type `stamp` (session id), notes optional
- [x] Success toast with customer/card context

### F3. Void stamp

- [x] Select an approved `stamp_sessions` row for the card
- [x] Server action calls `void_stamp` RPC (verify exact RPC name in migrations)
- [x] `audit_log`: action `void_stamp`, target_id = session id
- [x] Confirm dialog — irreversible warning (i18n)

### F4. UI

- [x] `features/stamps/components/AdminStampToolView.tsx`
- [x] i18n: `stamps.*`
- [x] Route: `app/admin/(protected)/stamps/page.tsx`

---

## Phase G — Audit log (`/admin/audit`) — PRD §6.4

### G1. Query layer

- [ ] `getAuditLog({ limit, offset, action?, targetType? })`
- [ ] Join admin user email if available (optional MVP: show admin_id short)

### G2. UI

- [ ] `features/audit/components/AdminAuditLogView.tsx`
- [ ] Table: timestamp, action (translated label), target, notes
- [ ] Filter tabs: All | Merchants | Customers | Stamps
- [ ] Pagination or “load more”
- [ ] i18n: `audit.actions.*`, `audit.*`

### G3. Route

- [ ] `app/admin/(protected)/audit/page.tsx`

---

## Phase H — Hardening + sign-off

### H1. Automated

- [ ] `pnpm exec turbo lint --filter=admin`
- [ ] `pnpm exec turbo check-types --filter=admin`
- [ ] `pnpm exec turbo build --filter=admin`

### H2. Manual E2E

- [ ] Admin login with `ADMIN_EMAIL` account
- [ ] Non-admin merchant login → cannot access `/admin/*`
- [ ] Dashboard stats reflect seeded/demo data
- [ ] Approve pending merchant → merchant sees active on dashboard
- [ ] Reject with reason → merchant sees rejection
- [ ] Suspend active merchant → queue/redeem blocked on merchant app
- [ ] Customer suspend → customer cannot scan (after Day 7, or verify DB status only)
- [ ] Manual issue stamp → merchant/customer card increments
- [ ] Void stamp → session voided, count corrected
- [ ] Audit log shows all actions in order

### H3. Docs + commit

- [ ] Update Technical Doc — Admin MVP ✅
- [ ] Mark this checklist implementation table ✅
- [ ] Day 6 git commit (when you ask)

---

## PRD routes checklist (§8.3)

| Route                   | Day 6 task        |
| ----------------------- | ----------------- |
| `/admin/login`          | ✅ Exists — polish in shell migration |
| `/admin/dashboard`      | Phase C           |
| `/admin/merchants`      | ✅ Exists — Phase D polish |
| `/admin/merchants/[id]` | Phase D2          |
| `/admin/customers`      | Phase E           |
| `/admin/stamps`         | Phase F           |
| `/admin/audit`          | Phase G           |

---

## Agent skills (Day 6)

| Skill                         | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `server-action-errors.mdc`    | All admin mutations                  |
| `shadcn`                      | Tables, dialogs, badges              |
| `vercel-react-best-practices` | Thin pages, query hooks              |
| `supabase` skill              | RPCs, RLS, service role              |
| FDA rules (`root.mdc`)        | Feature folders, public `index.ts`   |

---

## Out of scope (Day 7+)

| Item                              | When                          |
| --------------------------------- | ----------------------------- |
| Customer PWA auth, wallet, scan   | [`Day7_Checklist.md`](Day7_Checklist.md) |
| OTP / Sparrow / Twilio            | Day 7                         |
| PWA manifest, privacy, prod deploy | [`Day8_Checklist.md`](Day8_Checklist.md) |
| Email notifications (merchant approved) | V2 or Day 8 stub        |
| Multi-admin roles                 | V2                            |

---

## Done when

- [ ] All §8.3 admin routes implemented (not stubs)
- [ ] Admin role guard enforced on UI + server actions
- [ ] Every mutation writes `audit_log`
- [ ] Lint, types, build pass for `admin`
- [ ] Manual E2E (H2) passes
- [ ] Technical Doc updated; ready for Day 7 customer PWA

---

_Previous: [`Day5_Checklist.md`](Day5_Checklist.md) · Next: [`Day7_Checklist.md`](Day7_Checklist.md) (customer PWA)_
