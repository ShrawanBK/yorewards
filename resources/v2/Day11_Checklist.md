# YORewards — V2 Day 11 (Full i18n: English · Nepali · Finnish)

> **Goal:** Every critical path is fully translated in **en / ne / fi**. Flipping the locale never shows raw keys or English leakage on core flows. A half-translated app reads as broken — this closes that.
> **Reference:** [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0.2 · `.cursor/rules/yorewards-requirements.mdc` (i18n mandatory) · [`V2_Backlog.md`](V2_Backlog.md) (ne/fi)
> **Prerequisite:** [`Day10_Checklist.md`](Day10_Checklist.md) — new notification + OTP keys exist in `en.json`

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Key parity check (en = ne = fi) | ⏳ |
| Customer app ne/fi coverage | ⏳ |
| Merchant app ne/fi coverage | ⏳ |
| Admin app ne/fi coverage | ⏳ |
| Locale persistence + QA | ⏳ |

> **Baseline:** `en.json` is the source of truth (~356 keys customer). `ne.json` / `fi.json` are ~20% today — this day brings them to full coverage on critical paths.

---

## Day 11 "done" when

- [ ] `ne.json` and `fi.json` have **every key** present in `en.json` for critical namespaces (no missing keys)
- [ ] Critical paths reviewed in all three locales: auth, scan/stamp, wallet, card detail, disputes, merchant queue, billing, notifications, errors
- [ ] Locale choice **persists** across navigation and app reloads (cookie) in all 3 apps
- [ ] No raw `namespace.key` strings visible; no hardcoded English in components

## A. Tooling — key parity

- [ ] Add a coverage check: script/test comparing keys of `ne.json` / `fi.json` against `en.json` per app; fails on missing keys
- [ ] Wire into `pnpm check-types` or a `pnpm i18n:check` script so drift is caught in CI
- [ ] List all missing keys per locale as the work queue

## B. Translate — critical namespaces (per app)

Fill **ne** + **fi** for (customer / merchant / admin as applicable):

- [ ] `auth`, `acceptInvite`, `nav`, `a11y`
- [ ] `scan`, `card`, `wallet`, `reward`, `insights`
- [ ] `dispute` (+ status/outcomes), `notifications` (Day 9 keys)
- [ ] Merchant: `queue`/stamp approval, `customers`, `loyaltyCard`, `billing`, `settings`, staff/invite
- [ ] Admin: disputes centre, verification queue, merchant detail, dashboard
- [ ] `errors.actions.*` (incl. Day 10 OTP/verification codes) in all locales
- [ ] Interpolations (`{customer}`, `{amount}`, `{branch}`) preserved; currency/date via `useFormatter` (locale-aware)

## C. Nepali + Finnish quality

- [ ] Native/near-native review pass (not raw machine output) for customer-facing copy
- [ ] Finnish: correct currency + number formatting; keep EUR groundwork (pricing stays NPR in V2 — full EUR is V3)
- [ ] Nepali: Devanagari renders correctly; no truncation in buttons/badges

## D. Locale persistence & switcher

- [ ] Switcher (customer profile + merchant/admin settings) writes locale cookie; middleware honours it
- [ ] Default locale + fallback chain sane (missing key → en, logged in dev)
- [ ] Consider: hide `fi` in NP-only launch, or keep all three — decide and document

## E. QA

- [ ] Flip each locale, walk every critical path — screenshot spot-check
- [ ] Parity check passes (0 missing keys) for all 3 apps
- [ ] `pnpm lint` · `pnpm check-types` · `pnpm build` green

---

_Previous: [`Day10_Checklist.md`](Day10_Checklist.md) · Next: [`Day12_Checklist.md`](Day12_Checklist.md) · Sprint index: [`README.md`](README.md)_
