# V2 Day 8 — Manual E2E Runbook

Run locally: customer `:3000` · merchant `:3001` · admin `:3002`.

Tick each row after a successful pass. Log blockers in the Notes column.

| # | Flow | Steps | Customer | Merchant | Admin | Pass |
| --- | ---- | ----- | -------- | -------- | ----- | ---- |
| 1 | Merchant signup | Sign up → add business → admin approves (if pending) | — | ✓ | ✓ | ☐ |
| 2 | Customer signup | Sign up → wallet empty | ✓ | — | — | ☐ |
| 3 | QR stamp | Customer scan → merchant queue → approve with spend | ✓ | ✓ | — | ☐ |
| 4 | Wallet | Stamp appears on card; visit in history | ✓ | — | — | ☐ |
| 5 | Insights | Customer `/insights` shows spend for month | ✓ | — | — | ☐ |
| 6 | Dispute file | Card detail → Missing stamp → submit | ✓ | — | — | ☐ |
| 7 | Dispute merchant | Merchant disputes → reject / approve no stamp / approve + stamp (note required) | — | ✓ | — | ☐ |
| 8 | Dispute customer outcome | Customer card shows status + resolution note | ✓ | — | — | ☐ |
| 9 | Dispute admin SLA | Admin detail → early resolve confirm before 48h; overdue badge after 48h | — | — | ✓ | ☐ |
| 10 | Admin override | Admin resolves with stamp when merchant missed SLA | — | — | ✓ | ☐ |
| 11 | Upgrade path | Merchant billing / tier (Starter sandbox) | — | ✓ | ✓ | ☐ |
| 12 | Reward redeem | Full stamps → OTP → redeem (one reward type minimum) | ✓ | ✓ | — | ☐ |

## Reward type matrix (Phase E)

| Reward type | Stamp → redeem tested | Pass |
| ----------- | --------------------- | ---- |
| `free_item` | | ☐ |
| `percent_discount` | | ☐ |
| `fixed_discount` | | ☐ |

## Notes

- Demo merchants / customers:
- Blockers:
- Date run:
- Run by:
