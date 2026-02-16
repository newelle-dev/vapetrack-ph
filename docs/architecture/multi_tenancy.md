# Multi-Tenancy Implementation

**Last Updated:** February 4, 2026

### Strategy: **Database-Level Isolation via Row-Level Security (RLS)**

**Why RLS Over Application-Level Filtering?**

| Approach | Security | Performance | Maintainability |
|----------|----------|-------------|-----------------|
| **RLS (Our Choice)** | ✅ Database enforces | ✅ Indexed filtering | ✅ Centralized policies |
| App-Level WHERE Clauses | ⚠️ Forget one query → leak | ⚠️ Manual indexing | ❌ Scattered logic |
| Separate Databases | ✅ Perfect isolation | ❌ Complex sharding | ❌ Schema migrations |

**Implementation:**

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Helper function: Extract org_id from JWT
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can only access their organization's data
CREATE POLICY tenant_isolation_policy ON products
  FOR ALL
  USING (organization_id = get_user_organization_id());

CREATE POLICY tenant_isolation_policy ON transactions
  FOR ALL
  USING (organization_id = get_user_organization_id());

-- Index for performance (critical!)
CREATE INDEX idx_products_org_id ON products(organization_id);
CREATE INDEX idx_transactions_org_id ON transactions(organization_id);
```

**How org_id Gets Into JWT:**

```typescript
// Supabase Auth Hook (SQL function, runs on sign-in)
CREATE OR REPLACE FUNCTION set_organization_claim()
RETURNS TRIGGER AS $$
DECLARE
  user_org_id UUID;
BEGIN
  -- Get user's organization_id from users table
  SELECT organization_id INTO user_org_id
  FROM public.users
  WHERE id = NEW.id;
  
  -- Inject into JWT claims
  NEW.raw_app_meta_data = jsonb_set(
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
    '{organization_id}',
    to_jsonb(user_org_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION set_organization_claim();
```

**Client-Side Usage (Automatic):**

```typescript
// No manual filtering needed! RLS handles it.
const { data: products } = await supabase
  .from('products')
  .select('*')
// RLS automatically adds: WHERE organization_id = <user's org_id>
```
