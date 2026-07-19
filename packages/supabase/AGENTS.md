# `@repo/supabase` — Data Layer Instructions

All DB access for every app lives here. Apps import query functions from this package's `exports`; they do **not** create their own Supabase clients or hand-write SQL in feature code.

## Clients — pick the right one

| Export | When to use |
| ------ | ----------- |
| `@repo/supabase/client` | Browser / client components (anon key, RLS enforced). |
| `@repo/supabase/server` | Server components, server actions, route handlers (SSR cookies, RLS enforced). Pulls `next/headers` — **never import into a client component or a client-imported module.** |
| `@repo/supabase/service-role` | Privileged server-only paths that must bypass RLS (cron, admin escalation, system inserts). Use sparingly and only after an auth/authorization check. |
| `@repo/supabase/proxy`, `active-merchant`, `active-location`, `acting-staff` | Request-scoped context helpers. |

## The client-safe split (critical — this caused a build break)

`server.ts` transitively imports `next/headers`, which **cannot** be bundled into a client component. So any type, enum, or pure helper a client component needs must live in a **`*-shared.ts`** module that imports **only `../types`** (no `server`, no `service-role`).

- Server-only DB functions → `queries/<domain>.ts` (imports `../server` / `../service-role`).
- Client-safe types + pure helpers (statuses, SLA math, filters) → `queries/<domain>-shared.ts`.
- Reference: `queries/stamp-disputes.ts` (server) + `queries/stamp-disputes-shared.ts` (client-safe).

When you add either file, register its path in this package's `package.json` `exports` map, or the import will fail.

## Query function conventions

- One file per domain under `src/queries/`. Named async functions, typed inputs and return types (no `any`).
- Accept resolved identifiers (`customerId`, `merchantId`) — do the auth/session resolution in the caller (server action), not inside the query.
- Return domain types (mapped/camelCased), not raw rows, when the shape crosses into UI.
- Never throw user-facing strings; let the calling server action map failures to `fail("CODE")`.

## Types — `types.ts` is the source of truth

- `src/types.ts` is **hand-maintained**. It holds the `Database` type plus **strict unions** (`CountryCode`, `CurrencyCode`, `MerchantStatus`, `VerificationStatus`, `SubscriptionStatus`, `MerchantStaffRole`, …) that mirror Postgres check constraints — codegen would flatten these to `string`.
- `pnpm supabase:types` writes raw CLI output to `src/types.generated.ts` (**gitignored**). Use it only to diff after a schema change, then merge new tables/columns into `types.ts` by hand and re-apply the strict unions.
- Never import `types.generated.ts` from app code — import from `@repo/supabase/types`.

## Migrations & RLS

- Migrations live in `supabase/migrations/` (repo root), named `YYYYMMDDHHMMSS_<slug>.sql`; V2 files use the `_v2_` marker.
- **RLS is mandatory.** Enable RLS and add policies in the *same* migration that creates the table — never ship a table without policies.
- Apply with `pnpm exec supabase db push` (linked project). After applying, update `types.ts` (see above).
- Put atomic multi-row operations in Postgres functions/RPCs (see `20260714120000_stamp_dispute_atomic_resolution.sql`) rather than multiple round-trips.

## Realtime

- Realtime is limited to the **stamp approval queue** and **disputes** (`src/realtime/*`). All other server data goes through TanStack Query. Do not add new realtime channels without a product reason.

## Already present (don't rebuild)

- SMS: `twilio` is a dependency; OTP + phone helpers live in `@repo/utils` (`otp.ts`, `phone.ts`).
- Merchant verification scaffolding exists: `queries/merchant-verification.ts`, `VerificationStatus`, and `MerchantStatus` includes `pending_verification`.
