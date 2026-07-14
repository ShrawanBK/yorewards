# YORewards — V2 Day 4 (Spend Insights + Merchant CRM)

> **Goal:** Both sides see spend data; merchant can export customers.  
> **Reference:** V2 PRD §3.5, §4.6–4.7 · [`V2_Backlog.md`](V2_Backlog.md) (CSV, branch analytics)  
> **Prerequisite:** [`Day3_Checklist.md`](Day3_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Customer `/insights` | ✅ |
| Merchant CRM + CSV | ✅ |
| Spend analytics | ✅ |

---

## Day 4 “done” when

- [x] Customer sees monthly spend total + per-merchant chart
- [x] Merchant customer list with detail drawer + segments
- [x] CSV export works (Starter+ gate)
- [x] Branch filter on merchant analytics

---

## A. Customer insights

- [x] `/insights` — monthly total, per-merchant bar chart (Recharts), vs last month delta
- [x] Spending history feed — filter by merchant, date, amount

## B. Merchant CRM (`/merchant/customers`)

- [x] List: search, sort (spend / visits / last visit)
- [x] **Detail drawer:** profile, segment (VIP/Regular/At-Risk/New/Lapsed), stamp + reward history, notes
- [x] **CSV export** (Starter+ gate)
- [x] **Per-branch analytics** — location filter on charts

## C. Merchant analytics

- [x] Spend dashboard: loyalty revenue, avg spend/visit, week trend sparkline

## D. QA

- [ ] CSV downloads; insight numbers match `stamp_transactions`
- [ ] Run `pnpm exec supabase db push` for `20260707120000_v2_day4_crm_insights.sql`

---

_Previous: [`Day3_Checklist.md`](Day3_Checklist.md) · Next: [`Day5_Checklist.md`](Day5_Checklist.md)_
