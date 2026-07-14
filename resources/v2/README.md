# YORewards — V2 Sprint (7 Days)

> **Goal:** Ship a **usable V2 foundation** on existing web apps — QR stamp + spend, CRM basics, tier gates, backlog items.  
> **Reference:** [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) · [`V2_Backlog.md`](V2_Backlog.md)  
> **Prerequisite:** V1 complete ([`v1/Day8_Checklist.md`](../v1/Day8_Checklist.md))  
> **Reality check:** Full V2 PRD = 16 weeks. This sprint = **core loop + revenue path**. Native Expo, full promotions, POS API → post-sprint.

---

## Current build day

**→ [`Day9_Checklist.md`](Day9_Checklist.md)** — V2 completion phase: notifications (merchant + admin + customer)

The 7-day sprint (Days 1–8) shipped the core loop. **Days 9–12 = V2 completion phase** — the critical features that make the whole system launch-ready (notifications, verification, full i18n, production hardening). See [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0.

| Day | Focus | Checklist |
| --- | ----- | --------- |
| **1** | Schema + QR stamp backend | [`Day1_Checklist.md`](Day1_Checklist.md) |
| **2** | Merchant queue + spend UI | [`Day2_Checklist.md`](Day2_Checklist.md) |
| **3** | Customer scan + wallet V2 | [`Day3_Checklist.md`](Day3_Checklist.md) |
| **4** | Spend insights + CRM | [`Day4_Checklist.md`](Day4_Checklist.md) |
| **5** | Multi-staff + auth flows | [`Day5_Checklist.md`](Day5_Checklist.md) |
| **6** | Billing + tier gates | [`Day6_Checklist.md`](Day6_Checklist.md) |
| **7** | Admin V2 + hardening | [`Day7_Checklist.md`](Day7_Checklist.md) |
| **8** | Post-sprint loop + E2E | [`Day8_Checklist.md`](Day8_Checklist.md) |
| **9** | 🆕 Notifications (merchant + admin + customer) | [`Day9_Checklist.md`](Day9_Checklist.md) |
| **10** | 🆕 Account verification (email + SMS OTP) | [`Day10_Checklist.md`](Day10_Checklist.md) |
| **11** | 🆕 Full i18n (en / ne / fi) | [`Day11_Checklist.md`](Day11_Checklist.md) |
| **12** | 🆕 Launch hardening + production deploy | [`Day12_Checklist.md`](Day12_Checklist.md) |

---

## Sprint outcome (Day 7 “done”)

| Stakeholder | Shippable |
| ----------- | --------- |
| **Customer** | QR scan → approve with spend; **manual merchant/branch stamp**; wallet V2; insights; reward history; disputes |
| **Merchant** | Cashier queue; CRM + CSV; multi-staff; auto-approve Free; branch scoping |
| **Admin** | Verification queue; disputes; tier override; approval email |
| **Platform** | Spend per stamp; tier gates; eSewa sandbox; ne/fi locale shells |

## Not in 7 days

Expo native apps, WatermelonDB offline, push campaign builder, POS API, fraud ML, referrals, WhatsApp bot, yearly Wrapped, full smart-promo suite, Khalti live, Enterprise white-label.

## Post-sprint (Week 2+)

1. Expo customer app · 2. Expo merchant + offline · 3. Full smart promotions · 4. POS API · 5. Khalti prod · referral · fraud · deep links

## Daily habit

Schema/RLS before UI · error codes + i18n same PR · one E2E per day · tick only the current day file.

_Last updated: July 2026_
