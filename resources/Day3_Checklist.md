# YORewards — Day 3 Checklist (Branches, Business Hub & Loyalty Card)

> **Goal:** One business can have multiple branches (shared loyalty card), the merchant **business hub** is polished and easy to use, and **PRD §6.1** loyalty card configuration is live with QR per branch.  
> **Reference:** PRD §6.1, §6.3, §8 · Technical Doc §4.7, §6  
> **Prerequisite:** Day 2 complete — merchant auth, admin approval, multi-business switcher, `current_merchant_ids()` RLS

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
1. DB migration (merchant_locations + location_id on events + backfill)
      ↓
2. @repo/supabase queries + types regen
      ↓
3. Business hub UI (list → detail → branches panel)
      ↓
4. PRD §6.1 — loyalty card config + live preview (/merchant/card)
      ↓
5. Per-branch QR generation + PNG download
      ↓
6. Lint / types / manual E2E smoke test
```

---

## Phase A — Database & backend

### A1. Migration `merchant_locations`

- [ ] Apply `supabase/migrations/20260611120000_merchant_locations.sql`
- [ ] Table `merchant_locations`: `id`, `merchant_id`, `name`, `address`, `city`, `is_primary`, `is_active`, timestamps
- [ ] Nullable `location_id` on `stamp_sessions` and `redemptions` (FK → `merchant_locations`, `ON DELETE SET NULL`)
- [ ] Backfill: one **primary** location per existing merchant (`name` = business name or `"Main location"`)
- [ ] RLS: owner CRUD where `merchant_id IN (SELECT current_merchant_ids())`
- [ ] Partial unique index: at most one `is_primary = true` per `merchant_id`
- [ ] Run `pnpm exec supabase db push` then `pnpm supabase:types` (cloud-linked — **no Docker**)
- [ ] Merge `types.generated.ts` into `packages/supabase/src/types.ts` (strict unions preserved)

### A2. Query layer (`@repo/supabase`)

- [ ] `getLocationsByMerchantId(merchantId)`
- [ ] `createMerchantLocation(...)`, `updateMerchantLocation(...)`, `setPrimaryLocation(...)`
- [ ] `deactivateMerchantLocation(...)` — soft via `is_active` (no hard delete if events reference it)
- [ ] Server actions in `features/business/api/` (or new `features/branches/` if split)

### A3. QR payload (design lock)

- [ ] QR encodes: `loyalty_card_id` + `location_id` (and session token flow unchanged)
- [ ] All branch QRs resolve to the **same** loyalty card; stamp session stores `location_id` for analytics
- [ ] Document payload format in Technical Doc §6 (QR section)

---

## Phase B — Business hub UI (professional & easy)

> Replace the dashboard stub feel with a clear **Business** area. FDA: extend `features/business` or add `features/branches` + widget composition in `widgets/MerchantDashboard`.

### B1. Navigation & layout

- [ ] Merchant nav: **Dashboard** | **Business** | **Card** (Day 3) | Settings stub
- [ ] Route: `/merchant/business` — business hub (list + detail + branches)
- [ ] Active business cookie/context unchanged; all branch ops scoped to active `merchant_id`

### B2. Business list (switcher upgrade)

- [ ] Card-based list (not raw rows): logo/initial, name, category, status badge, branch count
- [ ] Filters: All / Active / Pending / Inactive
- [ ] Primary action: **Add business** → existing `/merchant/add-business`
- [ ] Empty state + loading skeletons

### B3. Business detail panel

- [ ] Selected business: full profile (reuse/enhance `MerchantBusinessDetailCard`)
- [ ] Sections: Overview | Branches | Card summary (link to `/merchant/card`)
- [ ] Status, rejection reason, dates, contact, brand color — consistent typography and spacing
- [ ] Mobile: stack layout; desktop: list left, detail right (master–detail)

### B4. Branches management

- [ ] Branch list under active business: name, address/city, primary badge, active/inactive
- [ ] **Add branch** dialog/sheet: name (required), address, city
- [ ] **Edit branch** — same fields
- [ ] **Set as primary** — moves primary flag (DB enforces one primary)
- [ ] Deactivate branch (confirm dialog) — `is_active = false`; hide from QR picker
- [ ] Cannot delete last branch; primary cannot be deactivated without picking another primary
- [ ] i18n: all labels, validation, `aria-label`s in `messages/en.json`

### B5. UX polish

- [ ] Use `@repo/ui` primitives (`Card`, `Badge`, `Button`, `Dialog`, `Sheet`, `Empty`)
- [ ] Consistent empty/loading/error states
- [ ] `useFormatter()` for dates (no hydration mismatch)
- [ ] Phone display unchanged (NP/FI validation from Day 2)

---

## Phase C — PRD §6.1 Loyalty Card Configuration

Route: `/merchant/card` (active business must be selected; guard if no business or not `active`).

### C1. Card identity

- [ ] Logo upload — JPG/PNG, max 2MB → `browser-image-compression` before Supabase Storage (`merchant-logos` bucket)
- [ ] Primary brand color — preset palette + custom hex (`merchants.primary_color` or card-level if split)
- [ ] Card name — max 40 chars (`loyalty_cards.card_name`)
- [ ] Card description — max 120 chars, shown to customer
- [ ] **Live card preview** — updates in real time (shared `LoyaltyCard` renderer component for merchant + customer later)

### C2. Stamp rules

- [ ] Stamp target — integer 5–50 (`loyalty_cards.stamp_target`)
- [ ] Minimum spend — optional, `0` = none (`min_spend` + `min_spend_currency` NPR/EUR from merchant country)
- [ ] Preview shows customer-facing min spend line when set

### C3. Reward types (all three)

| Type           | DB `reward_type`   | Config fields                                     |
| -------------- | ------------------ | ------------------------------------------------- |
| Free item      | `free_item`        | Item name → `reward_value` + `reward_description` |
| % discount     | `percent_discount` | Percent + scope text                              |
| Fixed discount | `fixed_discount`   | Amount in NPR or EUR                              |

- [ ] Radio/select reward type with conditional fields
- [ ] Zod schemas inside component with `useTranslations` for errors
- [ ] Save creates/updates single active `loyalty_cards` row per business (MVP: one card per merchant)

### C4. QR code (per branch)

- [ ] After card exists: QR section lists **each active branch**
- [ ] Generate static QR per branch (`qrcode.react`) — payload includes `loyalty_card_id` + `location_id`
- [ ] Download PNG per branch for counter display
- [ ] Copy: explain one card, many counters; stamps aggregate across branches

### C5. API / server

- [ ] Server actions or route handlers for card CRUD (authenticated + `merchant_id` ownership check)
- [ ] Auto-create default `loyalty_cards` row on first save if missing
- [ ] Block card publish if business `status !== 'active'` (pending merchants see read-only preview + message)

---

## Phase D — Verification

### D1. Automated

```bash
pnpm exec turbo lint --filter=merchant
pnpm exec turbo check-types --filter=merchant
pnpm exec turbo build --filter=merchant
```

### D2. Manual E2E (merchant)

1. Log in as owner with **two businesses** — switcher still works
2. Open **Business** hub — list looks correct; select business A
3. Add 2 branches; set one primary; deactivate one — list updates
4. Go to **Card** — configure logo, colors, stamp rules, reward type — preview updates live
5. Download QR for each active branch — PNG opens
6. (Optional if Day 4 queue ready) Scan branch QR — `stamp_sessions.location_id` populated

### D3. RLS smoke test

- [ ] Owner A cannot read/write Owner B's `merchant_locations`
- [ ] Anon/authenticated customer cannot insert locations
- [ ] `location_id` on stamp insert must belong to same `merchant_id` as session (add CHECK or app validation)

---

## Files & folders (expected)

```text
supabase/migrations/20260611120000_merchant_locations.sql
packages/supabase/src/queries/locations.ts          # new
apps/merchant/src/features/business/                # hub UI + actions
  components/MerchantBusinessHub.tsx                # or split list/detail/branches
  components/BranchList.tsx
  components/AddBranchForm.tsx
apps/merchant/src/features/card/                    # new feature
  components/CardConfigForm.tsx
  components/CardPreview.tsx
  components/BranchQrDownloads.tsx
  api/cardActions.ts
apps/merchant/src/app/merchant/business/page.tsx
apps/merchant/src/app/merchant/card/page.tsx
apps/merchant/messages/en.json                      # business.*, branches.*, card.*
```

---

## Agent skills (Day 3)

| Skill                              | Purpose                    |
| ---------------------------------- | -------------------------- |
| `supabase`                         | Migrations, RLS, Storage   |
| `supabase-postgres-best-practices` | Indexes, FK patterns       |
| `shadcn`                           | Hub layout, forms, dialogs |
| `vercel-react-best-practices`      | Server actions, forms      |
| `web-design-guidelines`            | Master–detail UX, a11y     |

---

## Out of scope for Day 3 (Day 4+)

- Stamp approval queue (Realtime) — **Day 4**
- Redemption code entry — **Day 4**
- Customer wallet / scanner — **Day 5**
- Per-branch analytics charts — **Day 4 stub** or Day 6
- Multi-staff per branch — v2 (`merchant_staff`)

---

## Done when

- [ ] Migration applied; types regenerated
- [ ] Business hub + branches CRUD polished and i18n-complete
- [ ] `/merchant/card` satisfies PRD §6.1 (identity, rules, 3 reward types, preview, branch QR PNG)
- [ ] Technical Doc + PRD updated for branch-in-MVP scope
- [ ] Lint, types, build pass for `merchant`
- [ ] Day 3 git commit (when you ask)

---

_Previous: [`Day2_Checklist.md`](Day2_Checklist.md) · Next: Day 4 — stamp queue + redemption_
