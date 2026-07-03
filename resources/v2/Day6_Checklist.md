# YORewards — V2 Day 6 (Billing + Tier Gates)

> **Goal:** Monetisation path in sandbox; features respect subscription plan.  
> **Reference:** V2 PRD §5, §6.1, §8.6  
> **Prerequisite:** [`Day5_Checklist.md`](Day5_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Subscriptions schema + gates | ⏳ |
| eSewa sandbox | ⏳ |
| Verification upload | ⏳ |
| “X more stamps” notification | ⏳ |

---

## Day 6 “done” when

- [ ] Free tier limits enforced (50 customers, 1 card, 1 staff)
- [ ] eSewa sandbox checkout activates Starter trial
- [ ] T&C required before paid checkout
- [ ] Document verification → admin queue → verified badge
- [ ] One smart promo: “X more stamps” when threshold hit

---

## A. Schema + tier gates

- [ ] `merchant_subscriptions` — tier, status, trial_ends_at, current_period_end
- [ ] Plan limits: Free / Starter / Growth per PRD §5.1
- [ ] Feature flags in server actions: CRM, CSV, campaigns, verified badge

## B. Billing

- [ ] eSewa **sandbox** checkout → webhook → activate Starter trial (Khalti stub OK)
- [ ] Billing page: current plan, upgrade CTA, minimal invoice list
- [ ] T&C checkbox before first paid checkout — static legal pages

## C. Smart promo (one trigger)

- [ ] **“X more stamps”** push/email when threshold hit — merchant toggle, once per cycle

## D. Verification (Starter+)

- [ ] Document upload → admin queue → verified badge on customer-facing card

## E. QA

- [ ] Free merchant blocked at 51st customer; upgrade unlocks; trial countdown works

---

_Previous: [`Day5_Checklist.md`](Day5_Checklist.md) · Next: [`Day7_Checklist.md`](Day7_Checklist.md)_
