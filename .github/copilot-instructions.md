# VapeTrack PH - AI Coding Agent Instructions

## Project Overview

VapeTrack PH is a **multi-tenant SaaS** for Philippine vape shops. Built as a **mobile-first PWA** using Next.js 16 App Router, Supabase (PostgreSQL), and Tailwind 4. The architecture prioritizes **speed on 4G/5G networks**, **database-level multi-tenancy**, and **solo developer productivity**.

**Current Phase:** Early implementation - dependencies installed, awaiting database schema setup and core feature implementation.

## Quick Start for AI Agents

**Before implementing features:**

1. Check if `types/database.ts` exists—if not, database schema needs setup first
2. Verify Supabase client factories exist in `lib/supabase/` (server.ts, client.ts)
3. Review comprehensive docs in `docs/` folder (PRD, ARCHITECTURE, SCHEMA, API_SPEC, UI_UX)
4. Understand that RLS policies handle ALL multi-tenancy—never add manual `organization_id` filters

**When creating new files:**

- Use `@/` path alias (configured in [tsconfig.json](tsconfig.json))
- Follow Next.js 16 App Router conventions (Server Components by default)
- Copy shadcn/ui components: `npx shadcn@latest add <component>`

## Architecture Fundamentals

### Multi-Tenancy Strategy

**CRITICAL**: All tenant data isolation happens at the **database level via Row-Level Security (RLS)**. Never add manual `WHERE organization_id = X` filters in application code—RLS policies enforce this automatically.

- User's `organization_id` is injected into JWT claims during sign-in (see `ARCHITECTURE.md` → Multi-Tenancy Implementation)
- Supabase client queries automatically filter by `organization_id` via RLS policies
- **Example**: `supabase.from('products').select('*')` returns only current user's org products

### Product Variants Pattern

**Two-table approach**: `products` (base info) → `product_variants` (SKUs, prices, stock)

- **All inventory and sales operations reference variants, NOT products**
- Single-variant products still require one variant entry (e.g., "Standard")
- See `docs/SCHEMA.md` → Conceptual Model for detailed rationale

### Data Flow for Critical Operations

**Sales & Inventory mutations use PostgreSQL functions (RPCs)** for atomicity:

- ✅ Complex writes: `supabase.rpc('create_sale', { items: [...] })`
- ✅ Simple reads: `supabase.from('products').select(...)`
- See `docs/API_SPEC.md` → Database Functions (RPCs) for all available procedures

## Tech Stack Conventions

### Next.js App Router (v16)

- **Server Components by default**: Only add `'use client'` when hooks/interactivity needed
- **Server Actions for mutations**: Use `'use server'` for database writes (see `app/actions/` pattern)
- **ISR for dashboards**: Set `export const revalidate = 60` on dashboard pages
- **Image optimization**: Use `<Image>` from `next/image` for all product images

### State Management (TanStack Query v5)

```typescript
// Pattern: Optimistic updates for POS speed
useMutation({
  mutationFn: createSale,
  onMutate: async (newSale) => {
    await queryClient.cancelQueries({ queryKey: ["sales"] });
    queryClient.setQueryData(["sales"], (old) => [...old, newSale]); // Optimistic
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(["sales"], context.previousSales); // Rollback
  },
});
```

- Use for all server state (inventory, sales, products)
- Configure retries for network resilience: `retry: 3, retryDelay: exponentialBackoff`

### UI Components (shadcn/ui + Tailwind 4)

- **Copy, don't install**: Use `npx shadcn@latest add <component>` to copy into `components/ui/`
- **Mobile-first**: All touch targets ≥44×44px, thumb-zone optimization
- **Dark mode default**: Use Tailwind's `dark:` variant (configured in `app/layout.tsx`)
- **Color semantics**: `red` = low stock alerts, `green` = profit indicators

### Type Safety

- **Auto-generate DB types**: Run `supabase gen types typescript --project-id <id> > types/database.ts` after schema changes
- **Never use `any`**: Prefer `unknown` and narrow with type guards
- **Supabase client types**: Import `Database` type: `createClient<Database>(...)`

## Development Workflow

### Essential Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Type-check + build (validates before deploy)
npm run lint         # ESLint (enforces Next.js best practices)
```

### Next Steps After Dependencies Installed

1. **Supabase Setup:**

   ```bash
   # Create .env.local with Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-only operations
   ```

2. **Create Supabase Client Factories:**
   - `lib/supabase/client.ts` - Client Component usage
   - `lib/supabase/server.ts` - Server Component/Action usage
   - Example patterns in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) lines 200-300

3. **Generate Database Types:**
   ```bash
   npx supabase gen types typescript --project-id <ref> > types/database.ts
   ```

### File Structure Patterns

```
app/
  (auth)/           # Route group: auth pages (login, signup)
  (dashboard)/      # Route group: protected pages
  api/              # API routes (serverless functions)
  actions/          # Server Actions (mutations with 'use server')
components/
  ui/               # shadcn/ui components (copied, not imported)
  pos/              # POS-specific components (POSCart, ProductGrid)
lib/
  supabase/         # Supabase client factories (server vs client)
  utils.ts          # cn() utility + shared helpers
types/
  database.ts       # Auto-generated Supabase types (run after schema changes)
```

### Adding New Features

1. **Read docs first**: [docs/PRD.md](docs/PRD.md) (requirements), [ARCHITECTURE.md](docs/ARCHITECTURE.md) (decisions), [SCHEMA.md](docs/SCHEMA.md) (data model)
2. **Check RLS policies**: Ensure new tables have tenant isolation policies (see [SCHEMA.md](docs/SCHEMA.md) → RLS section)
3. **Use Server Actions**: For mutations, create in `app/actions/` with `'use server'`
4. **Optimistic UI**: For POS interactions, implement TanStack Query optimistic updates

### Supabase Client Usage Patterns

```typescript
// Server Component (default)
import { createClient } from '@/lib/supabase/server'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*')
  // RLS automatically filters by organization_id
  return <ProductList products={products} />
}

// Client Component (with 'use client')
'use client'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export function LiveInventory() {
  const supabase = createClient()
  const { data } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await supabase.from('inventory').select('*')
      return data
    }
  })
  return <div>{/* ... */}</div>
}

// Server Action (mutations)
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert({ name: formData.get('name') })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/products')
  return data
}
```

## Common Pitfalls

### ❌ Don't

- Manually filter by `organization_id` in queries (RLS does this)
- Use Client Components for data fetching (prefer Server Components + RSC payload)
- Create separate API routes for simple CRUD (use Server Actions)
- Reference `products` table directly in sales—always use `product_variants`

### ✅ Do

- Trust RLS policies to enforce multi-tenancy
- Use Server Components for initial data load, Client Components for interactivity
- Leverage Postgres functions (RPCs) for complex transactions
- Test with multiple organizations to verify RLS isolation

## Key Files to Reference

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (lines 400-600): Multi-tenancy RLS implementation
- [docs/SCHEMA.md](docs/SCHEMA.md): Complete data model + RLS policies
- [docs/API_SPEC.md](docs/API_SPEC.md): TypeScript types + available RPC functions
- [docs/UI_UX.md](docs/UI_UX.md): Design system, mobile-first patterns, accessibility
- [docs/PRD.md](docs/PRD.md): Business requirements, user roles, feature scope

## Philippines-Specific Optimizations

- **Network resilience**: Always configure retry logic (TanStack Query's `retry` option)
- **Bundle size**: Prefer dynamic imports for heavy components: `const Heavy = dynamic(() => import('./Heavy'))`
- **Image formats**: Use AVIF/WebP via `next/image` (auto-converted, saves bandwidth)
- **Edge caching**: Static assets served from Singapore CDN (Vercel's nearest edge)

## Authentication Context

- **Shop owners**: Email/password via Supabase Auth
- **Staff**: 4-6 digit PIN (custom JWT, 8-hour expiry)
- **Session storage**: HTTP-only cookies (configured in `lib/supabase/server.ts`)
- **Permission checks**: Use `can_view_profits`, `can_manage_inventory` flags from `users` table

## Testing & Validation

- **Type checking**: `npm run build` fails on TypeScript errors (enforced in CI)
- **Multi-tenant testing**: Create 2+ test orgs, verify data isolation
- **Mobile testing**: Use Chrome DevTools device emulation (375×667px iPhone SE)
- **Offline behavior** _(future)_: Not yet implemented—optimistic UI is current approach
