# Merchant Dashboard — Design System

> Generated from ui-ux-pro-max recommendations (June 2026). Apply to `apps/merchant` protected routes.

## Visual direction

- **Mode:** Dark (OLED-inspired) — default via `className="dark"` on `<html>`
- **Feel:** Professional SaaS dashboard; subtle purple brand accents, not flat white
- **Typography:** Plus Jakarta Sans (`next/font/google`)

## Palette (WCAG AA–tuned)

| Token | Value / usage |
| ----- | ------------- |
| Background | `oklch(0.13 0.02 265)` |
| Card | `oklch(0.19 0.025 265)` |
| Primary (buttons) | `oklch(0.56 0.23 293)` + white foreground |
| Accent text (nav/links) | `--accent-text` `oklch(0.82 0.14 293)` |
| Body helper | `merchant-body-muted` / `--muted-foreground` `oklch(0.78 …)` |
| Stat labels | `merchant-stat-label` `oklch(0.84 …)` |
| Pending badge | amber outline (`MERCHANT_STATUS_BADGE`) |

## Layout (PRD §1.5)

- **Desktop:** Fixed left sidebar (`w-64`), main content `max-w-6xl` centered
- **Mobile:** Top bar + collapsible nav drawer
- **Page chrome:** `PageHeader` (title + description + optional actions)
- **No layout-level `<ViewTransition>`** — page-level VT only when added

## Surface utilities (`apps/merchant/src/app/globals.css`)

| Class | Use |
| ----- | --- |
| `merchant-mesh-bg` | App shell + auth right panel background |
| `merchant-glass-card` | Cards, forms, stat tiles |
| `merchant-glass-panel` | Secondary panels |
| `merchant-stat-label` | Uppercase stat labels (readable on dark cards) |
| `merchant-body-muted` | Helper / secondary body text (WCAG AA on dark) |
| `MERCHANT_STATUS_BADGE` | Shared status badge contrast (`@/shared/constants/status-badges`) |

## Components

- Shared primitives: `@repo/ui` (Button, Card, Field, Skeleton, …)
- App shared: `@/shared/ui/PageHeader`
- Shell: `@/widgets/MerchantShell` — sidebar + mobile nav

## Accessibility

- **Rules:** `.cursor/rules/accessibility.mdc` (project-wide, always on)
- **Shell:** `SkipLink` → `#main-content`; nav `aria-current="page"`; mobile menu `aria-expanded` / `aria-controls`
- **Pages:** one `h1` per route (`PageHeader`); sections use `aria-label` or `aria-labelledby`
- **Forms:** `@repo/ui/field` labels; errors with `role="alert"`
- **Motion:** `prefers-reduced-motion` in `globals.css`; no hover-only required actions
- **Theme:** `color-scheme: dark` on `<html>`
- **Audit:** run `web-design-guidelines` skill on changed merchant UI files

## Do / don't

- ✅ All copy via `next-intl` (`messages/en.json`)
- ✅ Use semantic tokens (`bg-card`, `text-muted-foreground`) — not hardcoded hex in features
- ✅ Glass cards on dark; borders `border-white/6`–`/10`
- ❌ Plain white page backgrounds in protected routes
- ❌ Top-only nav on desktop (use sidebar)
- ❌ Hardcoded English strings

## References

- PRD §1.4 motion (shimmer on card preview — CSS only for now)
- PRD §1.5 sidebar layout
- `.cursor/rules/merchant-ui.mdc`
