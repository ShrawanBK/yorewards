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

## Staff invite acceptance UX — ✅ RESOLVED (Day 6)

**Shipped Day 6.** Dedicated `/merchant/accept-invite` flow with locked invited email; `resolvePostAuthRedirect` + `linkPendingStaffInvites` link pending invites on sign-in / sign-up / auth callback and route staff to the dashboard (not owner onboarding).

- [x] Dedicated **accept invite** flow for merchant staff (`AcceptInviteView` / `AcceptInviteForm`)
- [x] Owner signup and staff invite acceptance are separate journeys
- [x] Existing auth user → membership linked → merchant dashboard
- [x] New email → invite completion activates `merchant_staff`, skips `add-business`
- [x] Email-prefill route (`?email=`) so staff never see the owner signup tab first

**Touch points (implemented):** `inviteMerchantStaff`, `linkPendingStaffInvites`, `resolvePostAuthRedirect`, `AcceptInviteView`, auth callback route.

---

## Other v2 items (from PRD §12–13)

- ~~Manual stamp (no camera) — merchant + branch picker on `/scan`~~ — ✅ Day 3 (`ManualStampPicker`)
- ~~Multi-staff accounts (`merchant_staff`) + role permissions~~ — ✅ Day 5
- ~~Staff invite acceptance flow~~ — ✅ Day 6 (`/merchant/accept-invite` + `linkPendingStaffInvites`)
- Phone OTP at customer signup (not just redemption) — **now in V2 Day 10**
- Nepali + Finnish translations (next-intl keys exist) — **now in V2 Day 11**
- ~~Customer detail drawer + CSV export on `/merchant/customers`~~ — ✅ Day 4
- Per-branch analytics charts (beyond `location_id` filter)
- Merchant subscription billing (Stripe + eSewa / MobilePay)
- ~~Auto-approve merchant registration~~ — ✅ Day 5 interim; **gate on credible info** (see § Merchant KYC above)
- ~~Password change + email change flows (merchant/admin)~~ — ✅ Day 5
- ~~Push / email when merchant approved (`§6.5` table)~~ — ✅ Day 5 (Resend optional)

---

## Build plan

Active build plan: [`README.md`](README.md) · **current:** [`Day9_Checklist.md`](Day9_Checklist.md).

Days 1–8 shipped the core loop. **Days 9–12 = V2 completion phase** (pulled in from the list below): notifications, verification, full i18n, launch hardening. See [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0.

---

## Now IN V2 (completion phase — Days 9–12)

Moved out of "post-sprint" because they block a credible launch:

| Item                              | Day | Notes                                                                     |
| --------------------------------- | --- | ------------------------------------------------------------------------- |
| **Notifications (all sides)**     | 9   | In-app centre + email; dispute filed → merchant, SLA breach → admin, resolved → customer, reward unlocked |
| **Account verification**          | 10  | Merchant owner email (free); customer phone OTP (Sparrow NP / Twilio · GatewayAPI FI); provider abstraction |
| **Full en/ne/fi translation**    | 11  | Key parity check + full coverage on critical paths                        |
| **Full E2E sign-off**             | 12  | 12 flows + 3 reward types; run [`Day8_E2E_Runbook.md`](Day8_E2E_Runbook.md) |
| **Production deploy**             | 12  | 3 Vercel apps + prod env (SMS, Resend, eSewa, Supabase RLS)               |
| **Admin demo / stakeholder sign-off** | 12 | Founder sign-off on full loop demo                                    |

---

## Post-sprint → V3 (still deferred)

| Item                                  | Notes                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------- |
| **Expo native apps**                  | Customer + merchant; see [`README.md`](README.md) §Post-sprint      |
| **Offline stamp queue**               | WatermelonDB — native only                                                |
| **Khalti live + Finland payments**    | eSewa sandbox → live; Stripe/MobilePay + EUR pricing for FI               |
| **Full smart-promo suite**            | Win-back, streak, birthday, expiry campaigns, push campaign builder       |
| **POS API + webhooks**                | Growth+ tier                                                              |
| **In-app live chat**                  | Interim: WhatsApp/email support link                                      |
| **Deep legal/compliance**             | Full EU GDPR DPAs + breach process; Nepal tax/registration                |
| **Full merchant KYC (documents)**     | Doc upload + admin review beyond credible-fields gate                     |
| **Phone OTP for merchant owner**      | Email verification ships in V2 (Day 10); owner phone OTP deferred         |
| **Observability**                     | Sentry + PostHog                                                          |
| **App/Play Store submission**         | When native apps ship                                                     |

---

_Last updated: July 2026 · See also [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0_
