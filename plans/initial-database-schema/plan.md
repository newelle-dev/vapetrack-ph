# Initial Database Schema

**Branch:** `feature/initial-database-schema`
**Description:** Create Supabase migration with core multi-tenant tables (organizations, users, branches) including RLS policies, indexes, and triggers

## Goal

Establish the foundational database schema for VapeTrack PH's multi-tenant architecture. This migration creates the three core tables (organizations, users, branches) with complete Row-Level Security (RLS) policies, performance indexes, auto-update triggers, and JWT claims injection for tenant isolation. This is the prerequisite for all subsequent feature development.

## Implementation Steps

### Step 1: Create Initial Database Migration

**Files:**

- `supabase/migrations/001_initial_schema.sql` (new)

**What:**
Create the complete initial database schema containing:

1. **Core Tables:**
   - `organizations` - Tenant/shop entity with subscription management
   - `users` - Shop owners and staff with role-based permissions (supports both email/password and PIN authentication)
   - `branches` - Physical shop locations within organizations

2. **Helper Functions:**
   - `get_user_organization_id()` - Extracts organization_id from JWT claims for RLS policies
   - `update_updated_at_column()` - Auto-updates timestamps on row modifications
   - `ensure_single_default_branch()` - Ensures only one default branch per organization
   - `set_organization_claim()` - Injects organization_id into Supabase Auth JWT for multi-tenancy

3. **Row-Level Security (RLS):**
   - Enable RLS on all three tables
   - Organization isolation policy (users only see their org)
   - User isolation policy (users only see users in their org)
   - Branch isolation policy (users only see branches in their org)
   - User update policy (users can update themselves, owners can update all)

4. **Indexes for Performance:**
   - Primary lookups: slug, email, PIN
   - Composite indexes: organization_id + created_at, organization_id + role
   - Unique constraints: organization slug, user email, user PIN per org
   - Partial indexes: active records, default branch, deleted records

5. **Triggers:**
   - Auto-update `updated_at` for all tables on modification
   - Ensure only one default branch per organization
   - Inject organization_id into auth.users JWT claims

**SQL Structure:**

```sql
-- Tables (organizations → users, branches)
-- Indexes (performance + uniqueness)
-- Functions (RLS helper, triggers, auth hook)
-- Triggers (auto-update, default branch enforcement, JWT injection)
-- RLS Policies (tenant isolation)
```

**Testing:**

1. Apply migration: `npx supabase db push` (requires Supabase project linked)
2. Verify in Supabase Dashboard:
   - All 3 tables exist in Table Editor
   - RLS enabled badge shows on each table
   - Check Database → Functions for 4 helper functions
   - Check Database → Triggers for 5 triggers
3. Test RLS isolation:

   ```sql
   -- Insert test org 1
   INSERT INTO organizations (name, slug, owner_email)
   VALUES ('Shop A', 'shop-a', 'owner-a@test.com') RETURNING id;

   -- Insert test org 2
   INSERT INTO organizations (name, slug, owner_email)
   VALUES ('Shop B', 'shop-b', 'owner-b@test.com') RETURNING id;

   -- Verify: When authenticated as org 1 user, cannot see org 2 data
   ```

4. Test triggers:

   ```sql
   -- Update organization
   UPDATE organizations SET name = 'Updated Name' WHERE id = '...';

   -- Verify: updated_at timestamp changed automatically
   ```

5. Test default branch enforcement:

   ```sql
   -- Create 2 branches, set both as default
   INSERT INTO branches (organization_id, name, slug, is_default)
   VALUES ('org-id', 'Main', 'main', true);

   INSERT INTO branches (organization_id, name, slug, is_default)
   VALUES ('org-id', 'Branch 2', 'branch-2', true);

   -- Verify: Only 'Branch 2' has is_default = true (trigger unset 'Main')
   ```

**Migration File Checklist:**

- [ ] All CHECK constraints on enums (subscription_status, subscription_plan, role)
- [ ] All NOT NULL constraints validated
- [ ] All foreign keys with ON DELETE CASCADE/RESTRICT
- [ ] All indexes include organization_id for tenant isolation
- [ ] All comments added for critical columns/functions
- [ ] All functions marked SECURITY DEFINER where needed
- [ ] Auth hook affects auth.users (not public.users)

**Notes:**

- This migration uses PostgreSQL 17 features (configured in supabase/config.toml)
- The `auth.users` table is managed by Supabase Auth; we just add a trigger to inject claims
- The `set_organization_claim()` function requires a public.users record to exist first (signup flow creates org → user → syncs to auth.users)
- All prices/costs will be stored in centavos (integer) in future migrations to avoid floating-point precision issues

## Post-Migration Tasks (Not in This PR)

After this migration is applied, the following tasks are required for the application to function:

1. **Generate TypeScript Types:**

   ```bash
   npx supabase gen types typescript --project-id <ref> > types/database.ts
   ```

2. **Create Supabase Client Factories:**
   - `lib/supabase/client.ts` - Browser client for Client Components
   - `lib/supabase/server.ts` - Server client with cookie handling for Server Components

3. **Add NPM Scripts** (optional but recommended):

   ```json
   {
     "db:types": "supabase gen types typescript",
     "db:push": "supabase db push",
     "db:reset": "supabase db reset"
   }
   ```

4. **Test Multi-Tenancy End-to-End:**
   - Create signup flow that creates organization → user → default branch
   - Verify RLS prevents cross-tenant data access
   - Test PIN login for staff users

## Dependencies

**Prerequisites:**

- Supabase CLI installed (`supabase@^2.75.3` ✅ in devDependencies)
- Supabase project created and linked (`supabase link`)
- Postgres v17 configured (✅ in supabase/config.toml)

**Blocks:**

- All future migrations (products, inventory, transactions, etc.)
- Supabase client factories (need types from this schema)
- Authentication flows (signup, login)
- Any database queries in the application

**Environment Variables Required:**

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-only operations
```

## Success Criteria

- ✅ Migration file created at `supabase/migrations/001_initial_schema.sql`
- ✅ Migration applies without errors via `supabase db push`
- ✅ All 3 tables visible in Supabase Dashboard with RLS enabled
- ✅ All 4 helper functions created (get_user_organization_id, update_updated_at_column, ensure_single_default_branch, set_organization_claim)
- ✅ All 5 triggers active (3 for updated_at, 1 for default branch, 1 for JWT injection)
- ✅ RLS policies prevent cross-tenant data access (tested with 2 orgs)
- ✅ Unique constraints enforced (org slug, user email, user PIN per org)
- ✅ Default branch enforcement works (only one default per org)

## Architecture Alignment

This migration aligns with the following architectural decisions from [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md):

- **Multi-Tenancy:** Database-level isolation via RLS (not application-level filtering)
- **Organization ID in JWT:** Injected via `set_organization_claim()` trigger for stateless auth
- **Dual Authentication:** Supports email/password (owners) and PIN (staff) via `chk_auth_method` constraint
- **Soft Deletes:** Organizations have `deleted_at` for data retention/recovery
- **Audit Trail:** Timestamps on all tables, ready for `audit_logs` table in future migrations
