# Deployment Strategy

**Last Updated:** February 4, 2026

## Vercel (Optimized for Philippines)

### Why Vercel Over Netlify?

| Factor | Vercel | Netlify |
|--------|--------|---------|
| **Next.js Optimization** | ✅ Built by Next.js team | ⚠️ Good support |
| **Edge Network** | ✅ Global (incl. Singapore) | ✅ Global |
| **Free Tier** | ✅ 100GB bandwidth | ✅ 100GB bandwidth |
| **Serverless Functions** | ✅ 100GB-hours/month | ✅ 125K requests/month |
| **Build Minutes** | ✅ 6,000 min/month | ✅ 300 min/month |
| **Deployment Speed** | ✅ ~30 seconds | ⚠️ ~60 seconds |
| **Image Optimization** | ✅ Native | ❌ Paid add-on |

**Decision:** **Vercel**

### Optimizations for Philippine Users

**1. Edge Caching Configuration**

```typescript
// next.config.ts
export default {
  // Enable SWC minification (faster builds)
  swcMinify: true,
  
  // Compress responses (reduce bandwidth)
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200], // Mobile-first breakpoints
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Supabase Storage
      },
    ],
  },
  
  // Experimental: Partial Prerendering
  experimental: {
    ppr: true, // Static shell + dynamic content
  },
}
```

**2. Incremental Static Regeneration (ISR)**

```typescript
// app/dashboard/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds

export default async function DashboardPage() {
  const stats = await getDashboardStats() // Fetched server-side
  return <DashboardView stats={stats} />
}

// On-demand revalidation (when data changes)
// API Route: /api/revalidate
export async function POST(request: Request) {
  const { path, secret } = await request.json()
  
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }
  
  await revalidatePath(path)
  return NextResponse.json({ revalidated: true })
}
```

**3. Edge Functions (Future: Philippines Region)**

```typescript
// middleware.ts - Runs on Vercel Edge (closest to user)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add security headers
  const headers = new Headers(request.headers)
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Redirect non-authenticated users
  const token = request.cookies.get('auth-token')
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next({ headers })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)',
  ],
}
```

**4. Vercel Analytics (Free Tier)**

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics /> {/* Tracks Core Web Vitals */}
        <SpeedInsights /> {/* Tracks real user metrics */}
      </body>
    </html>
  )
}
```
