# YORewards — Day 3 Checklist (Branches, Business Hub & Loyalty Card)

> **Goal:** One business can have multiple branches (shared loyalty card), the merchant **business hub** is polished and easy to use, and **PRD §6.1** loyalty card configuration is live with QR per branch.  
> **Reference:** PRD §6.1, §6.3, §8 · Technical Doc §4.7, §6  
> **Prerequisite:** Day 2 complete — merchant auth, admin approval, multi-business switcher, `current_merchant_ids()` RLS

---

## Implementation status (June 2026)

| Area                                                          | Status                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| Phase A — DB + queries + QR payload                           | ✅ Done                                                     |
| Phase B — Business hub + branches UI                          | ✅ Done (loading skeletons deferred)                        |
| Phase C — Loyalty card config (`/merchant/loyalty-card`)      | ✅ Done (server-side validation; Zod-in-component deferred) |
| Phase D — Automated verify                                    | ✅ Done (`lint`, `check-types`, `build` pass)               |
| Phase E — Merchant UI polish (dark theme, sidebar, dashboard) | ✅ Done                                                     |
| Phase D — Manual E2E + RLS smoke                              | ⏳ Your turn                                                |
| Day 3 git commit                                              | ⏳ When you ask                                             |

**Code complete ~98%.** Remaining: manual browser test, optional RLS smoke test, commit.

---

## Scope change (read once)

| Concept             | What it is                               | Table / UI                                                                    |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **Owner**           | Person who logs in                       | `auth.users`                                                                  |
| **Business**        | Brand with its own card + approval queue | `merchants` row — switcher picks **active business**                          |
| **Branch / outlet** | Physical location of one business        | `merchant_locations` — **shared** `loyalty_cards` balance across all branches |

**Invariant:** Never register a branch as its own `merchants` row. Stamps from any branch count toward the same `customer_cards` row; redemption is business-scoped, not branch-scoped. `location_id` on events is **attribution only** (analytics + per-counter QR).

---

## Build order (dependency chain)

```text
1. DB migration (merchant_locations + location_id on events + backfill)     ✅
      ↓
2. @repo/supabase queries + types regen                                   ✅
      ↓
3. Business hub UI (list → detail → branches panel)                       ✅
      ↓
4. PRD §6.1 — loyalty card config + live preview (/merchant/loyalty-card) ✅
      ↓
5. Per-branch QR generation + PNG download                                ✅
      ↓
6. Lint / types / manual E2E smoke test                                   ⏳ automated ✅ · manual pending
```

---

## Phase A — Database & backend

### A1. Migration `merchant_locations`

- [x] Apply `supabase/migrations/20260611120000_merchant_locations.sql`
- [x] Table `merchant_locations`: `id`, `merchant_id`, `name`, `address`, `city`, `is_primary`, `is_active`, timestamps
- [x] Nullable `location_id` on `stamp_sessions` and `redemptions` (FK → `merchant_locations`, `ON DELETE SET NULL`)
- [x] Backfill: one **primary** location per existing merchant (`name` = business name or `"Main location"`)
- [x] RLS: owner CRUD where `merchant_id IN (SELECT current_merchant_ids())`
- [x] Partial unique index: at most one `is_primary = true` per `merchant_id`
- [x] Run `pnpm exec supabase db push` then `pnpm supabase:types` (cloud-linked — **no Docker**)
- [x] Merge `types.generated.ts` into `packages/supabase/src/types.ts` (strict unions preserved)

### A2. Query layer (`@repo/supabase`)

- [x] `getLocationsByMerchantId(merchantId)` — `packages/supabase/src/queries/locations.ts`
- [x] `createMerchantLocation(...)`, `updateMerchantLocation(...)`, `setPrimaryLocation(...)`
- [x] `deactivateMerchantLocation(...)` — soft via `is_active` (no hard delete if events reference it)
- [x] `getLoyaltyCardByMerchantId`, `upsertLoyaltyCardForMerchant` — `packages/supabase/src/queries/loyalty-cards.ts`
- [x] Server actions — `features/business/api/locationActions.ts` + `features/loyalty-card/api/loyaltyCardActions.ts`
- [x] Default primary branch on new business — `createDefaultLocationForMerchant` in `addBusinessAction`

### A3. QR payload (design lock)

- [x] QR encodes: `loyalty_card_id` (`c`) + `location_id` (`l`) + `merchant_id` (`m`) — `buildLoyaltyCardQrUrl`
- [x] All branch QRs resolve to the **same** loyalty card; stamp session will store `location_id` on scan (Day 5)
- [x] Document payload format in Technical Doc §7.1 (`/scan?m=…&c=…&l=…`)

---

## Phase B — Business hub UI (professional & easy)

> FDA: `features/business` + `widgets/MerchantShell` / `MerchantProtectedShell`.

### B1. Navigation & layout

- [x] Merchant nav: **Dashboard** | **Business** | **Loyalty card** | **Settings** stub — `widgets/MerchantShell`
- [x] Route: `/merchant/business` — business hub (list + detail + branches)
- [x] Active business cookie/context unchanged; all branch ops scoped to active `merchant_id`

### B2. Business list (switcher upgrade)

- [x] Card-based list: logo/initial, name, category, status badge, branch count — `MerchantBusinessHub`
- [x] Filters: All / Active / Inactive
- [x] Primary action: **Add business** → `/merchant/add-business`
- [x] Empty state
- [ ] Loading skeletons (deferred — uses instant server render today)

### B3. Business detail panel

- [x] Selected business: full profile — `MerchantBusinessDetailCard` in Overview tab
- [x] Sections: Overview | Branches | Loyalty card summary (link to `/merchant/loyalty-card`)
- [x] Status, rejection reason, dates, contact, brand color
- [x] Mobile: stack layout; desktop: master–detail (`lg:grid-cols-[340px_1fr]`)

### B4. Branches management

- [x] Branch list: name, address/city, primary badge, active/inactive — `BranchList`
- [x] **Add branch** dialog — `BranchFormDialog`
- [x] **Edit branch** — same dialog
- [x] **Set as primary** — `setPrimaryBranchAction` + DB partial unique index
- [x] Deactivate branch (confirm dialog) — hidden from loyalty-card QR list
- [x] Cannot deactivate last active branch; primary auto-reassigned before deactivate
- [x] i18n: `branches.*` in `messages/en.json`

### B5. UX polish

- [x] `@repo/ui`: `Card`, `Badge`, `Button`, `Dialog`, `Tabs`, `Field`, `Input`
- [ ] `@repo/ui` `Sheet` / `Empty` primitives (used Dialog + inline empty states instead)
- [x] Empty and error states on branch list and forms
- [x] `useFormatter()` for dates in `MerchantBusinessDetailCard`
- [x] Phone display unchanged (NP/FI validation from Day 2)

---

## Phase C — PRD §6.1 Loyalty Card Configuration

Route: `/merchant/loyalty-card` (read-only preview when `merchant.status !== 'active'`).

### C1. Card identity

- [x] Logo upload — JPG/PNG, max 2MB → `browser-image-compression` → Supabase `merchant-logos` bucket
- [x] Primary brand color — preset palette + custom hex (`merchants.primary_color`)
- [x] Card name — max 40 chars (`loyalty_cards.card_name`)
- [x] Card description — max 120 chars
- [x] **Live card preview** — `LoyaltyCardPreview` (reusable for customer app later)

### C2. Stamp rules

- [x] Stamp target — integer 5–50 (`loyalty_cards.stamp_target`)
- [x] Minimum spend — optional, `0` = none (`min_spend` + `min_spend_currency` NPR/EUR)
- [x] Preview shows customer-facing min spend line when set

### C3. Reward types (all three)

| Type           | DB `reward_type`   | Config fields                                     |
| -------------- | ------------------ | ------------------------------------------------- |
| Free item      | `free_item`        | Item name → `reward_value` + `reward_description` |
| % discount     | `percent_discount` | Percent + scope text                              |
| Fixed discount | `fixed_discount`   | Amount in NPR or EUR                              |

- [x] Reward type toggle with conditional fields — `LoyaltyCardConfigForm`
- [ ] Zod schemas inside component with `useTranslations` for errors (validation in `saveLoyaltyCardConfigAction` for now)
- [x] Save creates/updates single `loyalty_cards` row per business (`upsertLoyaltyCardForMerchant`)

### C4. QR code (per branch)

- [x] QR section lists **each active branch** after card exists — `LoyaltyCardBranchQrDownloads`
- [x] Static QR per branch (`qrcode.react` / `QRCodeCanvas`) — `loyalty_card_id` + `location_id`
- [x] Download PNG per branch
- [x] Copy explains one card, many counters (`loyaltyCard.qr.subtitle`)

### C5. API / server

- [x] Server actions — `saveLoyaltyCardConfigAction`, `uploadLoyaltyCardLogoAction` (ownership check)
- [x] Auto-create `loyalty_cards` row on first save if missing
- [x] Block save when `status !== 'active'`; read-only preview + `readOnlyNotice` banner

---

## Phase D — Verification

### D1. Automated

- [x] `pnpm exec turbo lint --filter=merchant` — pass
- [x] `pnpm exec turbo check-types --filter=merchant` — pass
- [x] `pnpm exec turbo build --filter=merchant` — pass

### D2. Manual E2E (merchant)

- [ ] Log in as owner with **two businesses** — switcher still works
- [ ] Open **Business** hub — list looks correct; select business A
- [ ] Add 2 branches; set one primary; deactivate one — list updates
- [ ] Go to **Loyalty card** — configure logo, colors, stamp rules, reward type — preview updates live
- [ ] Download QR for each active branch — PNG opens
- [ ] (Optional — Day 5) Scan branch QR — `stamp_sessions.location_id` populated

### D3. RLS smoke test

- [ ] Owner A cannot read/write Owner B's `merchant_locations`
- [ ] Anon/authenticated customer cannot insert locations
- [ ] `location_id` on stamp insert must belong to same `merchant_id` as session (app validation on Day 5 scan flow)

---

## Files delivered

```text
supabase/migrations/20260611120000_merchant_locations.sql
packages/supabase/src/queries/locations.ts
packages/supabase/src/queries/loyalty-cards.ts
apps/merchant/src/features/business/
  components/MerchantBusinessHub.tsx
  components/BranchList.tsx
  components/BranchFormDialog.tsx
  api/locationActions.ts
apps/merchant/src/features/loyalty-card/
  components/LoyaltyCardPageView.tsx
  components/LoyaltyCardConfigForm.tsx
  components/LoyaltyCardPreview.tsx
  components/LoyaltyCardBranchQrDownloads.tsx
  api/loyaltyCardActions.ts
  utils/loyaltyCardQr.ts
apps/merchant/src/widgets/MerchantShell/
apps/merchant/src/widgets/MerchantProtectedShell/
apps/merchant/src/shared/ui/PageHeader.tsx
apps/merchant/src/app/globals.css                              # dark tokens + mesh/glass utilities
apps/merchant/src/app/layout.tsx                               # Plus Jakarta + dark html
design-system/merchant/MASTER.md
.cursor/rules/merchant-ui.mdc
packages/ui/src/components/ui/skeleton.tsx
apps/merchant/src/app/merchant/(protected)/business/page.tsx
apps/merchant/src/app/merchant/(protected)/loyalty-card/page.tsx
apps/merchant/src/app/merchant/(protected)/settings/page.tsx   # stub
apps/merchant/messages/en.json                                  # business.*, branches.*, loyaltyCard.*
packages/ui/src/components/ui/dialog.tsx                        # added for branch forms
```

---

## Phase E — Merchant UI polish

- [x] Dark theme default (`dark` on `<html>`) + OLED-inspired tokens in `apps/merchant/src/app/globals.css`
- [x] Plus Jakarta Sans typography (`apps/merchant/src/app/layout.tsx`)
- [x] Sidebar shell on desktop + mobile drawer (`MerchantShell`)
- [x] Dashboard redesign — stats, quick actions, status panel (`MerchantDashboard`)
- [x] `PageHeader` shared component; business / loyalty-card / settings pages updated
- [x] `merchant-glass-card` / `merchant-mesh-bg` surface utilities
- [x] Auth layout right panel aligned with dark theme
- [x] `@repo/ui/skeleton` export (for future loading states)
- [x] Design system doc — `design-system/merchant/MASTER.md`
- [x] Cursor rule — `.cursor/rules/merchant-ui.mdc`
- [x] WCAG contrast pass — dark tokens, `merchant-body-muted`, `merchant-stat-label`, pending amber badge, visible quick-action links
- [x] Cursor rule `.cursor/rules/accessibility.mdc` (project-wide)
- [ ] Framer Motion page transitions (PRD §1.4) — deferred
- [ ] Loading skeletons on hub / loyalty-card — deferred
- [ ] Full `web-design-guidelines` audit on all merchant routes — incremental

---

## Agent skills (Day 3)

| Skill                              | Purpose                        |
| ---------------------------------- | ------------------------------ |
| `supabase`                         | Migrations, RLS, Storage       |
| `supabase-postgres-best-practices` | Indexes, FK patterns           |
| `shadcn`                           | Hub layout, forms, dialogs     |
| `ui-ux-pro-max`                    | Dark dashboard design system   |
| `vercel-react-best-practices`      | Server actions, forms          |
| `web-design-guidelines`            | Master–detail UX, a11y         |
| `merchant-ui` (cursor rule)        | Ongoing merchant UI guardrails |

---

## Out of scope for Day 3 (Day 4+)

- Stamp approval queue (Realtime) — **Day 4**
- Redemption code entry — **Day 4**
- Customer wallet / scanner — **Day 5**
- Per-branch analytics charts — **Day 4 stub** or Day 6
- Multi-staff per branch — v2 (`merchant_staff`)

---

## Done when

- [x] Migration applied; types regenerated
- [x] Business hub + branches CRUD polished and i18n-complete
- [x] `/merchant/loyalty-card` satisfies PRD §6.1 (identity, rules, 3 reward types, preview, branch QR PNG)
- [x] Technical Doc + PRD updated for branch-in-MVP scope
- [x] Lint, types, build pass for `merchant`
- [ ] Manual E2E smoke test (D2)
- [ ] Day 3 git commit (when you ask)

---

_Previous: [`Day2_Checklist.md`](Day2_Checklist.md) · Next: [`Day4_Checklist.md`](Day4_Checklist.md) — stamp queue + redemption + analytics_
