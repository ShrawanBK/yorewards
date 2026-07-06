# YORewards — V2 Day 2 (Merchant Stamp Queue + Spend UI)

> **Goal:** Cashier approves/rejects with spend in under 10 seconds (web dashboard).  
> **Reference:** V2 PRD §2.4, §4.3 · Technical Doc stamp queue  
> **Prerequisite:** [`Day1_Checklist.md`](Day1_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Cashier stamp queue UI | ✅ |
| Branch + QR config | ✅ |
| E2E approve flow | ⏳ Manual smoke test |

---

## Day 2 “done” when

- [x] Merchant sees Realtime pending queue full-width
- [x] Approve with NPR amount updates customer balance + transaction
- [x] Reject with reason works; min-spend warning shown
- [x] Loyalty card editor supports branch subset picker

---

## A. Merchant UI (`apps/merchant`)

- [x] Cashier-first **stamp queue** — full-width, Supabase Realtime subscription
- [x] Approval card: customer name, card, time + **Amount Spent** + Approve / Reject
- [x] Min-spend warning (non-blocking); rejection reason dropdown
- [x] Success toast + queue item removed (`showActionSuccess`)
- [x] Quick redeem entry on same view

## B. Config

- [x] Loyalty card editor: branch subset picker (`loyalty_card_locations`)
- [x] QR display/print per **branch** (stamp-enabled branches only)

## C. QA

- [ ] E2E: pending session → approve with amount → customer balance +1, transaction logged

---

_Next: [`Day3_Checklist.md`](Day3_Checklist.md) · Sprint index: [`README.md`](README.md)_
