# YORewards — Day 8 Checklist (Polish, Privacy & Launch)

> **Goal:** Production-ready **all three apps** — PWA installability, GDPR privacy page, empty/error states, full cross-app E2E, and Vercel deploy.  
> **Reference:** PRD §9, §10, §11 (original Day 7) · Technical Doc §8  
> **Prerequisite:** Day 7 customer PWA complete ([`Day7_Checklist.md`](Day7_Checklist.md)) — ✅ code-complete; iPhone QR smoke test before production launch.

---

## Implementation status

| Area                                     | Status     |
| ---------------------------------------- | ---------- |
| Phase A — Customer PWA (manifest, icons) | ✅ Done    |
| Phase B — Privacy & GDPR                 | ✅ Done    |
| Phase C — Cross-app empty/error states   | ✅ Done    |
| Phase D — Mobile responsiveness pass     | ⏳ Planned |
| Phase E — Full E2E (3 reward types)      | ⏳ Planned |
| Phase F — Production deploy (Vercel)     | ⏳ Planned |
| Phase G — Sign-off + docs                | ⏳ Planned |

---

## MVP launch definition

- [ ] Customer app installable (PWA) on iOS/Android home screen
- [x] Privacy policy reachable from customer + merchant apps
- [ ] All three apps deployed: `app.`, `merchant.`, `admin.` subdomains
- [ ] End-to-end test: signup → approve → scan → stamp → OTP → redeem for **free_item**, **percent_discount**, **fixed_discount**
- [ ] RLS smoke across merchant isolation (Day 4 §G3 optional but recommended)

---

## Phase A — Customer PWA

- [x] `next-pwa` config in `apps/customer` (customer app only — PRD); production build uses `next build --webpack`
- [x] Manifest: name, icons, theme colors (brand from `@repo/tailwind-config`)
- [x] Apple touch icons + meta tags (`metadata.appleWebApp`, `viewport.themeColor`)
- [x] Install UI: Android `beforeinstallprompt` button + iOS Add to Home Screen steps on Profile
- [x] Dev mobile testing: `clean-dev-sw.mjs` on `pnpm dev` clears stale SW; use `turbo build` + `turbo start -- --hostname 0.0.0.0` for PWA/install smoke tests on phone
- [ ] **Manual:** Verify install prompt on Android device; iOS Add to Home Screen on iPhone

---

## Phase B — Privacy & GDPR — PRD §9

- [x] `/privacy` route (customer app; link from profile + footer)
- [x] Cover: data collected, Supabase EU region, deletion request contact
- [x] Profile: “Request data deletion” mailto (`privacy@yorewards.com.np`)
- [x] Merchant settings link to customer privacy policy (`NEXT_PUBLIC_APP_URL/privacy`)

---

## Phase C — Empty & error states (all apps)

- [x] Customer: offline banner, camera denied, invalid QR, session expired (UNAUTHORIZED → sign in), wallet retry
- [x] Merchant: Day 4–5 empty states — spot-check OK; privacy link in settings
- [x] Admin: empty audit, customers, pending merchants — already implemented
- [x] Customer: `UNAUTHORIZED`, `FORBIDDEN`, `CUSTOMER_NOT_FOUND` in `errors.actions`

---

## Phase D — Responsiveness

- [ ] Customer: mobile-first pass (wallet, scan, pending)
- [ ] Merchant: counter tablet + phone sidebar
- [ ] Admin: desktop-only OK; min width sanity check

---

## Phase E — Full E2E matrix

| Flow                | Apps involved                                   |
| ------------------- | ----------------------------------------------- |
| Merchant onboarding | customer N/A · merchant · admin approve         |
| Stamp collect       | customer scan · merchant queue                  |
| Reward redeem       | customer OTP · merchant redeem                  |
| Admin manual stamp  | admin tool · customer wallet                    |
| Multi-branch        | customer scan branch B · merchant branch filter |

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
- [ ] [`V2_Backlog.md`](../v2/V2_Backlog.md) — triage post-launch items

---

## Done when

- [ ] Three production URLs live and healthy
- [ ] PWA install works on at least one mobile device
- [x] Privacy page published
- [ ] Founder sign-off on full loop demo

---

_Previous: [`Day7_Checklist.md`](Day7_Checklist.md) · V2: [`V2_Backlog.md`](../v2/V2_Backlog.md)_
