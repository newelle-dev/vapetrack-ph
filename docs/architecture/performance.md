# Performance Optimization

**Last Updated:** February 4, 2026

## Target Metrics (Philippine 4G Network)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.5s | Vercel Speed Insights |
| **Largest Contentful Paint (LCP)** | < 2.5s | Core Web Vitals |
| **Time to Interactive (TTI)** | < 3.0s | Lighthouse |
| **Total Blocking Time (TBT)** | < 300ms | Lighthouse |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Core Web Vitals |
| **API Response Time (P95)** | < 500ms | Custom logging |

## Optimization Strategies

### 1. Code Splitting & Lazy Loading

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic'

const ReportChart = dynamic(() => import('@/components/ReportChart'), {
  loading: () => <Skeleton height={400} />,
  ssr: false, // Client-side only (chart libraries are heavy)
})

// Route-based code splitting (automatic in Next.js App Router)
// Each page bundle is separate
```

### 2. Image Optimization

```typescript
// Use next/image for automatic optimization
import Image from 'next/image'

<Image
  src="/product.jpg"
  alt="Product"
  width={300}
  height={300}
  loading="lazy" // Lazy load images below fold
  placeholder="blur" // LQIP (Low Quality Image Placeholder)
  blurDataURL="data:image/..." // Generated at build time
/>
```

### 3. Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOUT (Flash of Unstyled Text) over FOIT
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### 4. Database Query Optimization

```typescript
// Bad: N+1 Query
const products = await supabase.from('products').select('*')
for (const product of products) {
  const variants = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
}

// Good: Single Query with Join
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_variants (
      id,
      sku,
      name,
      price,
      capital_cost
    )
  `)
  .eq('organization_id', orgId)
  .eq('is_active', true)
```

### 5. Debounced Search

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Usage in search
function ProductSearch() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  
  const { data: products } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => searchProducts(debouncedSearch),
    enabled: debouncedSearch.length > 2,
  })
  
  return <input onChange={(e) => setSearch(e.target.value)} />
}
```
