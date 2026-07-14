# YORewards — V2 Day 8 (Post-sprint: dispute loop + E2E + launch)

> **Goal:** Close the customer dispute loop, run full E2E sign-off, and advance launch polish from V1 Day 8.  
> **Reference:** [`V2_Backlog.md`](V2_Backlog.md) §Post-sprint · [`v1/Day8_Checklist.md`](../v1/Day8_Checklist.md) Phases D–F  
> **Prerequisite:** [`Day7_Checklist.md`](Day7_Checklist.md) — sprint code complete

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Customer dispute status on card detail | ✅ |
| Full E2E runbook | ⏳ |
| V1 Day 8 responsiveness pass | ⏳ |
| Production deploy (Vercel) | ⏳ |
| Stakeholder sign-off | ⏳ |

---

## Sprint “done” when (Day 7 carry-over)

- [ ] Full E2E: signup → scan → approve → insights → upgrade → dispute → **customer sees outcome**
- [ ] Stakeholder demo or checklist ticked

---

## A. Customer dispute loop (`apps/customer`)

- [x] **Dispute history panel** on card detail — pending / approved / rejected + resolution note
- [x] Hide “Missing a stamp?” form while a **pending** dispute exists on that card
- [x] i18n keys for dispute status + outcomes (`messages/en.json`)
- [ ] Optional: refetch after merchant/admin resolves (poll or Realtime later)

## B. Platform notifications (deferred if no Resend key)

- [ ] Email admin when dispute passes 48-hour service level agreement (cron / edge function)
- [ ] Customer email/push on dispute resolved (V2_Backlog §Post-sprint)

## C. E2E sign-off

- [x] [`Day8_E2E_Runbook.md`](Day8_E2E_Runbook.md) — step-by-step manual matrix
- [ ] Run once on local or staging; tick results in runbook
- [ ] Document demo accounts / seed cleanup notes

## D. Launch polish (from V1 Day 8)

- [ ] Phase D — mobile responsiveness spot-check (customer wallet/scan, merchant queue, admin disputes)
- [ ] Phase E — three reward types in E2E matrix
- [ ] Phase F — Vercel deploy three apps (when approved)

## E. Docs

- [x] Update [`README.md`](README.md) current day → Day 8
- [ ] Update Technical Doc implementation status
- [ ] Tick Day 7 dispute items (detail page, 3-way resolve, service level agreement)

---

_Next: [`V2_Backlog.md`](V2_Backlog.md) §Post-sprint (Expo, full ne/fi, Khalti live)_
