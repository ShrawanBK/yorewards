# YORewards — Agent Instructions

This monorepo builds **YORewards**, a digital loyalty stamp wallet (Nepal + Finland).

## Required reading

Before feature work, read the current versions of:

1. [`resources/YORewards_PRD_Final_v1.md`](resources/YORewards_PRD_Final_v1.md) — product requirements, routes, MVP scope, locked stack
2. [`resources/YORewards_Technical_Doc_v1.md`](resources/YORewards_Technical_Doc_v1.md) — architecture, DB schema, auth, pitfalls, build plan
3. [`resources/Turborepo_App_Setup_Guide.md`](resources/Turborepo_App_Setup_Guide.md) — adding apps to the monorepo

Keep docs in `resources/`. Update them there; do not duplicate requirements into code comments.

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
