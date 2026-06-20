# YORewards — Day 8 Checklist (Polish, Privacy & Launch)

> **Goal:** Production-ready **all three apps** — PWA installability, GDPR privacy page, empty/error states, full cross-app E2E, and Vercel deploy.  
> **Reference:** PRD §9, §10, §11 (original Day 7) · Technical Doc §8  
> **Prerequisite:** Day 7 customer PWA complete ([`Day7_Checklist.md`](Day7_Checklist.md))

---

## Implementation status

| Area                                    | Status     |
| --------------------------------------- | ---------- |
| Phase A — Customer PWA (manifest, icons) | ⏳ Planned |
| Phase B — Privacy & GDPR                | ⏳ Planned |
| Phase C — Cross-app empty/error states  | ⏳ Planned |
| Phase D — Mobile responsiveness pass    | ⏳ Planned |
| Phase E — Full E2E (3 reward types)     | ⏳ Planned |
| Phase F — Production deploy (Vercel)    | ⏳ Planned |
| Phase G — Sign-off + docs               | ⏳ Planned |

---

## MVP launch definition

- [ ] Customer app installable (PWA) on iOS/Android home screen
- [ ] Privacy policy reachable from customer + merchant apps
- [ ] All three apps deployed: `app.`, `merchant.`, `admin.` subdomains
- [ ] End-to-end test: signup → approve → scan → stamp → OTP → redeem for **free_item**, **percent_discount**, **fixed_discount**
- [ ] RLS smoke across merchant isolation (Day 4 §G3 optional but recommended)

---

## Phase A — Customer PWA

- [ ] `next-pwa` config in `apps/customer` (customer app only — PRD)
- [ ] Manifest: name, icons, theme colors (brand from `@repo/tailwind-config`)
- [ ] Apple touch icons + meta tags
- [ ] Verify install prompt on Android; iOS “Add to Home Screen” instructions (optional UI hint)

---

## Phase B — Privacy & GDPR — PRD §9

- [ ] `/privacy` route (customer app; link from profile + footer)
- [ ] Cover: data collected, Supabase EU region, deletion request contact
- [ ] Profile: “Request data deletion” stub or mailto (MVP acceptable)
- [ ] Merchant terms link if required (optional MVP)

---

## Phase C — Empty & error states (all apps)

- [ ] Customer: offline / camera denied / invalid QR / session expired
- [ ] Merchant: already strong from Day 4–5 — spot-check
- [ ] Admin: empty audit, no customers, no pending merchants
- [ ] Consistent error code → i18n mapping on all apps

---

## Phase D — Responsiveness

- [ ] Customer: mobile-first pass (wallet, scan, pending)
- [ ] Merchant: counter tablet + phone sidebar
- [ ] Admin: desktop-only OK; min width sanity check

---

## Phase E — Full E2E matrix

| Flow | Apps involved |
| ---- | ------------- |
| Merchant onboarding | customer N/A · merchant · admin approve |
| Stamp collect | customer scan · merchant queue |
| Reward redeem | customer OTP · merchant redeem |
| Admin manual stamp | admin tool · customer wallet |
| Multi-branch | customer scan branch B · merchant branch filter |

- [ ] All three reward types tested once
- [ ] Document test accounts / demo data cleanup

---

## Phase F — Production deploy

- [ ] Vercel: three projects linked to monorepo (`customer`, `merchant`, `admin`)
- [ ] Env vars set per Technical Doc §8 (all `NEXT_PUBLIC_*` URLs)
- [ ] Supabase production keys (RLS verified)
- [ ] SMS credentials (Sparrow/Twilio) for production or staging decision
- [ ] Smoke test on production URLs

---

## Phase G — Sign-off

- [ ] Update PRD / Technical Doc — **MVP launch complete**
- [ ] Update all Day checklists final status
- [ ] Launch git tag or commit (when you ask)
- [ ] [`V2_Backlog.md`](V2_Backlog.md) — triage post-launch items

---

## Done when

- [ ] Three production URLs live and healthy
- [ ] PWA install works on at least one mobile device
- [ ] Privacy page published
- [ ] Founder sign-off on full loop demo

---

_Previous: [`Day7_Checklist.md`](Day7_Checklist.md) · V2: [`V2_Backlog.md`](V2_Backlog.md)_
