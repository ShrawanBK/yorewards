# YORewards — Day 1 Checklist (Foundation)

> **Goal:** End Day 1 with a deployable monorepo skeleton — database live with RLS, shared packages wired, UI scaffold ready for Day 2 auth.  
> **Reference:** PRD §11 · Technical Doc §4, §8, §10  
> **Schema rule:** 8 tables via migrations only — additive changes from here on (Technical Doc §4.5).

---

## Already done ✅

- [x] Turborepo + pnpm workspace
- [x] Three Next.js apps (`customer` :3000, `merchant` :3001, `admin` :3002)
- [x] `@repo/eslint-config`, `@repo/typescript-config`, `@repo/tailwind-config`
- [x] Brand colors in `@repo/tailwind-config`
- [x] `@repo/ui` — shadcn components (`button`, `input`, `label`, `card`, `badge`, `sonner`)
- [x] Supabase project created (EU West / Frankfurt)

---

## A. Supabase CLI & repo link

> **Use Option 1** — installs the CLI as a root dev dependency so `supabase: command not found` never happens. Always prefix commands with `pnpm exec supabase` (not bare `supabase`).

### Option 1 — Project dev dependency (recommended)

From repo root:

```sh
pnpm add -D supabase -w
pnpm exec supabase --version
```

Then run all Supabase CLI commands via `pnpm exec`:

- [ ] Install CLI: `pnpm add -D supabase -w` → verify with `pnpm exec supabase --version`
- [ ] Log in: `pnpm exec supabase login` (opens browser)
- [ ] Init repo: `pnpm exec supabase init` → creates `supabase/config.toml`
- [ ] Link cloud project: `pnpm exec supabase link --project-ref <YOUR_PROJECT_REF>`
  - Project ref: Supabase dashboard → **Project Settings** → **General** → **Reference ID**
- [ ] Confirm region is **EU West (Frankfurt)** in Supabase dashboard (GDPR)
- [ ] Enable **Realtime** on `stamp_sessions` table (after migration — needed Day 4, safe to enable Day 1)

> **Note:** Docker is **not** required for cloud-only workflow (`link` + `db push`). Docker is only needed if you run local Supabase (`pnpm exec supabase start`).

### Option 2 — One-off (fallback only)

```sh
pnpm dlx supabase --version
pnpm dlx supabase init
```

Use when you cannot add the dev dependency yet; prefer Option 1 for a pinned version in root `package.json`.

---

## B. Database — 8 tables + forward-compatible columns

Create migrations in `supabase/migrations/` (see `README.md` — one concern per file):

| File                                     | Contents                |
| ---------------------------------------- | ----------------------- |
| `20260607120000_extensions.sql`          | Postgres extensions     |
| `20260607120001_tables.sql`              | 8 core tables + indexes |
| `20260607120002_functions.sql`           | Business RPCs           |
| `20260607120003_realtime_and_grants.sql` | Realtime + role grants  |

| #   | Table            | Purpose                                                              |
| --- | ---------------- | -------------------------------------------------------------------- |
| 1   | `customers`      | Phone identity — incl. `status`, `deleted_at`                        |
| 2   | `merchants`      | Business profile — incl. `rejection_reason`, status incl. `rejected` |
| 3   | `loyalty_cards`  | Card config + reward rules                                           |
| 4   | `customer_cards` | Wallet row — stamp count, reward status                              |
| 5   | `stamp_sessions` | QR scan → pending → approve/reject                                   |
| 6   | `redemptions`    | OTP-verified claim codes                                             |
| 7   | `audit_log`      | Admin actions                                                        |
| 8   | `otp_tokens`     | Hashed redemption OTPs (server-only)                                 |

- [x] All primary keys = `uuid` with `gen_random_uuid()` default
- [x] Foreign keys with `ON DELETE` strategy documented (restrict vs cascade)
- [x] Indexes on: `customers.phone`, `stamp_sessions.merchant_id` + `status`, `customer_cards.customer_id`, `merchants.user_id`
- [x] `increment_stamps` RPC function (atomic stamp increment — Technical Doc §7.3)
- [x] `void_stamp`, `issue_stamp_manual`, `complete_redemption` RPCs (Technical Doc §4.6)
- [x] Stamp audit via `stamp_sessions` (`source`, `voided` status) — no separate events table
- [x] Analytics counters: `targets_reached`, `cycle_number` on `customer_cards`
- [x] Realtime publication includes `stamp_sessions`
- [x] Push migration: `pnpm exec supabase db push`
- [ ] Verify all 8 tables visible in Supabase Table Editor

---

## C. Row Level Security (before any app queries)

Migration: `supabase/migrations/20260607130000_rls_policies.sql`

- [x] `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on **every** table
- [x] Helper functions: `current_customer_id()`, `current_merchant_id()`
- [x] `customers` — own record only; filter `deleted_at IS NULL`
- [x] `merchants` — own record + active merchant read for wallet/QR
- [x] `loyalty_cards` — read: active cards public; write: owning merchant
- [x] `customer_cards` — customer reads own; merchant reads/updates their `merchant_id`
- [x] `stamp_sessions` — customer own sessions; merchant their queue
- [x] `redemptions` — customer own; merchant read/update (insert via service role)
- [x] `audit_log` — no client policies (service role only)
- [x] `otp_tokens` — no client policies (service role only)
- [x] Push: `pnpm exec supabase db push`
- [ ] Smoke-test: anon key cannot read another user's `customer_cards`

> **Day 2 auth note:** Customer JWT must include `app_metadata.customer_id` (see Technical Doc §4.2). Phone login lookup uses a **service-role API route** (anon cannot SELECT by phone).

---

## D. Supabase Storage

Migration: `supabase/migrations/20260607140000_storage_merchant_logos.sql`

- [x] Create bucket `merchant-logos` (public read, authenticated upload)
- [x] Storage RLS: merchants upload to their own folder (`{merchant_id}/…`)
- [x] Max file size policy aligned with PRD (2MB upload, compress to ~500KB in app)
- [x] Push: `pnpm exec supabase db push`

---

## E. Shared packages

### `@repo/supabase`

- [x] Create `packages/supabase/` with `package.json`, `tsconfig.json`
- [x] `src/client.ts` — browser client (anon key)
- [x] `src/server.ts` — server client (cookies)
- [x] `src/service-role.ts` — admin / OTP routes (service role)
- [x] Generate types: `packages/supabase/src/types.ts`
- [x] Export clients + `Database` type via package exports
- [x] Add workspace dep to all 3 apps

### `@repo/utils`

- [x] Create `packages/utils/` with `package.json`, `tsconfig.json`
- [x] `src/phone.ts` — `normalisePhone()`, `detectCountry()` (+977 / +358)
- [x] `src/currency.ts` — `formatNPR()`, `formatEUR()`
- [x] `src/otp.ts` — `generateSixDigitOTP()` stub (full impl Day 5)

---

## F. shadcn/ui in `@repo/ui`

- [x] Init shadcn in `packages/ui` (shared components pattern for monorepo)
- [x] Add Day 1 essentials: `button`, `input`, `label`, `card`, `badge`, `toast`/`sonner`
- [x] Verify one app imports `@repo/ui` button with brand Tailwind classes
- [x] Confirm `tailwind.config.ts` in each app presets `@repo/tailwind-config`

---

## G. next-intl scaffold (all 3 apps)

- [x] Install `next-intl` in customer, merchant, admin
- [x] Add `messages/en.json` per app (minimal: app title, nav placeholders)
- [x] Wire `NextIntlClientProvider` + `i18n/request.ts` plugin (no middleware — en-only, Next 16 compatible)
- [x] Confirm `pnpm exec turbo dev --filter=customer` loads without i18n errors

---

## H. Environment variables

- [x] Create `.env.example` at repo root (document all vars — never commit real values)

Per-app `.env.local` (gitignored):

- [x] **Shared (all apps):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] **Customer:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MERCHANT_URL` (+ SMS vars can be placeholders until Day 5)
- [x] **Merchant:** `NEXT_PUBLIC_MERCHANT_URL`, `NEXT_PUBLIC_APP_URL`
- [x] **Admin:** `NEXT_PUBLIC_ADMIN_URL`, `ADMIN_EMAIL`

Set the same vars in **Vercel** for each project (deferred):

- [ ] Production env
- [ ] Preview env
- [x] Local `.env.local` tested — at least one app connects to Supabase

---

## I. Vercel deployments

- [ ] `customer` → `app.yorewards.com` (or Vercel default URL for now)
- [ ] `merchant` → `merchant.yorewards.com`
- [ ] `admin` → `admin.yorewards.com`
- [ ] Root directory / build settings correct per app (`apps/customer`, etc.)
- [ ] GitHub auto-deploy on push to main
- [ ] All 3 preview URLs load (default Next.js page is fine for Day 1)

---

## J. Day 1 verification (exit criteria)

Run from repo root:

```sh
pnpm install
pnpm exec turbo lint
pnpm exec turbo check-types
pnpm exec turbo build
pnpm exec turbo dev --filter=customer   # smoke test :3000
```

- [ ] `pnpm exec supabase db push` applies cleanly on a fresh clone
- [ ] Generated types committed in `packages/supabase/src/types.ts`
- [ ] No secrets in git (`git status` — no `.env.local` files staged)
- [ ] Technical Doc **Implementation Status** updated to reflect Day 1 complete
- [ ] Git commit: _"Day 1: Supabase schema + RLS, shared packages, shadcn, next-intl scaffold"_

---

## Suggested build order (single session)

1. **A** → link Supabase CLI
2. **B + C** → migrations (tables then RLS) → push → gen types
3. **D** → storage bucket
4. **E** → `@repo/supabase` + `@repo/utils`
5. **H** → `.env.example` + `.env.local` (unblocks package testing)
6. **F** → shadcn in `@repo/ui`
7. **G** → next-intl scaffold
8. **I** → Vercel env + deploy
9. **J** → lint / types / build / commit

---

## Not Day 1 (defer)

| Item                                   | When   |
| -------------------------------------- | ------ |
| Customer / merchant / admin auth flows | Day 2  |
| App routes beyond scaffold             | Day 2+ |
| Sparrow SMS / Twilio integration       | Day 5  |
| Realtime subscriptions                 | Day 4  |
| PWA (`next-pwa`)                       | Day 7  |

---

_Day 1 complete → start Day 2: [`Day2_Checklist.md`](Day2_Checklist.md) — Auth & onboarding._
