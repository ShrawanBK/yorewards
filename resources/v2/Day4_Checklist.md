# YORewards — V2 Day 4 (Spend Insights + Merchant CRM)

> **Goal:** Both sides see spend data; merchant can export customers.  
> **Reference:** V2 PRD §3.5, §4.6–4.7 · [`V2_Backlog.md`](../V2_Backlog.md) (CSV, branch analytics)  
> **Prerequisite:** [`Day3_Checklist.md`](Day3_Checklist.md)

---

## Implementation status

| Area | Status |
| ---- | ------ |
| Customer `/insights` | ⏳ |
| Merchant CRM + CSV | ⏳ |
| Spend analytics | ⏳ |

---

## Day 4 “done” when

- [ ] Customer sees monthly spend total + per-merchant chart
- [ ] Merchant customer list with detail drawer + segments
- [ ] CSV export works (Starter+ gate)
- [ ] Branch filter on merchant analytics

---

## A. Customer insights

- [ ] `/insights` — monthly total, per-merchant bar chart (Recharts), vs last month delta
- [ ] Spending history feed — filter by merchant, date, amount

## B. Merchant CRM (`/merchant/customers`)

- [ ] List: search, sort (spend / visits / last visit)
- [ ] **Detail drawer:** profile, segment (VIP/Regular/At-Risk/New/Lapsed), stamp + reward history, notes
- [ ] **CSV export** (Starter+ gate)
- [ ] **Per-branch analytics** — location filter on charts

## C. Merchant analytics

- [ ] Spend dashboard: loyalty revenue, avg spend/visit, week trend sparkline

## D. QA

- [ ] CSV downloads; insight numbers match `stamp_transactions`

---

_Previous: [`Day3_Checklist.md`](Day3_Checklist.md) · Next: [`Day5_Checklist.md`](Day5_Checklist.md)_
