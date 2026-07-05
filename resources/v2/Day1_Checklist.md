# YORewards — V2 Day 1 (Schema + QR Stamp Backend)

> **Goal:** Data model and server actions for 2-step QR stamp with spend.  
> **Reference:** V2 PRD §2 · [`V2_Backlog.md`](../V2_Backlog.md) (branch subset) · Technical Doc §4.7  
> **Prerequisite:** V1 complete ([`v1/Day8_Checklist.md`](../v1/Day8_Checklist.md))

---

## Implementation status

| Area | Status |
| ---- | ------ |
| DB migrations + RLS | ✅ |
| Stamp session actions | ✅ |
| Smoke test | ⏳ Run `pnpm exec supabase db push` then manual E2E |

---

## Day 1 “done” when

- [x] Customer can create a pending stamp session from a static merchant QR payload
- [x] Merchant can approve with `amount_spent` → stamp + transaction row
- [x] Branch subset rules enforced via `loyalty_card_locations`
- [x] All new tables have RLS; error codes registered

---

## A. DB / RLS

- [x] Migration: `stamp_sessions.amount_spent` (NPR, required on approve); `approved_by` staff ref
- [x] `stamp_transactions` — customer, merchant, card, amount, location_id, session_token, device_info
- [x] `loyalty_card_locations(card_id, location_id, stamp_allowed, redeem_allowed)` — **subset branch model**
- [x] RLS on all new/changed tables
- [x] Update Technical Doc §4.7

## B. Backend actions

- [x] Static merchant QR payload → `createPendingStampSession` (one-time token, expiry)
- [x] `approveStampSession(sessionId, { amountSpent, approvedBy })` — min spend, branch rules
- [x] `rejectStampSession` + optional reason
- [x] Fraud guard: duplicate session / rapid rescan block (3 per 5 min)
- [x] Error codes → `@repo/utils/action-error` + `errors.actions.*` (customer, merchant)

## C. Smoke test

- [ ] Apply migration: `pnpm exec supabase db push`
- [ ] E2E: scan → approve with NPR amount → `stamp_transactions` row exists

---

_Next: [`Day2_Checklist.md`](Day2_Checklist.md) · Sprint index: [`README.md`](README.md)_
