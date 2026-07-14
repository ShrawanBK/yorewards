# YORewards — V2 Day 7 (Admin V2 + i18n + Hardening)

> **Goal:** Platform ops for V2; locale shells; green CI; sprint sign-off.  
> **Reference:** V2 PRD §7 · [`V2_Backlog.md`](../V2_Backlog.md) (ne/fi)  
> **Prerequisite:** [`Day6_Checklist.md`](Day6_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Admin verification + disputes | ✅ |
| ne/fi locales | ✅ |
| Lint / types / build | ✅ |
| Sprint sign-off | ⏳ |

---

## Sprint “done” when

- [x] Admin: verification queue, dispute centre, tier adjust, MRR stub on dashboard
- [x] `messages/ne.json` + `messages/fi.json` for auth, stamp flow, errors, nav
- [x] All three apps pass lint, types, build
- [ ] Full E2E: signup → scan → approve → insights → upgrade → dispute
- [x] Deferred items logged in `V2_Backlog.md` §Post-sprint

---

## A. Admin (`apps/admin`)

- [x] Verification queue UI (from Day 6)
- [x] **Dispute centre** — detail page, 3-way resolve (reject / approve / approve+stamp), 48h service level agreement + admin early-resolve confirm
- [x] **Dispute live updates** — broadcast channel + React Query refetch (admin + merchant)
- [x] **Stamps workbench** — per-card dispute panel, richer approved-session table (branch, amount, approver)
- [x] Merchant detail: subscription tier, adjust tier, extend trial
- [x] Platform dashboard: MRR stub, stamps today (default period), open disputes count

## B. i18n

- [x] `messages/ne.json` + `messages/fi.json` — auth, stamp flow, errors, nav (not full app)
- [x] Locale switcher (customer profile + merchant settings)

## C. Hardening

- [x] `pnpm lint` · `pnpm check-types` · `pnpm build` (customer, merchant, admin)
- [ ] Manual E2E: signup → scan → approve → insights → upgrade → dispute
- [x] Update Technical Doc implementation status
- [x] Move deferred items to `V2_Backlog.md` §Post-sprint

## D. Sign-off

- [ ] Demo recorded or checklist ticked by stakeholder
- [ ] Git commit when requested

---

_Previous: [`Day6_Checklist.md`](Day6_Checklist.md) · Sprint index: [`README.md`](README.md) · Post-sprint: see README §Post-sprint_
