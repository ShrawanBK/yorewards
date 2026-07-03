# YORewards — V2 Day 5 (Multi-Staff + Auth + Auto-Approve)

> **Goal:** Team accounts, frictionless onboarding, account maintenance.  
> **Reference:** V2 PRD §4.1, §4.8 · [`V2_Backlog.md`](../V2_Backlog.md)  
> **Prerequisite:** [`Day4_Checklist.md`](Day4_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| `merchant_staff` + RLS | ⏳ |
| Auto-approve + checklist | ⏳ |
| Password/email flows | ⏳ |
| Approval email | ⏳ |

---

## Day 5 “done” when

- [ ] Cashier / manager / owner roles enforced
- [ ] Free-tier merchants auto-approved on signup
- [ ] Password + email change on merchant and admin
- [ ] Email sent when merchant approved

---

## A. Multi-staff

- [ ] `merchant_staff` — roles: cashier / manager / owner; invite by email
- [ ] RLS: staff scoped to merchant; `approved_by` on stamp approvals
- [ ] Staff switcher (web) — PIN or quick account picker
- [ ] Owner-only: billing, card edit, staff management

## B. Onboarding

- [ ] **Auto-approve** merchant registration for Free tier
- [ ] Post-signup checklist widget (profile, card, QR printed)

## C. Account flows

- [ ] Merchant + admin: **change password**
- [ ] Merchant + admin: **change email** (verify new address)
- [ ] **Email on merchant approved** — Resend/Supabase template

## D. QA

- [ ] Cashier cannot access billing; owner can; branch redeem rule enforced

---

_Previous: [`Day4_Checklist.md`](Day4_Checklist.md) · Next: [`Day6_Checklist.md`](Day6_Checklist.md)_
