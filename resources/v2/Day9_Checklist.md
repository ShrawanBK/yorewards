# YORewards — V2 Day 9 (Notifications: Merchant + Admin + Customer)

> **Goal:** No critical event is silent. Disputes, SLA breaches, resolutions, and reward unlocks reach the right person via **in-app centre + email** — not only if a dashboard happens to be open.
> **Reference:** [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0.2, §3.9, §6.5 · [`V2_Backlog.md`](V2_Backlog.md) §Post-sprint (dispute SLA)
> **Prerequisite:** [`Day8_Checklist.md`](Day8_Checklist.md) — dispute loop code complete

---

## Implementation status

| Area | Status |
| ---- | ------ |
| `notifications` table + RLS | ✅ |
| In-app notification centre (merchant + admin + customer) | ✅ |
| Email delivery (Resend, generic) | ✅ |
| Dispute + reward + approval triggers | ✅ |
| SLA breach cron | ✅ |

---

## Day 9 "done" when

- [x] Merchant is notified (in-app + email) when a **dispute is filed**
- [x] Admin is notified when a dispute **passes its 48h SLA**
- [x] Customer is notified (in-app) when their **dispute is resolved** and when a **reward unlocks**
- [x] Notification centre shows unread count + mark-as-read; all copy translated (en)
- [x] All new tables have RLS; error codes registered; delivery is non-blocking

---

## A. Schema / RLS

- [x] Migration: `notifications(id, recipient_type, recipient_id, type, title_key, body_key, payload, channel, read_at, created_at)`
- [x] Index on `(recipient_type, recipient_id, read_at)` for unread lookups
- [x] RLS: recipients read/update **only their own** in-app rows; service role writes
- [x] Reuse `smart_promo_notifications` — also writes `notifications` row on send

## B. Delivery layer (`@repo/utils` / `@repo/supabase`)

- [x] `transactional-email.ts` — generic Resend helper + notification templates
- [x] `createNotification` / `insertNotification` writes the row; email is fire-and-forget
- [x] Email is **non-blocking** — never blocks the mutation response
- [x] No-op + `console.info` when `RESEND_API_KEY` unset (dev parity)

## C. Triggers (server actions / RPC)

- [x] **Dispute filed** → notify merchant owner + managers (in-app + email to owner)
- [x] **Dispute resolved** (any outcome) → notify customer (in-app)
- [x] **Reward unlocked** (`pending_otp`) → notify customer (in-app)
- [x] **Merchant approved** → in-app notification (+ existing email)
- [x] **"X more stamps"** smart promo → `notifications` row in centre
- [x] Copy: `notifications.*` keys in `messages/en.json` (ne/fi → Day 11)

## D. SLA breach cron

- [x] `process_dispute_sla_breach_notifications()` SQL + optional `pg_cron` hourly job
- [x] Admin app route `GET /api/cron/dispute-sla` (Bearer `CRON_SECRET`) sends admin emails idempotently
- [x] Idempotent via `stamp_disputes.sla_alerted_at`

## E. In-app notification centre (all apps)

- [x] Bell icon + unread badge in merchant sidebar, admin sidebar, customer shell
- [x] Dedicated notifications page per app with category tabs (disputes / rewards|account / promotions)
- [x] Per-type actions (e.g. dispute → detail page; reward → claim/card)
- [x] Mark-one + mark-all read; TanStack Query with 60s poll (no Realtime — per design doc)
- [x] Empty state (heading + description), keyboard + screen-reader accessible

## F. QA

- [ ] File dispute → merchant sees in-app + receives email (or dev log)
- [ ] Force a dispute past 48h → admin alerted once
- [ ] Resolve dispute → customer sees it; reward unlock → customer sees it
- [ ] Run `pnpm exec supabase db push` for the Day 9 notifications migration
- [x] `pnpm lint` · `pnpm check-types` · `pnpm build` green (3 apps)

---

_Previous: [`Day8_Checklist.md`](Day8_Checklist.md) · Next: [`Day10_Checklist.md`](Day10_Checklist.md) · Sprint index: [`README.md`](README.md)_
