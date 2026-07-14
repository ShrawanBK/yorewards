# YORewards — V2 Day 12 (Launch Hardening + Production Deploy)

> **Goal:** Prove the whole loop works in production on a real phone, then ship it. This is the final V2 gate before real customers.
> **Reference:** [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0.2 · [`Day8_E2E_Runbook.md`](Day8_E2E_Runbook.md) · [`v1/Day8_Checklist.md`](../v1/Day8_Checklist.md) Phases D–F
> **Prerequisite:** [`Day11_Checklist.md`](Day11_Checklist.md) — notifications, verification, i18n complete

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Full E2E sign-off (12 flows + 3 reward types) | ⏳ |
| Mobile-web responsiveness pass | ⏳ |
| Production deploy (3 Vercel apps) | ⏳ |
| Production env (SMS, Resend, eSewa, Supabase) | ⏳ |
| Stakeholder sign-off + docs | ⏳ |

---

## Day 12 "done" when

- [ ] [`Day8_E2E_Runbook.md`](Day8_E2E_Runbook.md) run end-to-end with **every row ticked**, including all 3 reward types
- [ ] Core flows verified on a **real phone browser / installed PWA**
- [ ] Three apps live on production URLs and healthy
- [ ] Stakeholder sign-off recorded

## A. Full E2E sign-off

- [ ] Run all 12 flows in the runbook (signup → scan → approve → insights → dispute → resolve → customer outcome → SLA → upgrade → redeem)
- [ ] Reward matrix: `free_item`, `percent_discount`, `fixed_discount` each stamped → redeemed once
- [ ] Verify Day 9–11 additions in the loop: notification fires, OTP verifies, locale switches cleanly
- [ ] Document demo accounts + seed cleanup notes

## B. Mobile-web responsiveness (wrapped/PWA, not native)

- [ ] Customer: wallet, scan (camera + manual fallback), pending, card detail on phone
- [ ] Merchant: stamp queue + approve on counter phone/tablet
- [ ] Admin: disputes + verification usable on laptop; min-width sanity
- [ ] PWA install verified on at least one Android **and** one iOS device
- [ ] Known wrapped-web caveat: confirm iOS camera QR works or manual fallback is obvious

## C. Production deploy (Vercel)

- [ ] Three projects linked to monorepo: `customer`, `merchant`, `admin`
- [ ] Production Supabase — all migrations pushed (through Day 10); **RLS verified** across merchant isolation
- [ ] Env vars per app: `NEXT_PUBLIC_*` URLs, Supabase keys, `SPARROW_SMS_TOKEN`, Twilio, `RESEND_API_KEY` + from-email, eSewa sandbox/live keys + webhook URLs
- [ ] Smoke test each production URL (auth, one full stamp, one notification)

## D. Sign-off + docs

- [ ] Update [`YORewards_Technical_Doc.md`](../YORewards_Technical_Doc.md) Implementation Status → V2 complete
- [ ] Update [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0 status → completion phase done
- [ ] Triage remaining items to [`V2_Backlog.md`](V2_Backlog.md) §Post-sprint (V3)
- [ ] Founder sign-off on full loop demo; git tag/commit when requested

---

## Done when

- [ ] Three production URLs live and healthy
- [ ] PWA install works on a real device
- [ ] Full E2E green in all three locales
- [ ] **V2 declared launch-ready — safe to onboard real customers**

---

_Previous: [`Day11_Checklist.md`](Day11_Checklist.md) · Sprint index: [`README.md`](README.md) · Next phase: [`V2_Backlog.md`](V2_Backlog.md) §Post-sprint (V3)_
