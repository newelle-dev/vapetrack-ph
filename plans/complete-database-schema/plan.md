# Complete Database Schema Implementation

**Branch:** `complete-database-schema`
**Description:** Implement all remaining database tables, RLS policies, and TypeScript types for VapeTrack PH

## Goal

Complete the database schema implementation for VapeTrack PH by adding **9 missing tables** (product, inventory, transaction, and management tables) with full Row-Level Security (RLS) policies, creating Supabase client factories, and generating comprehensive TypeScript types. This completes Day 2 Afternoon, Day 3 Morning, and Day 3 Afternoon tasks from the roadmap.

**Current State:** Migration file contains only 3 tables (organizations, users, branches)
**Target State:** 12+ tables with RLS policies, Supabase clients configured, TypeScript types generated

---

## Implementation Steps

### Step 1: Create New Migration for Product Tables

**Files:**

- `supabase/migrations/002_add_product_tables.sql` (new)

**Command:**

```bash
npx supabase migration new add_product_tables
```

**What:**
Create a NEW migration file for product-related tables (DO NOT modify `001_initial_schema.sql`):

- `product_categories` - Product categorization (e.g., "E-Liquids", "Devices")
- `products` - Base product information (name, brand, description)
- `product_variants` - SKUs with pricing, capital costs, and specifications
- `inventory` - Stock levels per branch/variant combination

Each table includes:

- Complete column definitions matching SCHEMA.md specifications
- Foreign key constraints (products → categories, variants → products, inventory → variants/branches)
- `organization_id` for multi-tenancy
- Timestamp fields (`created_at`, `updated_at`)
- RLS policies enabling tenant isolation
- Auto-update triggers for timestamps

**Testing:**
Validate SQL syntax by running `npm run build` (TypeScript checks). SQL will be applied in Step 5.

---

### Step 2: Create New Migration for Transaction Tables

**Files:**

- `supabase/migrations/003_add_transaction_tables.sql` (new)

**Command:**

```bash
npx supabase migration new add_transaction_tables
```

**What:**
Create a NEW migration file for transaction/sales tables:

- `transactions` - Sales records with totals, payment methods, profit calculations
- `transaction_items` - Line items with variant references, quantities, prices
- `stock_movements` - Audit trail for inventory changes (sales, restocks, adjustments)

Each table includes:

- Complete column definitions per SCHEMA.md
- Foreign keys (transaction_items → transactions/variants, stock_movements → inventory/users)
- `organization_id` for multi-tenancy
- RLS policies for tenant isolation
- **Special policy for `transaction_items`**: Staff users cannot view `capital_cost` or `profit` columns (owner-only)
- Triggers for timestamp management

**Testing:**
Validate foreign key references are correct. SQL will be applied in Step 5.

---

### Step 3: Create New Migration for Management Tables

**Files:**

- `supabase/migrations/004_add_management_tables.sql` (new)

**Command:**

```bash
npx supabase migration new add_management_tables
```

**What:**
Add supporting tables and finalize the migration:

- `audit_logs` - General activity tracking (who did what, when)
- `subscriptions` - Future billing/subscription management (placeholder for post-MVP)

Add indexes for performance:

- `product_variants(sku)` for fast SKU lookups
- `inventory(branch_id, variant_id)` for stock queries
- `transactions(organization_id, created_at)` for sales reports
- `transaction_items(transaction_id)` for order details

**Testing:**
Ensure all foreign keys reference existing tables. Verify `get_user_organization_id()` is used in all RLS policies.

---

### Step 4: Create Supabase Client Factories

**Files:**

- `lib/supabase/client.ts` (new)
- `lib/supabase/server.ts` (new)

**What:**
Implement browser and server Supabase clients using `@supabase/ssr`:

**`client.ts` (Browser/Client Components):**

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**`server.ts` (Server Components/Actions):**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
```

Both clients are typed with the `Database` type for full TypeScript autocomplete.

**Testing:**

- Build should succeed: `npm run build`
- No TypeScript errors when importing clients
- `Database` type should be recognized (may show errors until Step 6 generates new types)

---

### Step 5: Apply Migration via Supabase Dashboard (MANUAL)

**Files:**

- None (manual Dashboard operation)

**What:**
**This is a MANUAL step, not a code commit:**

1. Open Supabase Dashboard: `https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]`
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the **ENTIRE contents** of `supabase/migrations/001_initial_schema.sql`
5. Paste into SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Verify success message: `Success. No rows returned`
8. Navigate to **Table Editor** → Verify all 12 tables are visible:
   - organizations ✅
   - users ✅
   - branches ✅
   - product_categories ✅
   - products ✅
   - product_variants ✅
   - inventory ✅
   - transactions ✅
   - transaction_items ✅
   - stock_movements ✅
   - audit_logs ✅
   - subscriptions ✅

**Testing:**

- Click each table in Table Editor
- Verify "RLS is enabled" toggle shows ✅
- Click "Policies" tab for each table → Should see isolation policies
- Special check for `transaction_items`: Should have 2 policies (tenant isolation + staff profit restriction)

---

### Step 6: Generate TypeScript Types

**Files:**

- `types/database.ts` (regenerate)

**What:**
Regenerate TypeScript types to include all 12 tables:

**Command:**

```bash
npx supabase gen types typescript --project-id jnmikztbpfzsodvqvcys > types/database.ts
```

**Project Reference:** `jnmikztbpfzsodvqvcys`

**Dashboard URL:** `https://supabase.com/dashboard/project/jnmikztbpfzsodvqvcys`

**Expected result:**

- File grows from **309 lines** (current) to **~1200+ lines**
- Exports `Database` type with all 12 tables
- Each table has `Row`, `Insert`, and `Update` types
- Includes types for `get_user_organization_id()` function

**Testing:**

- Run `npm run build` → Should succeed with no TypeScript errors
- In VS Code, import `Database` type: `import type { Database } from '@/types/database'`
- Autocomplete should show all 12 tables when typing: `Database['public']['Tables']['...'`
- Test Supabase client usage:
  ```typescript
  const supabase = createClient();
  const { data } = await supabase.from("products").select("*");
  // `data` should be typed correctly
  ```

---

## Configuration ✅

**All clarifications answered - ready for implementation!**

### 1. Supabase Project Reference

**Project Ref:** `jnmikztbpfzsodvqvcys`

**Dashboard URL:** `https://supabase.com/dashboard/project/jnmikztbpfzsodvqvcys`

**Used in Step 6 for type generation.**

---

### 2. Environment Variables

**Status:** ✅ **Configured**

Your `.env.local` is set up with:

- `NEXT_PUBLIC_SUPABASE_URL=https://jnmikztbpfzsodvqvcys.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (configured)
- `SUPABASE_SERVICE_ROLE_KEY` (configured)

Supabase clients will connect successfully.

---

### 3. Management Tables

**Decision:** ✅ **Include `audit_logs` and `subscriptions` now**

**Rationale:** Complete schema foundation, prevents future migration complexity (~30 min investment)

---

## Definition of Done

**Before merging this branch:**

- [ ] Migration file contains all 12 tables with complete column definitions
- [ ] All tables have `organization_id` for multi-tenancy
- [ ] All tables have `created_at` and `updated_at` (except join tables)
- [ ] All tables have RLS policies (minimum: `FOR ALL USING (organization_id = get_user_organization_id())`)
- [ ] `transaction_items` has special profit-visibility policy for staff
- [ ] Performance indexes added (SKU, branch/variant, timestamps)
- [ ] Migration applied successfully via Supabase Dashboard (verified in Table Editor)
- [ ] All 12 tables show "RLS enabled" ✅ in Dashboard
- [ ] `lib/supabase/client.ts` created and exports typed `createClient()`
- [ ] `lib/supabase/server.ts` created and exports typed `createClient()`
- [ ] `types/database.ts` regenerated with all 12 table types (~1200+ lines)
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Supabase client imports work: `import { createClient } from '@/lib/supabase/client'`
- [ ] Database types autocomplete correctly in VS Code

**Multi-tenancy verification (manual test after migration):**

- [ ] Create 2 test organizations via SQL:
  ```sql
  INSERT INTO organizations (id, name, slug, owner_email)
  VALUES ('org-test-1', 'Test Shop 1', 'test-shop-1', 'test1@example.com');
  ```
- [ ] Insert products with different `organization_id` values
- [ ] Set JWT claim: `SELECT set_config('request.jwt.claims', '{"app_metadata": {"organization_id": "org-test-1"}}', true);`
- [ ] Query products: `SELECT * FROM products;` → Should only return Org 1 products
- [ ] Change claim to `org-test-2` → Query should return different products

---

## Risks & Mitigations

### Risk 1: SQL Syntax Errors in Migration

**Impact:** Migration fails, blocks progress
**Mitigation:**

- Validate SQL in Dashboard SQL Editor before running (shows syntax errors)
- Copy column definitions verbatim from SCHEMA.md (already validated)
- Test foreign key paths (ensure referenced tables exist)

### Risk 2: RLS Policies Don't Isolate Tenants

**Impact:** Critical security vulnerability - cross-tenant data leakage
**Mitigation:**

- Use exact policy pattern: `organization_id = get_user_organization_id()`
- Test with 2 organizations (manual verification in Step 5)
- Verify in Dashboard: Policies tab for each table

### Risk 3: TypeScript Types Out of Sync

**Impact:** Type errors, autocomplete broken, runtime mismatches
**Mitigation:**

- Regenerate types IMMEDIATELY after migration (Step 6)
- Add to ROADMAP: "Re-run type generation after any schema change"
- Consider pre-commit hook to check types are current (post-MVP)

### Risk 4: Missing Supabase Project Credentials

**Impact:** Cannot generate types, clients won't connect
**Mitigation:**

- Verify `.env.local` before Step 4 (Clarification #2)
- Test connection: `npx supabase db ping` (if CLI configured)
- Dashboard SQL Editor still works without local credentials (fallback)

---

## Estimated Time

**Step 1:** 1.5 hours (Product tables + RLS policies)
**Step 2:** 1 hour (Transaction tables + RLS policies)
**Step 3:** 30 minutes (Management tables + indexes)
**Step 4:** 30 minutes (Supabase client factories)
**Step 5:** 30 minutes (Apply migration + verify in Dashboard)
**Step 6:** 15 minutes (Generate types + verify)

**Total:** ~4.5 hours (one focused afternoon)

---

## Notes

- **Commit Structure:** This plan represents 5 commits on the `complete-database-schema` branch:
  1. "feat(db): add product tables migration (002_add_product_tables.sql)"
  2. "feat(db): add transaction tables migration (003_add_transaction_tables.sql)"
  3. "feat(db): add management tables migration (004_add_management_tables.sql)"
  4. "feat(lib): create Supabase client factories for browser and server"
  5. "chore(types): regenerate database types with all tables"

- **Manual Step:** Step 5 (applying migration) is NOT a code commit - it's a Dashboard operation. Document completion in ROADMAP.md checklist.

- **Post-Merge:** Update ROADMAP.md to check off all Day 3 Afternoon tasks:
  - ✅ SQL migration runs without errors
  - ✅ All tables visible in Supabase Table Editor
  - ✅ RLS policies show as "Enabled" for all tables
  - ✅ `types/database.ts` file exists and exports types

- **Next Steps After This Plan:**
  - Sprint 1, Day 4-5: Authentication Implementation (login/signup pages)
  - Sprint 1, Day 6-7: Dashboard Layout & Organization Setup
