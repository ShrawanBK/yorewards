# YORewards — V2 Backlog (post–merchant MVP)

> Items explicitly **out of MVP** but worth preserving so we do not re-debate them each build day.  
> MVP invariant (Day 3–5): **one `loyalty_cards` row per business**, all active branches share the same customer balance; `location_id` is attribution only.

---

## Loyalty program scoping (multi-branch)

**Problem:** Some merchants may want different rules per outlet — e.g. stamp at kiosk A but redeem only at main store, or separate programs per branch.

**Current MVP:** One card, all active branches, redeem anywhere in the business. Control = deactivate branch (`is_active`) to hide its QR only.

**V2 options (pick one when building):**

| Model | Use case | Schema sketch |
| ----- | -------- | ------------- |
| **Subset of branches** | Card valid at 3 of 5 outlets | `loyalty_card_locations(loyalty_card_id, location_id, stamp_allowed, redeem_allowed)` |
| **Earn anywhere, redeem at primary** | Airport kiosk stamps, downtown redeems | `redeem_at_primary_only` flag on `loyalty_cards` + validate in `complete_redemption` |
| **Separate card per branch** | Franchise-style independence | Multiple `loyalty_cards` per merchant + branch assignment (larger change to wallet + QR) |

**Touch points when implemented:** QR scan validation (Day 7 customer), `createPendingStampSession`, redeem lookup, merchant loyalty-card config UI, PRD §6.1 + Technical Doc §4.7.

---

## Other v2 items (from PRD §12–13)

- Multi-staff accounts (`merchant_staff`) + role permissions
- Phone OTP at customer signup (not just redemption)
- Nepali + Finnish translations (next-intl keys exist)
- Customer detail drawer + CSV export on `/merchant/customers`
- Per-branch analytics charts (beyond `location_id` filter)
- Merchant subscription billing (Stripe + eSewa / MobilePay)
- Auto-approve merchant registration
- Password change + email change flows (merchant/admin)
- Push / email when merchant approved (`§6.5` table)

---

_Last updated: June 2026 · See also PRD §13 Future Roadmap_
