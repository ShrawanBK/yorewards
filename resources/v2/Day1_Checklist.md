# YORewards — V2 Day 1 (Schema + QR Stamp Backend)

> **Goal:** Data model and server actions for 2-step QR stamp with spend.  
> **Reference:** V2 PRD §2 · [`V2_Backlog.md`](../V2_Backlog.md) (branch subset) · Technical Doc §4.7  
> **Prerequisite:** V1 complete ([`v1/Day8_Checklist.md`](../v1/Day8_Checklist.md))

---

## Implementation status

| Area | Status |
| ---- | ------ |
| DB migrations + RLS | ⏳ |
| Stamp session actions | ⏳ |
| Smoke test | ⏳ |

---

## Day 1 “done” when

- [ ] Customer can create a pending stamp session from a static merchant QR payload
- [ ] Merchant can approve with `amount_spent` → stamp + transaction row
- [ ] Branch subset rules enforced via `loyalty_card_locations`
- [ ] All new tables have RLS; error codes registered

---

## A. DB / RLS

- [ ] Migration: `stamp_sessions.amount_spent` (NPR, required on approve); `approved_by` staff ref
- [ ] `stamp_transactions` (or extend existing) — customer, merchant, card, amount, location_id, session_token, device_info
- [ ] `loyalty_card_locations(card_id, location_id, stamp_allowed, redeem_allowed)` — **subset branch model**
- [ ] RLS on all new/changed tables
- [ ] Update Technical Doc §4.7

## B. Backend actions

- [ ] Static merchant QR payload → `createPendingStampSession` (one-time token, expiry)
- [ ] `approveStampSession(sessionId, amountSpent, staffId)` — min spend, branch rules, tier limits
- [ ] `rejectStampSession` + optional reason enum
- [ ] Fraud guard: duplicate session / rapid rescan block
- [ ] Error codes → `@repo/utils/action-error` + `errors.actions.*` (customer, merchant, admin)

## C. Smoke test

- [ ] SQL + action path: create session → approve with NPR amount → stamp + transaction row

---

_Next: [`Day2_Checklist.md`](Day2_Checklist.md) · Sprint index: [`README.md`](README.md)_
