# Payments Architecture

**Last Updated:** February 4, 2026

## PayMongo (Philippine Gateway)

### Why PayMongo?

✅ **Philippine-Native:** GCash, GrabPay, bank transfers  
✅ **Competitive Fees:** 2.9% + ₱15 per transaction  
✅ **Developer-Friendly:** RESTful API, webhooks, test mode  
✅ **Vercel Compatibility:** Works with serverless functions  

**Implementation (Subscription Billing):**

```typescript
// API Route: /api/billing/create-checkout
import { PayMongo } from '@/lib/paymongo'

export async function POST(request: Request) {
  const { organizationId, planId } = await request.json()
  
  const session = await PayMongo.createCheckoutSession({
    amount: 49900, // ₱499.00
    currency: 'PHP',
    description: 'VapeTrack PH - Pro Plan (Monthly)',
    metadata: { organizationId, planId },
    successUrl: `${process.env.APP_URL}/dashboard?payment=success`,
    cancelUrl: `${process.env.APP_URL}/settings/billing?payment=cancelled`,
  })
  
  return NextResponse.json({ checkoutUrl: session.url })
}

// Webhook Handler: /api/webhooks/paymongo
export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('paymongo-signature')
  
  const event = PayMongo.verifyWebhook(payload, signature)
  
  if (event.type === 'payment.paid') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .eq('organization_id', event.data.metadata.organizationId)
  }
  
  return NextResponse.json({ received: true })
}
```
