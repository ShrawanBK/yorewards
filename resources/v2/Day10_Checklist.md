# YORewards — V2 Day 10 (Account Verification: Email + SMS OTP)

> **Goal:** Real accounts, not fakes. Merchant owners verify by **email (free)**; customers verify **phone by SMS OTP**. One provider abstraction routes NP → Sparrow, FI → Twilio/GatewayAPI.
> **Reference:** [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0.2, §0.3, §4.2 · [`V2_Backlog.md`](V2_Backlog.md) §Merchant KYC
> **Prerequisite:** [`Day9_Checklist.md`](Day9_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| SMS provider abstraction (`sms/send-sms.ts`) | ✅ |
| Merchant owner email verification gate | ✅ |
| Customer signup phone OTP | ✅ |
| Rate limit / resend cooldown | ✅ |

---

## Verification decision (locked)

- **Merchant owner → email verification (FREE).** Merchants are email-first; no SMS cost.
- **Customer → phone OTP (SMS).** Nepal customers are phone-first; there is **no free reliable SMS** — use paid providers via abstraction.
- **Rejected free options:** WhatsApp auth templates (Meta cost + friction, unreliable NP); customer email OTP (breaks phone-first identity).

---

## Day 10 "done" when

- [x] Merchant owner cannot reach `active` without a **verified email**
- [x] Customer signup requires a **valid phone OTP** before the wallet is usable
- [x] SMS routes NP → Sparrow, FI → Twilio/GatewayAPI through one abstraction (signup + redemption reuse it)
- [x] OTP rate-limited (max sends / cooldown); expired/invalid codes error cleanly
- [x] Error codes registered; all copy translated (Day 11 fills ne/fi)

---

## A. SMS provider abstraction

- [x] Refactor `packages/supabase/src/sms/send-redemption-otp.ts` → generic `sms/send-sms.ts` (`sendSms({ phone, countryCode, text })`) with provider routing
- [x] Providers: Sparrow (NP), Twilio (FI) today; leave a seam for **GatewayAPI** (FI direct route — better EU deliverability) without hardcoding
- [x] Redemption OTP + signup OTP both call `sendSms`; dev logs when unconfigured (keep current behaviour)

## B. Customer signup phone OTP

- [x] Extend `otp_tokens.purpose` to include `'signup'` (text column — no enum migration pain per Technical Doc §… )
- [x] Send OTP on signup; verify before wallet is active (or block first meaningful action)
- [x] Reuse the redemption OTP UI/pattern; 6-digit, 5-min expiry
- [x] Resend cooldown + max attempts; lockout copy translated

## C. Merchant owner email verification

- [x] Require **verified email** (Supabase email confirmation) before `status: active` — combine with existing credible-fields gate (Day 6)
- [x] Resend-verification action + clear pending-verification UI state
- [x] Optional (deferred flag, not blocking): owner **phone OTP** — leave the hook, do not gate on it

## D. Rate limiting & abuse guards

- [x] Per-phone send limits (reuse `OTP_SEND_RATE_LIMIT` from `@repo/utils/otp`)
- [x] Log failures with `logActionFailure`; never leak provider errors to the client
- [x] Error codes → `@repo/utils/action-error` + `errors.actions.*` (`OTP_EXPIRED`, `OTP_INVALID`, `OTP_RATE_LIMITED`, `EMAIL_NOT_VERIFIED`, …)

## E. QA

- [ ] New customer: signup → receives OTP (or dev log) → verifies → wallet active
- [ ] New merchant: cannot go `active` until email verified; resend works
- [ ] NP number routes Sparrow; FI number routes Twilio (or Twilio when Sparrow unset / dev log)
- [ ] Rate limit triggers after N sends; expired code rejected
- [ ] No new migration required (`otp_tokens.purpose` already includes `signup`)
- [ ] `pnpm lint` · `pnpm check-types` · `pnpm build` green

---

_Previous: [`Day9_Checklist.md`](Day9_Checklist.md) · Next: [`Day11_Checklist.md`](Day11_Checklist.md) · Sprint index: [`README.md`](README.md)_
