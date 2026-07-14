# YORewards — V2 Day 9 (Notifications: Merchant + Admin + Customer)

> **Goal:** No critical event is silent. Disputes, SLA breaches, resolutions, and reward unlocks reach the right person via **in-app centre + email** — not only if a dashboard happens to be open.
> **Reference:** [`YORewards_PRD_Final_v2.md`](../YORewards_PRD_Final_v2.md) §0.2, §3.9, §6.5 · [`V2_Backlog.md`](V2_Backlog.md) §Post-sprint (dispute SLA)
> **Prerequisite:** [`Day8_Checklist.md`](Day8_Checklist.md) — dispute loop code complete

---

## Implementation status

| Area | Status |
| ---- | ------ |
| `notifications` table + RLS | ⏳ |
| In-app notification centre (merchant + admin + customer) | ⏳ |
| Email delivery (Resend, generic) | ⏳ |
| Dispute + reward + approval triggers | ⏳ |
| SLA breach cron | ⏳ |

---

## Day 9 "done" when

- [ ] Merchant is notified (in-app + email) when a **dispute is filed**
- [ ] Admin is notified when a dispute **passes its 48h SLA**
- [ ] Customer is notified (in-app) when their **dispute is resolved** and when a **reward unlocks**
- [ ] Notification centre shows unread count + mark-as-read; all copy translated
- [ ] All new tables have RLS; error codes registered; delivery is non-blocking

---

## A. Schema / RLS

- [ ] Migration: `notifications(id, recipient_type ['merchant_staff'|'customer'|'admin'], recipient_id, type, title_key, body_key, payload jsonb, channel ['in_app'|'email'], read_at, created_at)`
- [ ] Index on `(recipient_type, recipient_id, read_at)` for unread lookups
- [ ] RLS: recipients read/update **only their own** rows; service role writes
- [ ] Reuse `smart_promo_notifications` (already exists) — surface in centre, do not duplicate

## B. Delivery layer (`@repo/utils` / `@repo/supabase`)

- [ ] Generalise `merchant-email.ts` → `sendNotificationEmail({ to, subjectKey, bodyKey, payload, locale })` (keep existing helpers as thin wrappers)
- [ ] `createNotification(...)` writes the row; optional `alsoEmail` flag routes through Resend
- [ ] Email is **non-blocking** — use `after()` (Next.js) or fire-and-forget; never block the mutation response
- [ ] No-op + `console.info` when `RESEND_API_KEY` unset (dev parity with existing behaviour)

## C. Triggers (server actions / RPC)

- [ ] **Dispute filed** → notify merchant owner + managers (in-app + email)
- [ ] **Dispute resolved** (any 3-way outcome) → notify customer (in-app; email optional)
- [ ] **Reward unlocked** (stamp target hit) → notify customer (in-app)
- [ ] **Merchant approved** → add in-app notification (email already exists Day 5)
- [ ] **"X more stamps"** smart promo → ensure it lands in the centre (already logged Day 6)
- [ ] Copy: `notifications.<type>.title` / `.body` keys in **all three** `messages/*.json` (Day 11 fills ne/fi)

## D. SLA breach cron

- [ ] Supabase Edge Function or `pg_cron` job: find disputes `pending` past 48h with no admin alert → `createNotification` for admins (in-app + email)
- [ ] Idempotent — do not re-alert the same dispute; mark `sla_alerted_at`
- [ ] Document schedule + how to run manually for testing

## E. In-app notification centre (all apps)

- [ ] Bell icon + unread badge in merchant sidebar, admin shell, customer header
- [ ] List: title, body, relative time, read/unread; mark-one + mark-all read
- [ ] **Supabase Realtime** subscription so new notifications appear without refresh (TanStack Query for the list per `root.mdc`)
- [ ] Empty state (heading + description), keyboard + screen-reader accessible per `accessibility.mdc`

## F. QA

- [ ] File dispute → merchant sees in-app + receives email (or dev log)
- [ ] Force a dispute past 48h → admin alerted once
- [ ] Resolve dispute → customer sees it; reward unlock → customer sees it
- [ ] Run `pnpm exec supabase db push` for the Day 9 notifications migration
- [ ] `pnpm lint` · `pnpm check-types` · `pnpm build` green (3 apps)

---

_Previous: [`Day8_Checklist.md`](Day8_Checklist.md) · Next: [`Day10_Checklist.md`](Day10_Checklist.md) · Sprint index: [`README.md`](README.md)_
