# Monitoring & Observability

**Last Updated:** February 4, 2026

## Key Metrics to Track

| Category | Metric | Tool | Alert Threshold |
|----------|--------|------|-----------------|
| **Performance** | LCP | Vercel Analytics | > 2.5s |
| **Performance** | FCP | Vercel Analytics | > 1.5s |
| **Performance** | API Latency (P95) | Custom logging | > 500ms |
| **Errors** | Client Error Rate | Sentry | > 1% |
| **Errors** | Server Error Rate | Sentry | > 0.5% |
| **Business** | Daily Active Users | Custom | N/A |
| **Business** | Sales/Day (per shop) | Custom | < 5 (churn risk) |
| **Infrastructure** | Supabase DB CPU | Supabase Dashboard | > 80% |

## Error Tracking (Sentry)

```typescript
// app/layout.tsx
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.headers?.['authorization']) {
      delete event.request.headers['authorization']
    }
    return event
  },
})

// Usage in components
try {
  await createSale(data)
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'pos', action: 'create-sale' },
    extra: { saleData: data },
  })
  toast.error('Failed to create sale')
}
```

## Custom Logging

```typescript
// lib/logger.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(/* ... */)

export const logger = {
  async logAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    userId?: string
  ) {
    await supabase.from('api_logs').insert({
      endpoint,
      method,
      duration_ms: duration,
      status_code: status,
      user_id: userId,
      created_at: new Date().toISOString(),
    })
  },
  
  async logBusinessEvent(
    event: 'sale_created' | 'product_added' | 'user_signup',
    metadata: Record<string, any>
  ) {
    await supabase.from('business_events').insert({
      event_type: event,
      metadata,
      created_at: new Date().toISOString(),
    })
  },
}

// Usage in API route (middleware)
const startTime = Date.now()
try {
  const response = await handler(request)
  logger.logAPICall(
    request.url,
    request.method,
    Date.now() - startTime,
    response.status,
    user?.id
  )
  return response
} catch (error) {
  logger.logAPICall(request.url, request.method, Date.now() - startTime, 500)
  throw error
}
```
