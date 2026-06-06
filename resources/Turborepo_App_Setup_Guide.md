# Turborepo App Setup Guide

Add a new Next.js app to the YORewards monorepo.

## Layout

```
yorewards/
├── apps/
│   ├── customer/     → Customer PWA        · localhost:3000 · app.yorewards.com
│   ├── merchant/     → Merchant Dashboard  · localhost:3001 · merchant.yorewards.com
│   └── admin/        → Super Admin         · localhost:3002 · admin.yorewards.com
├── packages/
│   ├── ui/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── tailwind-config/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

`pnpm-workspace.yaml` already includes `apps/*`. **Always run `pnpm` from the repo root.**

---

## Setup

### 1. Scaffold

```sh
pnpm create next-app apps/<app> --typescript --tailwind --eslint --app --no-src-dir
```

Use the next free port: Customer PWA `3000`, Merchant Dashboard `3001`, Super Admin `3002`, then `3003+`.

### 2. Clean up

Delete from the app folder if present: `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `node_modules/`.

Remove from `package.json` if scaffolded: `eslint-config-next`, `tailwindcss`, `@tailwindcss/postcss`.

### 3. `package.json`

Add `"type": "module"` and these scripts (names must match `turbo.json`):

```json
{
  "scripts": {
    "dev": "next dev --port 3XXX",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --max-warnings 0",
    "check-types": "next typegen && tsc --noEmit"
  },
  "dependencies": {
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/tailwind-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "eslint": "^9",
    "typescript": "^5"
  }
}
```

Or from the repo root:

```sh
pnpm add @repo/ui --filter <app>
pnpm add -D @repo/eslint-config @repo/tailwind-config @repo/typescript-config --filter <app>
```

Keep `eslint` and `typescript` in each app. Do **not** add `eslint-config-next`.

### 4. `tsconfig.json`

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

### 5. `eslint.config.js`

```js
import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default nextJsConfig;
```

### 6. Tailwind — `postcss.config.mjs` + `tailwind.config.ts`

`postcss.config.mjs`:

```js
export { default } from "@repo/tailwind-config/postcss";
```

`tailwind.config.ts`:

```ts
import sharedConfig from "@repo/tailwind-config";

export default {
  presets: [sharedConfig],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
};
```

### 7. Verify

```sh
pnpm install
pnpm exec turbo lint --filter=<app>
pnpm exec turbo check-types --filter=<app>
pnpm exec turbo build --filter=<app>
```

Open the **repo root** in your editor. Workspace packages symlink to `apps/<app>/node_modules/@repo/`.

---

## Commands

```sh
pnpm dev | pnpm build | pnpm lint | pnpm check-types          # all apps
pnpm exec turbo dev --filter=<app>                            # one app
pnpm add <pkg> --filter <app>                                 # add dependency
```

## Vercel

Set **Root Directory** to `apps/<name>`.
