# Security Architecture

**Last Updated:** February 4, 2026

## Threat Model

| Threat | Mitigation | Priority |
|--------|------------|----------|
| **SQL Injection** | Supabase parameterized queries | 🔴 Critical |
| **XSS (Cross-Site Scripting)** | React auto-escaping + CSP headers | 🔴 Critical |
| **CSRF (Cross-Site Request Forgery)** | SameSite cookies + CSRF tokens | 🟠 High |
| **Data Leakage (Multi-Tenancy)** | Row-Level Security (RLS) | 🔴 Critical |
| **Brute Force (PIN Login)** | Rate limiting (5 attempts/minute) | 🟠 High |
| **Man-in-the-Middle** | HTTPS only + HSTS headers | 🔴 Critical |
| **Sensitive Data Exposure** | Environment variables + .gitignore | 🟠 High |

## Implementation

### 1. Content Security Policy (CSP)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const headers = new Headers()
  
  headers.set('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.supabase.co;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    frame-ancestors 'none';
  `.replace(/\s+/g, ' ').trim())
  
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return NextResponse.next({ headers })
}
```

### 2. Rate Limiting (Upstash Redis)

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export const pinLoginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 attempts per minute
  analytics: true,
})

// Usage in API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success, limit, remaining } = await pinLoginRateLimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 1 minute.' },
      { status: 429 }
    )
  }
  
  // Proceed with PIN verification...
}
```

### 3. Environment Variable Security

```bash
# .env.local (NEVER commit to Git)
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... # Public key (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # SECRET! Admin access

# PayMongo
PAYMONGO_SECRET_KEY=sk_live_xxx # SECRET!
PAYMONGO_WEBHOOK_SECRET=whsec_xxx # SECRET!

# Upstash Redis
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=AXX... # SECRET!

# App
APP_URL=https://vapetrack.ph
REVALIDATE_SECRET=random_string_here # SECRET!
```

```typescript
// lib/env.ts - Validate env vars at build time
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  PAYMONGO_SECRET_KEY: z.string().startsWith('sk_'),
  APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

### 4. Audit Logging

```typescript
// lib/audit-log.ts
export async function logAction(
  action: string,
  userId: string,
  organizationId: string,
  metadata: Record<string, any>
) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    organization_id: organizationId,
    action,
    entity_type: metadata.entityType,
    entity_id: metadata.entityId,
    metadata,
    ip_address: metadata.ipAddress,
    user_agent: metadata.userAgent,
  })
}

// Usage in API route
export async function POST(request: Request) {
  // ... perform action ...
  
  await logAction(
    'sale.created',
    user.id,
    user.organization_id,
    {
      entityType: 'transaction',
      entityId: transaction.id,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      total: transaction.total,
    }
  )
}
```
