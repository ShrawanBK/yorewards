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
| Credible onboarding gate (Free) | ⏳ |
| Staff invite accept flow | ⏳ |
| “X more stamps” notification | ⏳ |

---

## Day 6 “done” when

- [ ] Free tier limits enforced (50 customers, 1 card, 1 staff)
- [ ] eSewa sandbox checkout activates Starter trial
- [ ] T&C required before paid checkout
- [ ] Document verification → admin queue → verified badge
- [ ] Free tier: credible business fields required before `active` (interim Day 5 auto-approve replaced)
- [ ] Invited staff can accept an invite without falling into owner/business signup
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

## E. Free-tier credible onboarding (before auto-`active`)

> Day 5 ships interim auto-`active` on add-business. Replace with a credibility gate before merchants can use the counter workflow.

- [ ] Collect **credible business fields** before setting `status: active` (e.g. registration / PAN number, website or social URL, full address, optional business card image)
- [ ] Keep merchant `pending` (or `pending_verification`) until minimum fields pass validation
- [ ] Phone OTP for owner (PRD §4.2 basic verification) — optional same step
- [ ] **Full KYC form** (documents + admin review) — separate follow-up; see [`V2_Backlog.md`](../V2_Backlog.md) § Merchant KYC

## F. Staff invite acceptance

> Day 5 sends Supabase invite emails for `merchant_staff`, but the public signup UI still assumes "new business owner" and redirects to `/merchant/add-business`.

- [ ] Add dedicated **accept invite** flow for cashier / manager users
- [ ] Invite email should land on staff-only onboarding, not owner business registration
- [ ] If invite email matches an existing auth user, signing in should link the membership and route to dashboard
- [ ] If invite email is new, account creation should end in staff activation, not `add-business`
- [ ] Optional: support invite token / email param to prefill and lock the invited email

## G. QA

- [ ] Free merchant blocked at 51st customer; upgrade unlocks; trial countdown works

---

_Previous: [`Day5_Checklist.md`](Day5_Checklist.md) · Next: [`Day7_Checklist.md`](Day7_Checklist.md)_
