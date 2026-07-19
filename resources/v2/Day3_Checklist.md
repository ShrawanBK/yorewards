# YORewards — V2 Day 3 (Customer Scan + Wallet V2 + Disputes)

> **Goal:** Customer completes QR flow end-to-end; wallet feels V2.  
> **Reference:** V2 PRD §3.3–3.6, §3.8 · [`V2_Backlog.md`](V2_Backlog.md) (signup OTP)  
> **Prerequisite:** [`Day2_Checklist.md`](Day2_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| QR scan + pending UI | ✅ |
| Manual merchant/branch stamp (no camera) | ✅ |
| Wallet V2 + card detail | ✅ |
| Disputes + reward history | ✅ |
| Signup OTP | ⏳ deferred → backlog |

---

## Day 3 “done” when

- [x] Customer scans QR → pending → sees approval with spend message
- [x] Customer can stamp via **manual merchant + branch picker** when camera scan is unavailable
- [x] Wallet sort/search + reward-ready badges work
- [x] Dispute form reaches merchant; reward history page live
- [ ] Phone OTP at customer signup (not only redemption) — **deferred**

---

## A. Customer scan (`apps/customer`)

- [x] `/scan` — camera QR → `createPendingStampSession`; invalid/expired QR errors
- [x] **Manual stamp fallback** — merchant + branch picker → same `submitStampScanAction` flow
- [x] Pending UI: “Waiting for merchant…” + poll/realtime until approved/rejected
- [x] Post-approve: stamp count + “You spent NPR X” message

## B. Wallet V2

- [x] Sort (recent / reward-ready), search, reward-ready pin + badge
- [x] Card detail: spend summary (total, avg, last visit), visit history list
- [x] Reward history page — earned / redeemed / expired / active (V2 PRD §3.6)

## C. Disputes

- [x] “Missing stamp?” form on card detail → `stamp_disputes` (merchant UI Day 4)

## D. Backlog

- [ ] Phone OTP at customer **signup** — Supabase phone auth or existing OTP provider

## E. QA

- [ ] Full loop: customer scan → merchant approve → wallet updates without manual refresh

---

_Previous: [`Day2_Checklist.md`](Day2_Checklist.md) · Next: [`Day4_Checklist.md`](Day4_Checklist.md)_
