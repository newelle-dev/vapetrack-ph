# Technology Stack

**Last Updated:** February 4, 2026

## 1. Frontend Framework: **Next.js 16 (App Router)**

### ✅ Why Next.js Over Alternatives?

| Requirement | Next.js 16 | Vite + React | Remix |
|-------------|-----------|--------------|-------|
| **PWA Support** | ✅ Excellent (next-pwa) | ✅ Good (vite-pwa) | ⚠️ Manual setup |
| **SSR + SSG** | ✅ Native (App Router) | ❌ CSR only | ✅ Native |
| **Edge Functions** | ✅ Vercel Edge | ⚠️ Via Cloudflare | ⚠️ Limited |
| **Image Optimization** | ✅ next/image (auto WebP) | ❌ Manual | ✅ Built-in |
| **API Routes** | ✅ Serverless functions | ❌ Separate backend | ✅ Loaders/Actions |
| **Free Hosting** | ✅ Vercel (optimized) | ✅ Netlify/Vercel | ⚠️ Fly.io costs |
| **Bundle Size** | ⚠️ Larger (~90KB) | ✅ Smaller (~70KB) | ⚠️ Similar |
| **DX (Solo Dev)** | ✅ Excellent TypeScript DX | ✅ Good | ✅ Good |

**Decision:** **Next.js 16 App Router**

**Justification:**
1. **Built-in API Routes:** No separate backend needed (solo dev efficiency)
2. **Vercel Free Tier:** Optimized hosting with global CDN (100GB bandwidth/month)
3. **Server Components:** Reduce client bundle size for faster mobile loads
4. **Partial Prerendering (PPR):** Static shell + dynamic content (fast perceived load)
5. **Image Optimization:** Automatic format conversion (WebP/AVIF) saves bandwidth
6. **Incremental Static Regeneration (ISR):** Cache dashboards, revalidate on-demand

---

## 2. State Management & Data Fetching: **TanStack Query v5**

### ✅ Why TanStack Query?

**Alternatives Considered:**
- ❌ Redux Toolkit: Overkill for SaaS app, too much boilerplate
- ❌ Zustand: Great for UI state, poor for server state (no caching)
- ❌ SWR: Good, but TanStack Query has better caching strategies

**Core Features Leveraged:**

```typescript
// Example: Optimistic mutation with error handling
import { useMutation, useQueryClient } from '@tanstack/react-query'

const useCreateSale = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sale) => api.createSale(sale),
    
    // Optimistic update
    onMutate: async (newSale) => {
      await queryClient.cancelQueries({ queryKey: ['sales'] })
      const previousSales = queryClient.getQueryData(['sales'])
      
      queryClient.setQueryData(['sales'], (old) => [...old, newSale])
      return { previousSales }
    },
    
    // Rollback on error
    onError: (err, newSale, context) => {
      queryClient.setQueryData(['sales'], context.previousSales)
      toast.error('Sale failed - please try again')
    },
    
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'inventory'] })
    },
    
    // Network retry
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
```

**Key Benefits:**
- ✅ **Automatic Caching:** Reduce API calls by 70%+
- ✅ **Optimistic Updates:** Instant UI feedback (critical for POS speed)
- ✅ **Background Sync:** Refetch stale data when window regains focus
- ✅ **Smart Retries:** Automatic retry on network failures
- ✅ **Devtools:** Inspect cache, mutations, and query states

---

## 3. UI Component Library: **shadcn/ui + Tailwind CSS 4**

### ✅ Why shadcn/ui Over Component Libraries?

| Factor | shadcn/ui | Mantine | Material-UI | Chakra UI |
|--------|-----------|---------|-------------|-----------|
| **Bundle Size** | ✅ Minimal (copy components) | ⚠️ ~200KB | ❌ ~300KB | ⚠️ ~150KB |
| **Customization** | ✅ Full control (own code) | ⚠️ CSS-in-JS | ⚠️ Theme overrides | ⚠️ Theme system |
| **Tailwind Native** | ✅ Built for Tailwind | ❌ CSS Modules | ❌ Emotion | ❌ Emotion |
| **Dark Mode** | ✅ Native (Tailwind) | ✅ Good | ✅ Good | ✅ Good |
| **Mobile-First** | ✅ Responsive utilities | ✅ Good | ⚠️ Desktop-first | ✅ Good |
| **License** | ✅ MIT (copy code) | ✅ MIT | ✅ MIT | ✅ MIT |

**Decision:** **shadcn/ui**

**Justification:**
1. **No Runtime Dependency:** Copy components into project → full control
2. **Tailwind-Native:** Leverage existing Tailwind 4 setup
3. **Type-Safe:** TypeScript + Radix UI primitives
4. **Accessible:** ARIA patterns built-in (Radix UI foundation)
5. **Solo Dev Friendly:** No context-switching between Tailwind and CSS-in-JS

**Core Components Used:**
- `Button`, `Input`, `Select`, `Dialog`, `Sheet` (mobile modals)
- `Table`, `Tabs`, `Card`, `Badge`, `Toast`
- Custom: `POSCart`, `VariantSelector`, `ProductGrid`

---

## 4. Backend & Database: **Supabase (PostgreSQL + Auth + Realtime)**

### Why Supabase Over Alternatives?

| Requirement | Supabase | Firebase | PlanetScale | Neon |
|-------------|----------|----------|-------------|------|
| **Database** | ✅ PostgreSQL | ❌ NoSQL | ✅ MySQL | ✅ PostgreSQL |
| **Row-Level Security** | ✅ Native | ❌ Manual | ❌ App-level | ❌ App-level |
| **Realtime** | ✅ Built-in | ✅ Firestore | ❌ No | ❌ No |
| **Auth** | ✅ Built-in | ✅ Good | ❌ BYO | ❌ BYO |
| **Free Tier** | ✅ 500MB, 2 orgs | ✅ Generous | ⚠️ Hobby paused | ✅ 500MB |
| **Type Safety** | ✅ Auto-gen types | ❌ Manual | ⚠️ Manual | ⚠️ Manual |
| **File Storage** | ✅ Built-in | ✅ Good | ❌ No | ❌ No |

**Decision:** **Supabase**

**Key Advantages:**
1. **Row-Level Security (RLS):** Enforce multi-tenancy at the database layer
2. **Auto-Generated Types:** `supabase gen types typescript` → type-safe queries
3. **Realtime Subscriptions:** Live inventory updates across devices
4. **Edge Functions:** Run serverless functions close to users (future: Philippines region)
5. **Free Tier:** 500MB DB + 2GB file storage + 50K monthly active users

**Example: Type-Safe Query**

```typescript
// types/database.ts (auto-generated)
export type Database = {
  public: {
    Tables: {
      products: {
        Row: { id: string; name: string; organization_id: string; /* ... */ }
        Insert: { name: string; organization_id: string; /* ... */ }
        Update: { name?: string; /* ... */ }
      }
    }
  }
}

// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Usage: Fully type-safe!
const { data, error } = await supabase
  .from('products')
  .select('id, name, product_variants(sku, price)')
  .eq('organization_id', orgId)
// TypeScript knows the exact shape of `data`
```
