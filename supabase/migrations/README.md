# Supabase migrations

Supabase runs **every `.sql` file in this folder once**, in **filename order** (timestamp prefix).

## Day 1 init (read in this order)

| File                                        | What it does                                  |
| ------------------------------------------- | --------------------------------------------- |
| `20260607120000_extensions.sql`             | Postgres extensions (`pgcrypto`)              |
| `20260607120001_tables.sql`                 | 8 core tables + indexes                       |
| `20260607120002_functions.sql`              | RPCs (`increment_stamps`, `void_stamp`, etc.) |
| `20260607120003_realtime_and_grants.sql`    | Realtime on `stamp_sessions` + role grants    |
| `20260607130000_rls_policies.sql`           | Row Level Security + helper functions         |
| `20260607140000_storage_merchant_logos.sql` | `merchant-logos` bucket + storage RLS         |

## Day 2 additions

| File                                          | What it does                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `20260607150000_multi_business_ownership.sql` | Multi-business per owner: drops `merchants.user_id` UNIQUE, adds `current_merchant_ids()`, re-points merchant RLS to the owned set |

## Day 3 additions

| File                                    | What it does                                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260611120000_merchant_locations.sql` | Branches per business: `merchant_locations` table, nullable `location_id` on `stamp_sessions` / `redemptions`, backfill primary location, RLS |

## Rules

- **Never edit** a migration after it has been pushed to production — add a new file instead.
- **One concern per file** keeps diffs readable (tables vs functions vs RLS).
- Apply locally / cloud: `pnpm exec supabase db push`

## Why SQL files?

This is the standard Supabase pattern — version-controlled schema that replays identically on every environment. You rarely write SQL by hand after Day 1; most changes are additive migrations generated or authored when features ship.
