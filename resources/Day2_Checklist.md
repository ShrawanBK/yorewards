# YORewards — Day 2 Checklist (Auth & Merchant Onboarding)

> **Goal:** Admin and merchant can log in, routes are guarded, and admin can approve merchants — **merchant backend and dashboard come next; customer app waits until the merchant side is ready.**  
> **Reference:** PRD §5, §8 · Technical Doc §4.2, §6, §3  
> **Prerequisite:** Day 1 complete (schema, RLS, `@repo/supabase`, shadcn, next-intl, `.env.local`)

---

## Build philosophy (merchant-first)

```text
Admin + Merchant auth  →  Merchant card & stamp rules  →  Merchant dashboard (queue, redeem)
                                                              ↓
                                                    Customer auth + wallet + scan
```

Customer flows depend on merchants having configured cards, QR codes, and a working approval queue. Build and verify the **merchant side end-to-end** before investing in customer PWA routes beyond stubs.

---

## Agent skills (installed for Day 2)

| Skill                              | Purpose                             |
| ---------------------------------- | ----------------------------------- |
| `supabase`                         | Auth, SSR, RLS, API routes          |
| `supabase-postgres-best-practices` | Query patterns                      |
| `shadcn`                           | Login/register forms in `@repo/ui`  |
| `vercel-react-best-practices`      | Server actions, App Router patterns |
| `turborepo`                        | Monorepo `--filter` workflows       |
| `web-design-guidelines`            | Form UX, accessibility              |

Install/update: `npx skills add <owner/repo@skill> -y` · Lock file: `skills-lock.json`

---

## Auth architecture (read once)

| Role         | Method           | Session              | RLS identity                                       |
| ------------ | ---------------- | -------------------- | -------------------------------------------------- |
| **Admin**    | Email + password | Supabase Auth cookie | Service role for writes                            |
| **Merchant** | Email + password | Supabase Auth cookie | `current_merchant_ids()` (owner → many businesses) |
| **Customer** | Phone, no OTP    | Supabase session     | `app_metadata.customer_id` (see PRD §11)           |

> **No magic link for merchants.** Registration and login use `signUp` / `signInWithPassword` (same pattern as admin, separate app).  
> Customer phone auth is documented in Technical Doc §4.2 — not part of this checklist.

---

## Build order (dependency chain)

```text
A. Shared auth infra  →  B. Admin  →  C. Merchant approval  →  D. Merchant auth  →  E. Verify
```

---

## Schema addendum — Multi-business per owner

> Product decision: one owner login can run **multiple businesses**. Outlets/branches stay post-MVP but schema-ready. See PRD §4 (Merchant) + Technical Doc §4.7.

- [x] Migration `20260607150000_multi_business_ownership.sql` in repo
- [x] Apply to cloud → `pnpm exec supabase db push`
- [x] Regenerate types → `pnpm supabase:types` into `packages/supabase/src/types.ts` (adds `current_merchant_ids`)
- [x] Merchant queries return a **list** of owned businesses (`getMerchantsByUserId`)
- [x] Business switcher + "add another business" at `/merchant/add-business`

---

## A. Shared auth infrastructure

- [x] Per-app `proxy.ts` + `@repo/supabase/proxy` — refresh Supabase session (merchant + admin)
- [x] Shared route-guard pattern (layout checks)
- [x] Zustand `authStore` scaffold per app (`session`, `role`, `isLoading`)
- [x] `packages/supabase/src/queries/` — reusable DB helpers (`merchants`, `customers`)
- [x] No magic-link redirect URLs required for merchant auth

---

## B. Admin — login (`apps/admin` · `:3002`)

**One-time setup (Supabase dashboard):**

- [ ] Create admin user: Auth → Users → Add user (email + password)
- [ ] Set `app_metadata.role = 'admin'` on that user (optional; admin uses service role for writes)

**Build:**

- [x] Route: `/admin/login` — email + password form (react-hook-form + zod)
- [x] `signInWithPassword` via `@repo/supabase/server` or client
- [x] Redirect authenticated admin → `/admin/merchants`
- [x] Logout action
- [x] `authStore` wired in admin layout

**Exit:** Log in at `localhost:3002/admin/login`.

---

## C. Admin — minimal merchant approval (`apps/admin`)

> Pulled forward from Day 6 — **only** what unblocks merchant testing on Days 3–4.

- [x] Route: `/admin/merchants` — merchant list with pending filter
- [x] Approve action (service role):
  - Set `status = 'active'`, `approved_at`, `approved_by`
  - Insert `audit_log` row (`approve_merchant`)
- [x] Reject action (service role):
  - Set `status = 'rejected'`, `rejection_reason`
  - Insert `audit_log` row
- [x] Empty state when no merchants match filter

**Exit:** Pending merchant → approve → merchant can access dashboard on Day 3.

---

## D. Merchant — auth & registration (`apps/merchant` · `:3001`)

- [x] Route: `/merchant/login` — email + password (`signInWithPassword`), sign-up tab (email + password + confirm only)
- [x] Route: `/merchant/register` — redirects to sign-up tab on login
- [x] Route: `/merchant/add-business` — business form (`business_name`, `category`, `country`, optional `phone`); creates `merchants` row with `status = 'pending'`
- [x] Status handling on dashboard — pending / active / rejected / suspended via `MerchantStatusPanel`
- [x] Route guards:
  - Not logged in → `/merchant/login`
  - Logged in, no merchant row → `/merchant/add-business`
  - `status = 'active'` → full dashboard access (card config on Day 3)
- [x] Dashboard stub at `/merchant/dashboard` — placeholder until Day 4 stamp queue
- [x] `authStore` + merchant profile query (`merchants` by `user_id`)

> **Note:** `/merchant/pending` may redirect to dashboard with status panel instead of a standalone screen — acceptable for MVP.

**Exit:** Register → pending → admin approves → land on dashboard stub.

---

## E. Day 2 verification (exit criteria)

### Manual E2E test (merchant + admin only)

1. [ ] Merchant signs up → adds business → sees **pending** status
2. [ ] Admin logs in → approves merchant
3. [ ] Merchant refreshes → reaches **dashboard stub** with **active** status
4. [ ] Merchant logout works
5. [ ] Admin logout works

### Commands (repo root)

```sh
pnpm exec turbo lint
pnpm exec turbo check-types
pnpm exec turbo build
pnpm exec turbo dev --filter=admin     # :3002
pnpm exec turbo dev --filter=merchant  # :3001
```

- [ ] No secrets in git
- [x] Update Technical Doc **Implementation Status**
- [ ] Git commit: _"Day 2: Admin + merchant auth and approval"_

---

## Routes — Day 2 scope

### Merchant (`apps/merchant`)

| Route                    | Purpose                              |
| ------------------------ | ------------------------------------ |
| `/merchant/login`        | Email + password (sign in / sign up) |
| `/merchant/register`     | Redirect to sign-up tab              |
| `/merchant/add-business` | First business or add another        |
| `/merchant/dashboard`    | Stub + account status panel          |

### Admin (`apps/admin`)

| Route              | Purpose                          |
| ------------------ | -------------------------------- |
| `/admin/login`     | Email + password                 |
| `/admin/merchants` | Approve / reject / suspend queue |

---

## Agent session starter

> _"You are building YORewards Day 2. Follow `resources/Day2_Checklist.md` and PRD §5. Use `@repo/supabase`, `@repo/utils`, `@repo/ui`. Merchant auth = email + password (no magic link). Admin = email + password. Start with section A, then B."_

---

_Day 2 complete → start Day 3: Merchant Card System (stamp rules, reward types, offers, QR)._
