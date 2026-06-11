# Next.js Feature-Driven Architecture — Project Structure

## Full Directory Tree

```
src/
├── app/                          # Next.js App Router — ROUTING ONLY
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Imports from features/auth
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── api/                      # Route handlers only
│   │   └── [...]/route.ts
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # QueryClient, Zustand, ThemeProvider
│
├── features/                     # Business features (the core of your app)
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm, OAuthButton
│   │   ├── hooks/                # useLogin.ts, useSession.ts
│   │   ├── store/                # authStore.ts (Zustand slice)
│   │   ├── api/                  # authQueries.ts (React Query)
│   │   ├── types/                # auth.types.ts
│   │   ├── utils/                # token helpers, validators
│   │   └── index.ts              # Public barrel — only export what others need
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── [feature-name]/           # One folder per business domain
│       └── ...same pattern
│
├── entities/                     # Shared domain models (no UI)
│   ├── user/
│   │   ├── model/                # User type, schema, validators
│   │   └── index.ts
│   └── [domain]/
│
├── widgets/                      # Assembled UI blocks from multiple features
│   ├── Navbar/
│   │   ├── Navbar.tsx            # Composes auth + navigation features
│   │   └── index.ts
│   └── Sidebar/
│
├── shared/                       # Zero business logic — pure utilities
│   ├── ui/                       # Button, Input, Modal, Badge (shadcn/ui base)
│   ├── lib/
│   │   ├── queryClient.ts        # React Query global config
│   │   ├── axios.ts              # Axios instance + interceptors
│   │   └── zustand.ts            # Zustand devtools wrapper
│   ├── hooks/                    # useDebounce, useMediaQuery, useLocalStorage
│   ├── utils/                    # cn(), formatDate(), parseError()
│   ├── types/                    # Global TS types (ApiResponse<T>, etc.)
│   └── constants/                # API_URL, ROUTES, etc.
│
└── styles/
    └── globals.css
```

---

## Layer Rules (what can import what)

```
app         → features, widgets, shared
widgets     → features, entities, shared
features    → entities, shared
entities    → shared
shared      → nothing internal
```

**Never:**
- `features/auth` importing from `features/dashboard`
- `shared/` importing from `features/`
- `app/` containing business logic

---

## Feature Anatomy

Every feature follows this exact internal structure:

```
features/[name]/
├── components/     UI components (only used inside this feature)
├── hooks/          Custom hooks wrapping store + queries
├── store/          Zustand slice (feature-scoped state)
├── api/            React Query hooks (useQuery, useMutation)
├── types/          Feature-local TypeScript types
├── utils/          Feature-local pure functions
└── index.ts        Public API — the ONLY export point
```

### Example `index.ts`
```ts
// features/auth/index.ts — only export what OTHER features/pages need
export { LoginForm } from './components/LoginForm'
export { useSession } from './hooks/useSession'
export type { AuthUser } from './types/auth.types'
// DO NOT export internal hooks, store slices, raw API calls
```

---

## State Management Rules (Zustand)

- One store slice per feature: `features/auth/store/authStore.ts`
- Global cross-feature state only: `shared/lib/zustand.ts`
- Never put server state in Zustand — that belongs in React Query

```ts
// features/auth/store/authStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: 'auth-store' }
  )
)
```

---

## Data Fetching Rules (React Query)

- All queries live in `features/[name]/api/`
- Wrap in custom hooks, never use raw `useQuery` in components
- Query keys follow: `['feature', 'resource', id?]`

```ts
// features/auth/api/authQueries.ts
export const useCurrentUser = () =>
  useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: () => apiClient.get<AuthUser>('/me'),
  })
```

---

## Page Pattern (app/ → features/)

Pages are thin. Zero logic. Just composition.

```tsx
// app/(dashboard)/dashboard/page.tsx
import { DashboardView } from '@/features/dashboard'
import { requireAuth } from '@/features/auth'

export default async function DashboardPage() {
  await requireAuth()
  return <DashboardView />
}
```
