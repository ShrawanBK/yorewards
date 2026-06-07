# YORewards — Day 2 Checklist (Auth & Onboarding)

> **Goal:** All three roles can log in, routes are guarded, and admin can approve merchants — unblocks Days 3–5.  
> **Reference:** PRD §5, §8 · Technical Doc §4.2, §6, §3  
> **Prerequisite:** Day 1 complete (schema, RLS, `@repo/supabase`, shadcn, next-intl, `.env.local`)

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

| Role         | Method           | Session                       | RLS identity                       |
| ------------ | ---------------- | ----------------------------- | ---------------------------------- |
| **Admin**    | Email + password | Supabase Auth cookie          | Service role for writes            |
| **Merchant** | Magic link       | Supabase Auth cookie          | `current_merchant_ids()` (owner → many businesses) |
| **Customer** | Phone, no OTP    | Custom JWT / Supabase session | `app_metadata.customer_id`         |

> **Critical:** Customer phone lookup uses a **service-role API route** — anon cannot `SELECT` by phone (RLS).  
> See Technical Doc §4.2.

---

## Build order (dependency chain)

```text
A. Shared auth infra  →  B. Admin  →  C. Merchant approval  →  D. Merchant auth  →  E. Customer auth  →  F. Verify
```

---

## Schema addendum — Multi-business per owner

> Product decision: one owner login can run **multiple businesses**. Outlets/branches stay post-MVP but schema-ready. See PRD §4 (Merchant) + Technical Doc §4.7.

- [ ] Apply migration `20260607150000_multi_business_ownership.sql` → `pnpm exec supabase db push`
- [ ] Regenerate types after push → `supabase gen types` into `packages/supabase/src/types.ts` (adds `current_merchant_ids`)
- [ ] Merchant queries return a **list** of owned businesses (not `.single()` on `user_id`)
- [ ] (Deferred within MVP, after core auth) Business switcher + "add another business" in merchant app; default to the single business when only one exists

---

## A. Shared auth infrastructure

- [ ] `@repo/supabase/middleware` or per-app middleware — refresh Supabase session (merchant + admin)
- [ ] Shared route-guard pattern (middleware and/or layout checks)
- [ ] Zustand `authStore` scaffold per app (`session`, `role`, `isLoading`)
- [ ] `packages/supabase/src/queries/` — move reusable DB helpers here as built
- [ ] Confirm magic link redirect URLs in Supabase dashboard (Auth → URL config):
  - `http://localhost:3001/auth/callback`
  - Production: `https://merchant.yorewards.com/auth/callback`

---

## B. Admin — login (`apps/admin` · `:3002`)

**One-time setup (Supabase dashboard):**

- [ ] Create admin user: Auth → Users → Add user (email + password)
- [ ] Set `app_metadata.role = 'admin'` on that user (optional; admin uses service role for writes)

**Build:**

- [ ] Route: `/admin/login` — email + password form (react-hook-form + zod)
- [ ] `signInWithPassword` via `@repo/supabase/server` or client
- [ ] Redirect authenticated admin → `/admin/merchants` (or dashboard stub)
- [ ] Logout action
- [ ] `authStore` wired in admin layout

**Exit:** Log in at `localhost:3002/admin/login`.

---

## C. Admin — minimal merchant approval (`apps/admin`)

> Pulled forward from Day 6 — **only** what unblocks merchant testing on Day 3.

- [ ] Route: `/admin/merchants` — list merchants where `status = 'pending'`
- [ ] Approve action (service role):
  - Set `status = 'active'`, `approved_at`, `approved_by`
  - Insert `audit_log` row (`approve_merchant`)
- [ ] Reject action (service role):
  - Set `status = 'rejected'`, `rejection_reason`
  - Insert `audit_log` row
- [ ] Empty state when no pending merchants

**Exit:** Pending merchant → approve → merchant can access dashboard on Day 3.

---

## D. Merchant — auth & registration (`apps/merchant` · `:3001`)

- [ ] Route: `/merchant/login` — email → magic link (`signInWithOtp`)
- [ ] Route: `/merchant/auth/callback` — exchange code, set session
- [ ] Route: `/merchant/register` — business form:
  - `business_name`, `category`, `country` (NP/FI), `email`, optional `phone`
  - Creates Supabase Auth user (if new) + `merchants` row with `status = 'pending'`, `user_id = auth.uid()`
- [ ] Route: `/merchant/pending` — "Awaiting approval" screen
- [ ] Route guards:
  - Not logged in → `/merchant/login`
  - `status = 'pending'` → `/merchant/pending`
  - `status = 'rejected'` → show reason + support message
  - `status = 'active'` → `/merchant/dashboard` (stub OK)
- [ ] Dashboard stub at `/merchant/dashboard` — placeholder until Day 4 stamp queue
- [ ] `authStore` + merchant profile query (`merchants` by `user_id`)

**Exit:** Register → pending → admin approves → land on dashboard stub.

---

## E. Customer — phone auth & onboarding (`apps/customer` · `:3000`)

- [ ] API: `POST /api/auth/customer/login` (service role):
  - `normalisePhone()` from `@repo/utils/phone`
  - Lookup by phone; if exists → update `last_active_at`
  - If new → return `{ isNew: true }` (no row until onboarding)
  - Issue session with `customer_id` in JWT claims for RLS
- [ ] API: `POST /api/auth/customer/onboarding` — create `customers` row + set name + session
- [ ] Route: `/login` — phone entry form (+977 / +358 aware)
- [ ] Route: `/onboarding` — name entry (first-time only)
- [ ] Route: `/wallet` — **empty state stub** ("Scan your first QR" — full wallet Day 4)
- [ ] Route: `/profile` — phone, name, logout (minimal)
- [ ] Route guards:
  - `/` → `/wallet` if session, else `/login`
  - Protect `(main)/*` routes — redirect to login if no session
- [ ] `authStore` with `customerId`, `name`, `phone`
- [ ] Logout clears session cookie

**Exit:** Phone → name (if new) → empty wallet. Refresh keeps session.

---

## F. Day 2 verification (exit criteria)

### Manual E2E test

1. [ ] Merchant registers → sees **pending**
2. [ ] Admin logs in → approves merchant
3. [ ] Merchant refreshes → reaches **dashboard stub**
4. [ ] Customer enters phone → onboarding → **wallet stub**
5. [ ] Customer refresh → still logged in
6. [ ] Merchant logout / customer logout works

### Commands (repo root)

```sh
pnpm exec turbo lint
pnpm exec turbo check-types
pnpm exec turbo build
pnpm exec turbo dev --filter=admin     # :3002
pnpm exec turbo dev --filter=merchant # :3001
pnpm exec turbo dev --filter=customer  # :3000
```

- [ ] No secrets in git
- [ ] Update Technical Doc **Implementation Status**
- [ ] Git commit: _"Day 2: Auth flows + admin merchant approval"_

---

## Routes created today

### Customer (`apps/customer`)

| Route                           | Purpose                   |
| ------------------------------- | ------------------------- |
| `/login`                        | Phone entry               |
| `/onboarding`                   | Name (new users)          |
| `/wallet`                       | Empty stub                |
| `/profile`                      | Phone, name, logout       |
| `/api/auth/customer/login`      | Service-role phone lookup |
| `/api/auth/customer/onboarding` | Create customer + session |

### Merchant (`apps/merchant`)

| Route                     | Purpose               |
| ------------------------- | --------------------- |
| `/merchant/login`         | Magic link            |
| `/merchant/register`      | Business registration |
| `/merchant/auth/callback` | OAuth callback        |
| `/merchant/pending`       | Awaiting approval     |
| `/merchant/dashboard`     | Stub                  |

### Admin (`apps/admin`)

| Route              | Purpose                |
| ------------------ | ---------------------- |
| `/admin/login`     | Email + password       |
| `/admin/merchants` | Approve / reject queue |

---

## Not Day 2 (defer)

| Item                                      | When  |
| ----------------------------------------- | ----- |
| Loyalty card config, QR, logos            | Day 3 |
| QR scanner, stamp queue, wallet grid      | Day 4 |
| SMS OTP redemption                        | Day 5 |
| Full admin dashboard, analytics, audit UI | Day 6 |
| Customer phone OTP at signup              | v2    |

---

## Agent session starter

> _"You are building YORewards Day 2. Follow `resources/Day2_Checklist.md` and PRD §5. Use `@repo/supabase`, `@repo/utils`, `@repo/ui`. Customer login = service-role API + JWT with `customer_id`. Merchant/admin = Supabase Auth. Start with section A, then B."_

---

_Day 2 complete → start Day 3: Card System._
