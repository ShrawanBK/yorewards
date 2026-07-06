# YORewards — V2 Sprint (7 Days)

> **Goal:** Ship a **usable V2 foundation** on existing web apps — QR stamp + spend, CRM basics, tier gates, backlog items.  
> **Reference:** [`YoRewards_V2_Final.md`](../YoRewards_V2_Final.md) · [`V2_Backlog.md`](../V2_Backlog.md)  
> **Prerequisite:** V1 complete ([`v1/Day8_Checklist.md`](../v1/Day8_Checklist.md))  
> **Reality check:** Full V2 PRD = 16 weeks. This sprint = **core loop + revenue path**. Native Expo, full promotions, POS API → post-sprint.

---

## Current build day

**→ [`Day3_Checklist.md`](Day3_Checklist.md)** (customer scan + wallet V2)

| Day | Focus | Checklist |
| --- | ----- | --------- |
| **1** | Schema + QR stamp backend | [`Day1_Checklist.md`](Day1_Checklist.md) |
| **2** | Merchant queue + spend UI | [`Day2_Checklist.md`](Day2_Checklist.md) |
| **3** | Customer scan + wallet V2 | [`Day3_Checklist.md`](Day3_Checklist.md) |
| **4** | Spend insights + CRM | [`Day4_Checklist.md`](Day4_Checklist.md) |
| **5** | Multi-staff + auth flows | [`Day5_Checklist.md`](Day5_Checklist.md) |
| **6** | Billing + tier gates | [`Day6_Checklist.md`](Day6_Checklist.md) |
| **7** | Admin V2 + hardening | [`Day7_Checklist.md`](Day7_Checklist.md) |

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
