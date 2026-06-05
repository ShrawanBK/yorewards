# Turborepo App Setup Guide

How to add a new Next.js app to the YORewards monorepo.

---

## Layout

```
yorewards/
├── apps/
│   ├── web/          → port 3000
│   ├── docs/         → port 3001
│   └── customer/     → port 3002
├── packages/
│   ├── ui/                   → shared React components
│   ├── eslint-config/        → shared ESLint rules
│   └── typescript-config/    → shared tsconfig bases
├── package.json              → root scripts (turbo run …)
├── pnpm-workspace.yaml       → workspace definition
├── pnpm-lock.yaml            → single lockfile for the whole repo
└── turbo.json                → task pipeline (build, lint, dev, check-types)
```

Apps go under `apps/`. Root `pnpm-workspace.yaml` already includes `apps/*` — no root config changes needed for a standard new app.

**Always run `pnpm` from the repo root**, never from inside `apps/<name>/`.

---

## Setup checklist

### 1. Clean up standalone artifacts

Delete from the app folder if present:

- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `node_modules/`

### 2. `package.json`

**Scripts** (names must match `turbo.json`):

```json
{
  "scripts": {
    "dev": "next dev --port 3XXX",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --max-warnings 0",
    "check-types": "next typegen && tsc --noEmit"
  }
}
```

Assign the next free port: `web` 3000, `docs` 3001, `customer` 3002, then 3003+.

**Workspace dependencies** (add manually before install):

```json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "eslint": "^9",
    "typescript": "^5"
  }
}
```

Or from the repo root:

```sh
pnpm add @repo/ui --filter <app>
pnpm add -D @repo/eslint-config @repo/typescript-config --filter <app>
```

App-specific deps (e.g. Tailwind) stay in that app's `package.json` only. Version numbers across apps do not need to match.

### 3. `tsconfig.json`

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "strictNullChecks": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "next-env.d.ts",
    "next.config.ts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

Use `next.config.js` in `include` if the app uses a `.js` config (see `web` / `docs`). Omit `paths` if the app does not use `@/` imports.

### 4. `eslint.config.js`

```js
import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default nextJsConfig;
```

### 5. Install and verify

From the repo root:

```sh
pnpm install
ls apps/<app>/node_modules/@repo
pnpm exec turbo lint --filter=<app>
pnpm exec turbo check-types --filter=<app>
pnpm exec turbo build --filter=<app>
```

`pnpm install` links packages already listed in `package.json` — it does not add `@repo/*` entries for you.

Workspace packages symlink to `apps/<app>/node_modules/@repo/`, not the repo root. Open the **repo root** in your editor.

---

## Commands

```sh
# All apps
pnpm dev | pnpm build | pnpm lint | pnpm check-types

# Single app
pnpm exec turbo dev --filter=<app>
pnpm exec turbo build --filter=<app>

# Add a dependency to one app
pnpm add <pkg> --filter <app>
```

---

## New app on Vercel

Set **Root Directory** to `apps/<name>`.
