# YORewards — V2 Day 6 (Billing + Tier Gates)

> **Goal:** Monetisation path in sandbox; features respect subscription plan.  
> **Reference:** V2 PRD §5, §6.1, §8.6  
> **Prerequisite:** [`Day5_Checklist.md`](Day5_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Subscriptions schema + gates | ✅ |
| eSewa sandbox | ✅ (sandbox checkout route) |
| Verification upload | ✅ |
| Credible onboarding gate (Free) | ✅ |
| Staff invite accept flow | ✅ |
| “X more stamps” notification | ✅ (log + DB; push/email deferred) |

---

## Day 6 “done” when

- [x] Free tier limits enforced (50 customers, 1 card, 1 staff)
- [x] eSewa sandbox checkout activates Starter trial
- [x] T&C required before paid checkout
- [x] Document verification → admin queue → verified badge
- [x] Free tier: credible business fields required before `active` (interim Day 5 auto-approve replaced)
- [x] Invited staff can accept an invite without falling into owner/business signup
- [x] One smart promo: “X more stamps” when threshold hit

---

## A. Schema + tier gates

- [x] `merchant_subscriptions` — tier, status, trial_ends_at, current_period_end
- [x] Plan limits: Free / Starter / Growth per PRD §5.1 (`@repo/utils/plan-limits`)
- [x] Feature flags in server actions: CRM, CSV, campaigns, verified badge, smart promo

## B. Billing

- [x] eSewa **sandbox** checkout → webhook → activate Starter trial (Khalti stub OK)
- [x] Billing page: current plan, upgrade CTA, minimal invoice list
- [x] T&C checkbox before first paid checkout — static legal pages

## C. Smart promo (one trigger)

- [x] **“X more stamps”** on stamp approval when threshold hit — merchant toggle, once per cycle

## D. Verification (Starter+)

- [x] Document upload → admin queue → verified badge on merchant record

## E. Free-tier credible onboarding (before auto-`active`)

- [x] Collect credible business fields before `status: active`
- [x] Phone required; registration, website/social, address validated
- [ ] Phone OTP for owner — deferred
- [ ] Full KYC form — see [`V2_Backlog.md`](../V2_Backlog.md)

## F. Staff invite acceptance

- [x] `/merchant/accept-invite` flow with locked invited email
- [x] Invite redirect lands on accept-invite, not owner signup
- [x] Sign-in / sign-up / auth callback link pending invites and route to dashboard

## G. QA

- [ ] Free merchant blocked at 51st customer; upgrade unlocks; trial countdown works (manual)

---

## Apply migration

```sh
pnpm exec supabase db push
```

---

_Previous: [`Day5_Checklist.md`](Day5_Checklist.md) · Next: [`Day7_Checklist.md`](Day7_Checklist.md)_
