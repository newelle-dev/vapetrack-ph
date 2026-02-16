# Development Workflow

**Last Updated:** February 4, 2026

## Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/vapetrack-ph.git
cd vapetrack-ph

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Generate Supabase types
npm run gen:types
# Runs: supabase gen types typescript --project-id <id> > types/database.ts

# 5. Start development server
npm run dev
# Open http://localhost:3000
```

## Database Migrations (Supabase)

```bash
# 1. Link to Supabase project
npx supabase link --project-ref <project-id>

# 2. Pull existing schema
npx supabase db pull

# 3. Create new migration
npx supabase migration new add_audit_logs

# 4. Apply migrations
npx supabase db push

# 5. Generate TypeScript types
npm run gen:types
```

## Git Workflow

```bash
# Feature branch naming: feature/pos-cart-optimization
git checkout -b feature/offline-sync

# Commit conventions (Conventional Commits)
git commit -m "feat(pos): add offline sale queueing"
git commit -m "fix(inventory): prevent negative stock"
git commit -m "docs(readme): update deployment guide"

# Push and create PR
git push origin feature/offline-sync
```

## Testing Strategy (Future Phase)

```typescript
// tests/unit/utils/formatCurrency.test.ts
import { formatCurrency } from '@/lib/utils/format'

describe('formatCurrency', () => {
  it('formats Philippine pesos correctly', () => {
    expect(formatCurrency(1000)).toBe('₱1,000.00')
    expect(formatCurrency(450.50)).toBe('₱450.50')
  })
})

// tests/integration/api/transactions.test.ts
import { POST } from '@/app/api/transactions/route'

describe('POST /api/transactions', () => {
  it('creates a sale and updates inventory', async () => {
    const request = new Request('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ variantId: '123', quantity: 2, price: 450 }],
        paymentMethod: 'cash',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.transaction.id).toBeDefined()
    // Verify inventory was decremented...
  })
})
```
