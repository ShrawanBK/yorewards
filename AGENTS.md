# YORewards — Agent Instructions

This monorepo builds **YORewards**, a digital loyalty stamp wallet (Nepal + Finland).

## Required reading

Before feature work, read the current versions of:

1. [`resources/YORewards_PRD_Final_v1.md`](resources/YORewards_PRD_Final_v1.md) — product requirements, routes, MVP scope, locked stack
2. [`resources/YORewards_Technical_Doc_v1.md`](resources/YORewards_Technical_Doc_v1.md) — architecture, DB schema, auth, pitfalls, build plan
3. [`resources/Turborepo_App_Setup_Guide.md`](resources/Turborepo_App_Setup_Guide.md) — adding apps to the monorepo
4. **Build day checklists** — [`resources/Day6_Checklist.md`](resources/Day6_Checklist.md) (current: super admin); merchant ✅ [`Day5_Checklist.md`](resources/Day5_Checklist.md); customer → [`Day7_Checklist.md`](resources/Day7_Checklist.md); launch → [`Day8_Checklist.md`](resources/Day8_Checklist.md); V2 in [`resources/V2_Backlog.md`](resources/V2_Backlog.md)

Keep docs in `resources/`. Update them there; do not duplicate requirements into code comments.

## Accessibility

All UI must meet `.cursor/rules/accessibility.mdc` — keyboard navigation, screen reader labels (via `next-intl` `a11y.*` keys), visible focus, semantic HTML, and `prefers-reduced-motion`. Use the `web-design-guidelines` skill to audit before merging large UI changes.

## Apps

| Folder | App | Local | Production |
| ------ | --- | ----- | ---------- |
| `apps/customer` | Customer PWA | `localhost:3000` | `app.yorewards.com` |
| `apps/merchant` | Merchant Dashboard | `localhost:3001` | `merchant.yorewards.com` |
| `apps/admin` | Super Admin | `localhost:3002` | `admin.yorewards.com` |

## Commands

```sh
pnpm install                          # from repo root
pnpm exec turbo dev --filter=customer # single app
pnpm build | pnpm lint | pnpm check-types  # all apps
```

## Server action errors

Server actions return **UPPER_SNAKE_CASE error codes** only — never user-facing English strings. See `.cursor/rules/server-action-errors.mdc` and `packages/utils/src/action-error.ts`.
