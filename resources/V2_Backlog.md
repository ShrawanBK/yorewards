# YORewards — V2 Backlog (post–merchant MVP)

> Items explicitly **out of MVP** but worth preserving so we do not re-debate them each build day.  
> MVP invariant (Day 3–5): **one `loyalty_cards` row per business**, all active branches share the same customer balance; `location_id` is attribution only.

---

## Loyalty program scoping (multi-branch)

**Problem:** Some merchants may want different rules per outlet — e.g. stamp at kiosk A but redeem only at main store, or separate programs per branch.

**Current MVP:** One card, all active branches, redeem anywhere in the business. Control = deactivate branch (`is_active`) to hide its QR only.

**V2 options (pick one when building):**

| Model                                | Use case                               | Schema sketch                                                                            |
| ------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Subset of branches**               | Card valid at 3 of 5 outlets           | `loyalty_card_locations(loyalty_card_id, location_id, stamp_allowed, redeem_allowed)`    |
| **Earn anywhere, redeem at primary** | Airport kiosk stamps, downtown redeems | `redeem_at_primary_only` flag on `loyalty_cards` + validate in `complete_redemption`     |
| **Separate card per branch**         | Franchise-style independence           | Multiple `loyalty_cards` per merchant + branch assignment (larger change to wallet + QR) |

**Touch points when implemented:** QR scan validation (Day 7 customer), `createPendingStampSession`, redeem lookup, merchant loyalty-card config UI, PRD §6.1 + Technical Doc §4.7.

---

## Merchant KYC & credible onboarding

**Interim (Day 5 shipped):** Free merchants are set to `status: active` immediately in `addBusinessAction` after name, category, phone format, and country — no document check, no phone OTP, no admin review.

**Product intent (V2 PRD §4.2):** Free tier should have _basic_ verification (phone OTP + self-reported details); paid tiers get document review + verified badge.

**Follow-up — gate auto-`active` on credible info (before full KYC):**

| Step | What                          | Notes                                                                                                                                |
| ---- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | **Credible fields form**      | Business registration number (PAN / trade license #), website or social URL, full business address, hours — required before `active` |
| 2    | **Light evidence (optional)** | Upload business card or registration scan for Free tier — stored, not necessarily admin-reviewed on day one                          |
| 3    | **Status model**              | Stay `pending` (or add `pending_verification`) until step 1 complete; only then auto-`active` for Free                               |
| 4    | **Phone OTP**                 | Verify owner phone at onboarding (aligns with PRD §4.2)                                                                              |

**Later — full merchant KYC form:**

- [ ] Dedicated KYC onboarding step (multi-field + document uploads)
- [ ] Admin verification queue for disputed / paid-tier applications
- [ ] Verified badge on customer wallet card (Starter+)
- [ ] Reject / request-more-info flow with reasons
- [ ] Audit trail on `merchants` (who approved, which documents)

**Touch points:** `addBusinessAction`, `merchants` schema (KYC columns + `verification_status`), merchant onboarding UI, admin verification queue (Day 6–7), customer-facing trust signals.

---

## Staff invite acceptance UX

**Current gap (Day 5):** Owner can invite `cashier` / `manager` by email, and `merchant_staff` rows are created. But the public merchant auth UI still treats "sign up" as **create a business owner account** and redirects to `/merchant/add-business`.

**Problem:** A newly invited cashier can receive an invite email, but if they follow the wrong path they can end up in owner onboarding instead of staff activation.

**Follow-up (Day 6):**

- [ ] Add dedicated **accept invite** flow for merchant staff
- [ ] Keep owner signup and staff invite acceptance as separate auth journeys
- [ ] If invited email already belongs to an auth user, sign-in should link membership and go to merchant dashboard
- [ ] If invited email is new, completing invite/signup should activate `merchant_staff` and skip `add-business`
- [ ] Optional: invite token / email-prefill route so staff never see the owner signup tab first

**Touch points:** `inviteMerchantStaff`, `linkPendingStaffInvites`, merchant auth UI (`MerchantAuthScreen` / `MerchantAuthForm`), auth redirects, staff onboarding copy.

---

## Other v2 items (from PRD §12–13)

- **Manual stamp (no camera)** — merchant + branch picker on `/scan` when QR camera fails (iOS PWA, permission denied, broken lens). Same pending session as QR; see Day 3 checklist.
- ~~Multi-staff accounts (`merchant_staff`) + role permissions~~ — ✅ Day 5
- Phone OTP at customer signup (not just redemption)
- Nepali + Finnish translations (next-intl keys exist)
- ~~Customer detail drawer + CSV export on `/merchant/customers`~~ — ✅ Day 4
- Per-branch analytics charts (beyond `location_id` filter)
- Merchant subscription billing (Stripe + eSewa / MobilePay)
- ~~Auto-approve merchant registration~~ — ✅ Day 5 interim; **gate on credible info** (see § Merchant KYC above)
- ~~Password change + email change flows (merchant/admin)~~ — ✅ Day 5
- ~~Push / email when merchant approved (`§6.5` table)~~ — ✅ Day 5 (Resend optional)

---

## 7-day sprint

Active build plan: [`v2/README.md`](v2/README.md) · **current:** [`v2/Day3_Checklist.md`](v2/Day3_Checklist.md). Items below not in sprint → **Post-sprint** in README.

---

_Last updated: July 2026 · See also [`YoRewards_V2_Final.md`](YoRewards_V2_Final.md) §11_
