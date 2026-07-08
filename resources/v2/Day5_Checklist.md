# YORewards — V2 Day 5 (Multi-Staff + Auth + Auto-Approve)

> **Goal:** Team accounts, frictionless onboarding, account maintenance.  
> **Reference:** V2 PRD §4.1, §4.8 · [`V2_Backlog.md`](../V2_Backlog.md)  
> **Prerequisite:** [`Day4_Checklist.md`](Day4_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| `merchant_staff` + RLS | ✅ |
| Auto-approve + checklist | ✅ |
| Password/email flows | ✅ |
| Approval email | ✅ (Resend when `RESEND_API_KEY` set) |

---

## Day 5 “done” when

- [x] Cashier / manager / owner roles enforced
- [x] Free-tier merchants auto-approved on signup
- [x] Password + email change on merchant and admin
- [x] Email sent when merchant approved

---

## A. Multi-staff

- [x] `merchant_staff` — roles: cashier / manager / owner; invite by email
- [x] RLS: staff scoped to merchant; `approved_by` via acting-staff PIN cookie
- [x] Staff switcher (web) — PIN quick picker in sidebar
- [x] Owner-only: staff management, business, loyalty card

## B. Onboarding

- [x] **Auto-approve** merchant registration for Free tier *(interim — see backlog: gate on credible business info)*
- [x] Post-signup checklist widget (profile, card, QR printed)

### Follow-up (not Day 5)

- [ ] **Gate `active` status** — auto-approve only after credible business fields (registration number, website/social, address, etc.)
- [ ] **Full merchant KYC form** — documents, business card upload, admin review (see [`V2_Backlog.md`](../V2_Backlog.md) § Merchant KYC)

## C. Account flows

- [x] Merchant + admin: **change password**
- [x] Merchant + admin: **change email** (verify new address via Supabase)
- [x] **Email on merchant approved** — Resend HTTP API (optional env)

## D. QA

- [ ] Cashier cannot access billing; owner can; branch redeem rule enforced
- [ ] Run `pnpm exec supabase db push` for `20260708120000_v2_day5_merchant_staff.sql`

---

_Previous: [`Day4_Checklist.md`](Day4_Checklist.md) · Next: [`Day6_Checklist.md`](Day6_Checklist.md)_
