# YORewards — V2 Day 2 (Merchant Stamp Queue + Spend UI)

> **Goal:** Cashier approves/rejects with spend in under 10 seconds (web dashboard).  
> **Reference:** V2 PRD §2.4, §4.3 · Technical Doc stamp queue  
> **Prerequisite:** [`Day1_Checklist.md`](Day1_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Cashier stamp queue UI | ⏳ |
| Branch + QR config | ⏳ |
| E2E approve flow | ⏳ |

---

## Day 2 “done” when

- [ ] Merchant sees Realtime pending queue full-width
- [ ] Approve with NPR amount updates customer balance + transaction
- [ ] Reject with reason works; min-spend warning shown
- [ ] Loyalty card editor supports branch subset picker

---

## A. Merchant UI (`apps/merchant`)

- [ ] Cashier-first **stamp queue** — full-width, Supabase Realtime subscription
- [ ] Approval card: customer name, card, time + **Amount Spent (NPR)** + Approve / Reject
- [ ] Min-spend warning (non-blocking); rejection reason dropdown
- [ ] Success toast + queue item removed (`showActionSuccess`)
- [ ] Quick redeem entry on same view (don’t regress existing flow)

## B. Config

- [ ] Loyalty card editor: branch subset picker (`loyalty_card_locations`)
- [ ] QR display/print for static counter QR (per card or per branch — pick one, document)

## C. QA

- [ ] E2E: pending session → approve with amount → customer balance +1, transaction logged

---

_Previous: [`Day1_Checklist.md`](Day1_Checklist.md) · Next: [`Day3_Checklist.md`](Day3_Checklist.md)_
