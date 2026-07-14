# Day 9–10 Design Decisions — Notifications & Verification

Settled decisions for the notification system (Day 9) and account verification (Day 10). Read before building either so we don't re-litigate or rebuild what already exists.

Related: `Day9_Checklist.md`, `Day10_Checklist.md`, `../YORewards_PRD_Final_v2.md` §0, `../YORewards_Technical_Doc.md`, `packages/supabase/AGENTS.md`.

---

## Already in the codebase — build ON these, don't rebuild

| Capability | Where | Reuse for |
| ---------- | ----- | --------- |
| Transactional email via Resend HTTP API (no SDK, no-ops without key) | `packages/utils/src/merchant-email.ts` (`sendMerchantApprovedEmail`, `sendStaffInviteEmail`) | Day 9 email channel |
| SMS provider abstraction — Sparrow (NP) / Twilio (FI), dev-log fallback | `packages/supabase/src/sms/send-redemption-otp.ts` | Day 10 OTP send |
| OTP generation, bcrypt hashing, expiry + send rate limit | `packages/utils/src/otp.ts` (`generateSixDigitOTP`, `hashOtp`, `verifyOtpHash`, `OTP_EXPIRY_MS`, `OTP_SEND_RATE_LIMIT`) | Day 10 phone OTP |
| Phone helpers | `packages/utils/src/phone.ts` | Day 10 normalization |
| Merchant verification scaffolding | `packages/supabase/src/queries/merchant-verification.ts`, `VerificationStatus`, `MerchantStatus` = `…\|pending_verification` | Day 10 merchant path |
| Reward OTP flow (end-to-end reference) | `apps/customer/src/features/reward/api/rewardActions.ts` + `queries/reward-otp.ts` | Day 10 pattern to mirror |

`twilio` is already a dependency of `@repo/supabase`. Resend is called over plain `fetch` (no dependency).

---

## Day 9 — Notifications

### Decision: one `notifications` table, two channels

- Single table serves merchant staff, customers, and admins via a discriminated `recipient_type`.
- Channels: `in_app` (notification center) and `email` (Resend). SMS is **not** a notification channel in V2 — SMS is reserved for OTP only (cost control).

```
notifications(
  id uuid pk,
  recipient_type text check ('merchant_staff' | 'customer' | 'admin'),
  recipient_id uuid,             -- staff id / customer id / admin user id
  type text,                     -- 'dispute_filed' | 'dispute_resolved' | 'dispute_sla_breach'
                                 --  | 'reward_unlocked' | 'merchant_approved' | 'smart_promo'
  title_key text,                -- next-intl key, NOT rendered copy
  body_key text,                 -- next-intl key
  payload jsonb,                 -- interpolation params (businessName, amount, …)
  channel text check ('in_app' | 'email'),
  read_at timestamptz,
  created_at timestamptz default now()
)
```

Rationale:
- **Store keys, not text.** `title_key`/`body_key` + `payload` are resolved with `next-intl` at render time, so the same row renders in EN/NE/FI. Never store rendered English in the DB.
- **RLS:** recipient sees only their own rows (match on `recipient_id` + type-appropriate policy). Admin rows readable by admins only. Add policies in the same migration.

### Delivery layer

- Generalize `merchant-email.ts` into a reusable `sendTransactionalEmail({ to, subjectKey, ... })` while keeping the existing named helpers as thin wrappers (don't break current callers).
- **Email sends are non-blocking:** fire from `after()` (Next.js) or a post-commit hook, never inside the request's critical path. A failed email must not fail the mutation.
- Writing the `in_app` row is part of the transaction; sending the `email` copy is best-effort after.

### Triggers (V2 scope)

| Event | Recipients | Channels |
| ----- | ---------- | -------- |
| Dispute filed | merchant staff (owner/manager) | in_app + email |
| Dispute resolved | customer | in_app + email |
| Dispute SLA breach (48h) | admin | in_app + email |
| Reward unlocked | customer | in_app |
| Merchant approved | merchant owner | email (already exists — also write in_app row) |
| Smart promo | customer | in_app |

### SLA breach cron

- The 48h auto-escalation (`DISPUTE_MERCHANT_SLA_HOURS` in `stamp-disputes-shared.ts`) needs a scheduler — it currently exists only as client-side math.
- **Decision:** `pg_cron` job (Supabase) runs a `service-role` function that finds pending disputes past the window and inserts admin `notifications` rows (+ enqueues email). Idempotent — don't double-notify (guard on an escalated flag / existing notification).

### In-app notification center

- Bell + unread count in each app's header; dropdown/panel list; mark-as-read. TanStack Query for fetch/unread-count. **Not realtime** in V2 (realtime stays limited to stamp queue + disputes) — poll/refetch on focus is acceptable.

---

## Day 10 — Verification

### Decision: merchant = email, customer = phone OTP

| Actor | Method | Why |
| ----- | ------ | --- |
| Merchant owner | **Email verification** | Free, merchants are email-first, no per-message cost, ties to dashboard login. Moves status through `pending_verification` → `active`. |
| Customer | **Phone OTP (SMS)** | Customers are phone-first (Nepal especially); phone is the wallet identity. Paid, so rate-limited. |

### SMS: generalize the existing abstraction

- Extract the provider routing in `send-redemption-otp.ts` into a reusable `packages/supabase/src/sms/send-sms.ts` (`sendSms({ phone, countryCode, text })`) that both redemption OTP and signup OTP call. Keep NP→Sparrow, FI→Twilio, dev-log fallback.
- Finland: budget for a quality/direct route (cheap international routes are blocked → poor delivery). Twilio is the current FI path; a GatewayAPI adapter can slot in behind the same interface later without touching callers.

### Customer signup phone OTP

- Reuse `generateSixDigitOTP` + `hashOtp`/`verifyOtpHash` + `OTP_EXPIRY_MS` + `OTP_SEND_RATE_LIMIT` (3 sends / 15 min). Store only the **hash**, never the raw OTP.
- Mirror the reward-OTP flow structure (`reward-otp.ts`). Failures return `fail("CODE")` — add codes like `OTP_SEND_FAILED`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED` to `action-error.ts` + `errors.actions.*` in all three locales.

### Merchant owner email verification

- Use Supabase email verification / a Resend-sent verify link. Gate `active` behind verified email (status `pending_verification` until then). This closes the "zero-verification auto-approval" gap from the as-built PRD §3.3 without full document KYC (document KYC stays deferred to V3).

### Rate limiting

- OTP: reuse `OTP_SEND_RATE_LIMIT`. Enforce server-side per phone (and ideally per IP). Verify attempts also capped to prevent brute force.

---

## Out of scope for Day 9–10 (deferred to V3)

- SMS as a general notification channel (only OTP uses SMS in V2).
- Realtime notification center.
- Full document KYC / business-registration verification.
- Push notifications (native) — app is webapp-wrapped in V2.
- GatewayAPI FI adapter (interface is ready; wire when FI volume justifies).
