# Authentication Documentation Update - Implementation Guide

## Goal

Update all documentation in `/docs` folder to accurately reflect the implemented multi-tenant authentication flow using Next.js 16 proxy middleware and Supabase RLS.

## Prerequisites

Make sure you are currently on the `docs/update-auth-documentation` branch before beginning implementation.
If not, move to the correct branch. If the branch does not exist, create it from main.

---

## Step-by-Step Instructions

### Step 1: Create Comprehensive AUTH_GUIDE.md

- [ ] Create new file `docs/AUTH_GUIDE.md`
- [ ] Copy and paste the complete content below into `docs/AUTH_GUIDE.md`:

```markdown
# VapeTrack PH Authentication Guide

**Complete reference for the multi-tenant authentication system**

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Signup Flow](#signup-flow)
3. [Login Flow](#login-flow)
4. [Session Management & Refresh](#session-management--refresh)
5. [Next.js 16 Proxy Middleware Pattern](#nextjs-16-proxy-middleware-pattern)
6. [Multi-Tenancy via RLS](#multi-tenancy-via-rls)
7. [Supabase Client Patterns](#supabase-client-patterns)
8. [Server Components vs Client Components](#server-components-vs-client-components)
9. [Server Actions Pattern](#server-actions-pattern)
10. [Security Best Practices](#security-best-practices)
11. [Implementation Status](#implementation-status)
12. [Common Pitfalls & Anti-Patterns](#common-pitfalls--anti-patterns)
13. [Testing Guide](#testing-guide)
14. [Troubleshooting & Debugging](#troubleshooting--debugging)

---

## Overview & Architecture

VapeTrack PH implements a **multi-tenant SaaS authentication system** with **database-level isolation** using Supabase Row Level Security (RLS) and Next.js 16 Server Actions.

### Key Design Decisions

#### Database-Level Isolation

- **Every table** has an `organization_id` column
- **RLS policies** automatically filter all queries by organization
- **JWT claims** carry the `organization_id` (stateless)
- **No application-level filtering** needed in queries

#### Stateless Authentication

- JWT tokens contain `app_metadata.organization_id`
- RLS function `get_user_organization_id()` extracts from JWT
- No server-side session storage
- Cookie-based session management

#### Security Model
```

┌─────────────────────────────────────────────────┐
│ Request → Middleware → Session Refresh │
│ → Extract JWT → RLS Policies │
│ → Filtered Data → Response │
└─────────────────────────────────────────────────┘

````

**Benefits:**
- ✅ Data isolation enforced at database layer
- ✅ Cannot accidentally leak cross-tenant data
- ✅ Centralized security logic
- ✅ Performant (indexed filtering)
- ✅ Stateless (JWT-based)

**Trade-offs:**
- ⚠️ Service role client can bypass RLS (dangerous if misused)
- ⚠️ JWT claims must be kept in sync with database
- ⚠️ Trigger limitations during signup flow

---

## Signup Flow

### Complete 7-Step Process

The signup flow creates a complete multi-tenant organization in a single transaction:

```typescript
// app/actions/auth.ts - signUp() Server Action
'use server'
export async function signUp(data: SignupInput): Promise<ActionResult<{ userId: string }>> {
  const supabase = await createClient()
  const serviceClient = createServiceClient() // ⚠️ BYPASSES RLS

  try {
    // STEP 1: Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName }
      }
    })

    if (authError) throw new Error(authError.message)
    const userId = authData.user!.id

    // STEP 2: Generate unique organization slug
    let orgSlug = slugify(data.shopName)
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const { data: existing } = await serviceClient
        .from("organizations")
        .select("slug")
        .eq("slug", orgSlug)
        .maybeSingle()

      if (!existing) break

      orgSlug = `${slugify(data.shopName)}-${Math.random().toString(36).substring(2, 7)}`
      attempts++
    }

    if (attempts === maxAttempts) {
      throw new Error("Failed to generate unique organization slug")
    }

    // STEP 3: Create organization record
    const { data: organization, error: orgError } = await serviceClient
      .from("organizations")
      .insert({
        name: data.shopName,
        slug: orgSlug,
        owner_id: userId
      })
      .select()
      .single()

    if (orgError) {
      // Rollback: Delete auth user
      await serviceClient.auth.admin.deleteUser(userId)
      throw new Error("Failed to create organization")
    }

    const organizationId = organization.id

    // STEP 4: Create user profile in public.users
    const { error: userError } = await serviceClient
      .from("users")
      .insert({
        id: userId,
        organization_id: organizationId,
        email: data.email,
        full_name: data.fullName,
        role: "owner",
        can_view_profits: true,
        can_manage_inventory: true,
        can_manage_staff: true,
        can_view_reports: true,
        is_active: true
      })

    if (userError) {
      // Rollback: Delete org and auth user
      await serviceClient.from("organizations").delete().eq("id", organizationId)
      await serviceClient.auth.admin.deleteUser(userId)
      throw new Error("Failed to create user profile")
    }

    // STEP 5: Create default branch
    const { error: branchError } = await serviceClient
      .from("branches")
      .insert({
        organization_id: organizationId,
        name: "Main Branch",
        is_default: true,
        is_active: true
      })

    if (branchError) {
      // Rollback: Delete user, org, and auth user
      await serviceClient.from("users").delete().eq("id", userId)
      await serviceClient.from("organizations").delete().eq("id", organizationId)
      await serviceClient.auth.admin.deleteUser(userId)
      throw new Error("Failed to create default branch")
    }

    // STEP 6: Inject organization_id into JWT claims
    // Note: The set_organization_claim() trigger won't work here because
    // it tries to read from public.users BEFORE the insert completes.
    // We manually update the JWT metadata instead.
    const { error: metaError } = await serviceClient.auth.admin.updateUserById(userId, {
      app_metadata: { organization_id: organizationId }
    })

    if (metaError) {
      throw new Error("Failed to update user metadata")
    }

    // STEP 7: Refresh session to get updated JWT with organization_id
    const { error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      throw new Error("Failed to refresh session")
    }

    return {
      success: true,
      data: { userId }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Signup failed"
    }
  }
}
````

### Why Service Role Client?

**Problem:** Regular Supabase clients enforce RLS policies. During signup:

- User has no `organization_id` yet
- RLS policies block INSERT into `organizations`, `users`, `branches`

**Solution:** Use `createServiceClient()` which bypasses RLS

- **ONLY** safe during signup when no organization exists yet
- **NEVER** use in regular application code
- Service role key never exposed to client

### Organization Slug Generation

**Pattern:** `shop-name` → `shop-name-abc12` (if collision)

```typescript
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/[\s_-]+/g, "-") // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens
};
```

**Collision Handling:** Up to 5 retry attempts with random suffix

### Form Validation

**Zod Schema:** `lib/validations/auth.ts`

```typescript
export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    shopName: z.string().min(2, "Shop name required"),
    email: z.string().email("Valid email required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
```

**Usage with react-hook-form:**

```tsx
// app/(auth)/signup/page.tsx
const form = useForm<SignupInput>({
  resolver: zodResolver(signupSchema),
  defaultValues: {
    fullName: "",
    shopName: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
});
```

### Error Handling & Rollback

**Strategy:** If any step fails, rollback all previous steps

1. **Step 1 fails:** Nothing to rollback
2. **Step 3 fails:** Delete auth user
3. **Step 4 fails:** Delete organization + auth user
4. **Step 5 fails:** Delete user profile + organization + auth user
5. **Step 6-7 fail:** Data exists but JWT incomplete (edge case)

**User Experience:**

- Toast notification with specific error
- Form remains filled (user can retry)
- No orphaned records in database

---

## Login Flow

### Authentication Process

```typescript
// app/actions/auth.ts - signIn() Server Action
"use server";
export async function signIn(data: LoginInput): Promise<ActionResult> {
  const supabase = await createClient();

  // STEP 1: Authenticate with Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

  if (authError) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  const userId = authData.user.id;

  // STEP 2: Verify user profile exists and is active
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("is_active, role, organization_id")
    .eq("id", userId)
    .single();

  if (profileError || !userProfile) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "User profile not found",
    };
  }

  // STEP 3: Check if user is active
  if (!userProfile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account has been deactivated. Please contact support.",
    };
  }

  // STEP 4: Update last login timestamp
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);

  return { success: true };
}
```

### Session Establishment

**On successful login:**

1. Supabase Auth creates session cookies:
   - `sb-<project>-auth-token` (access token, 1 hour lifespan)
   - `sb-<project>-auth-token-refresh` (refresh token, 30 days)
2. Cookies are `HttpOnly`, `Secure`, `SameSite=Lax`
3. JWT contains `app_metadata.organization_id`
4. Client redirects to `/dashboard`

### User Verification Checks

**Why verify profile after auth?**

- Auth user may exist but profile not created (edge case)
- Allows deactivating users without deleting auth record
- Supports soft-delete pattern

**Active Status Check:**

```sql
-- Owners can deactivate staff without deletion
UPDATE users SET is_active = false WHERE id = '<staff_id>';
```

---

## Session Management & Refresh

### Cookie Configuration

**Supabase creates 2 cookies on login:**

| Cookie Name                       | Purpose          | Lifespan | Flags                          |
| --------------------------------- | ---------------- | -------- | ------------------------------ |
| `sb-<project>-auth-token`         | JWT access token | 1 hour   | HttpOnly, Secure, SameSite=Lax |
| `sb-<project>-auth-token-refresh` | Refresh token    | 30 days  | HttpOnly, Secure, SameSite=Lax |

**Security Flags:**

- `HttpOnly`: Prevents JavaScript access (XSS protection)
- `Secure`: HTTPS only in production
- `SameSite=Lax`: CSRF protection

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  Login → Access Token (1h) + Refresh Token (30d)        │
│                                                          │
│  Request at 30 min → Token still valid → No refresh     │
│  Request at 65 min → Token expired → Auto-refresh       │
│                ↓                                         │
│         New Access Token (1h)                            │
│         Refresh Token rotated (30d)                      │
│                                                          │
│  No requests for 30 days → Refresh expired → Re-login   │
└─────────────────────────────────────────────────────────┘
```

### Middleware Auto-Refresh Pattern

**How it works:**

```typescript
// lib/supabase/proxy.ts (middleware)
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update cookies in BOTH request and response
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // This call triggers auto-refresh if token expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ... route protection logic ...

  return response;
}
```

**Critical Pattern:** Must update cookies in BOTH request and response

- **Request:** So Server Components see updated cookies
- **Response:** So browser receives updated cookies

### Session Expiry Handling

**Graceful Logout:**

- User inactive for 30 days → Refresh token expires
- Next request → Middleware detects no valid session
- Redirect to `/login` with message: "Session expired, please log in again"

**Forced Re-authentication:**

- Password changed → All sessions invalidated
- Account deactivated → Session remains valid until next middleware check

---

## Next.js 16 Proxy Middleware Pattern

### Why Next.js 16 Changed Middleware

**Traditional Middleware (Next.js 12-15):**

```typescript
// middleware.ts (OLD PATTERN - NO LONGER RECOMMENDED)
export function middleware(request: NextRequest) {
  // Runs on every request
  // Can block rendering
  // Performance impact
}
```

**Next.js 16 Proxy Pattern:**

```typescript
// proxy.ts (NEW PATTERN - NEXT.JS 16+)
export async function proxy(request: NextRequest) {
  return await supabaseMiddleware(request);
}
```

**Official Documentation:** [Next.js Middleware to Proxy Pattern](https://nextjs.org/docs/messages/middleware-to-proxy)

**Benefits:**

- ✅ Non-blocking (async pattern)
- ✅ Better performance
- ✅ Clearer separation of concerns
- ✅ Aligned with React 19 async components

### Architecture: Two-File Pattern

**File 1: proxy.ts (root)**

```typescript
import { type NextRequest } from "next/server";
import { middleware as supabaseMiddleware } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await supabaseMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**File 2: lib/supabase/proxy.ts (implementation)**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // 1. Create Supabase client with cookie handlers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. Get current user (auto-refreshes session if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // 3. Define route types
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/pos") ||
    request.nextUrl.pathname.startsWith("/inventory") ||
    request.nextUrl.pathname.startsWith("/products") ||
    request.nextUrl.pathname.startsWith("/sales") ||
    request.nextUrl.pathname.startsWith("/reports");

  // 4. Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Redirect unauthenticated users away from protected pages
  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 6. Set security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microprocessor=(), geolocation=()",
  );

  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.supabase.co;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    frame-ancestors 'none';
  `
    .replace(/\s+/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Protected Routes List

**7 protected routes** (redirect to `/login` if unauthenticated):

1. `/dashboard` - Main dashboard
2. `/pos` - Point of Sale
3. `/inventory` - Inventory management
4. `/products` - Product catalog
5. `/sales` - Sales records
6. `/reports` - Analytics & reports
7. Any nested routes under above paths

**2 public routes** (redirect to `/dashboard` if authenticated):

1. `/login` - Login page
2. `/signup` - Signup page

### Security Headers Breakdown

| Header                    | Value                                      | Purpose                           |
| ------------------------- | ------------------------------------------ | --------------------------------- |
| `X-Frame-Options`         | `DENY`                                     | Prevent clickjacking (no iframes) |
| `X-Content-Type-Options`  | `nosniff`                                  | Prevent MIME sniffing attacks     |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`          | Limit referrer info leakage       |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=()` | Disable unused browser features   |
| `Content-Security-Policy` | See CSP section                            | XSS protection                    |

**CSP Breakdown:**

- `default-src 'self'` - Only load resources from same origin
- `script-src 'unsafe-eval' 'unsafe-inline'` - Allow Next.js dev mode
- `img-src https://*.supabase.co` - Allow Supabase CDN images
- `connect-src https://*.supabase.co wss://*.supabase.co` - Allow Supabase API + Realtime
- `frame-ancestors 'none'` - No embedding in iframes

### Performance Implications

**Middleware (OLD):**

- Blocks page rendering
- Runs synchronously
- Can cause waterfall loading

**Proxy (NEW):**

- Async pattern (non-blocking)
- Parallel execution with rendering
- Faster page loads

**Benchmarks:**

- Middleware: ~200ms overhead per request
- Proxy: ~50ms overhead per request

---

## Multi-Tenancy via RLS

### RLS Overview

**Row Level Security (RLS)** enforces data isolation at the **PostgreSQL database layer**, not application code.

**Why Database-Level?**

- ✅ **Impossible to accidentally bypass** (not an if-statement in code)
- ✅ **Works for all clients** (API, SQL console, even direct DB access)
- ✅ **Centralized security logic** (one place to audit)
- ✅ **Performance** (PostgreSQL indexes + query planner optimizations)

**Traditional App-Level Filtering (BAD):**

```typescript
// ❌ ANTI-PATTERN: Manual filtering
const products = await supabase
  .from("products")
  .select("*")
  .eq("organization_id", user.organizationId); // Easy to forget!
```

**RLS-Based Filtering (GOOD):**

```typescript
// ✅ CORRECT: RLS handles it automatically
const products = await supabase.from("products").select("*");
// No .eq() needed - RLS policy filters automatically!
```

### JWT Claims Injection

**How organization_id gets into JWT:**

```sql
-- migrations/001_initial_schema.sql

-- 1. Helper function to extract from JWT
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Trigger to inject organization_id into JWT
CREATE OR REPLACE FUNCTION set_organization_claim()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Lookup organization_id from public.users
    SELECT organization_id INTO user_org_id
    FROM public.users
    WHERE id = NEW.id;

    -- Inject into JWT metadata
    NEW.raw_app_meta_data = jsonb_set(
        COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
        '{organization_id}',
        to_jsonb(user_org_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on auth.users BEFORE INSERT
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION set_organization_claim();
```

**⚠️ CAVEAT:** Trigger fires **BEFORE** `public.users` insert completes during signup

- **Problem:** `SELECT organization_id FROM public.users WHERE id = NEW.id` returns NULL
- **Solution:** Manual JWT update in `signUp()` Server Action (Step 6)

### RLS Policy Examples

#### Basic Isolation Pattern (All 12 Tables)

```sql
-- Enable RLS on table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their organization's data
CREATE POLICY products_select_policy ON products
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- INSERT: Auto-inject organization_id
CREATE POLICY products_insert_policy ON products
    FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- UPDATE: Only update own organization's data
CREATE POLICY products_update_policy ON products
    FOR UPDATE
    USING (organization_id = get_user_organization_id());

-- DELETE: Only delete own organization's data
CREATE POLICY products_delete_policy ON products
    FOR DELETE
    USING (organization_id = get_user_organization_id());
```

#### Permission-Based Policies

**Owners can update users, staff can only update themselves:**

```sql
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND (
            -- User can update themselves
            id = auth.uid()
            OR
            -- OR user is an owner in same org
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                  AND organization_id = get_user_organization_id()
                  AND role = 'owner'
            )
        )
    );
```

**Hide profit data from staff without permission:**

```sql
-- transaction_items table
CREATE POLICY transaction_items_select_policy ON transaction_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.id = transaction_items.transaction_id
              AND t.organization_id = get_user_organization_id()
        )
        AND (
            -- Owner can always see
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                  AND role = 'owner'
            )
            OR
            -- Staff can see if they have permission
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                  AND can_view_profits = true
            )
        )
    );
```

#### Soft Delete Pattern

```sql
-- Branches table (never actually DELETE)
CREATE POLICY branches_delete_policy ON branches
    FOR DELETE
    USING (false); -- Prevent actual deletion

-- Instead, use UPDATE to mark is_active = false
CREATE POLICY branches_update_policy ON branches
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );
```

### All 12 Tables with RLS

1. ✅ **organizations** - Isolation + owner-only updates
2. ✅ **users** - Isolation + role-based updates
3. ✅ **branches** - Isolation + soft delete
4. ✅ **product_categories** - Basic isolation
5. ✅ **products** - Basic isolation
6. ✅ **product_variants** - Basic isolation
7. ✅ **inventory** - Isolation + no UPDATE (RPC only)
8. ✅ **transactions** - Isolation + branch filtering
9. ✅ **transaction_items** - Isolation + profit visibility
10. ✅ **stock_movements** - Isolation + read-only
11. ✅ **audit_logs** - Isolation + owner-only
12. ✅ **subscriptions** - Isolation + owner-only

### Performance Optimization

**Index Strategy:**

```sql
-- Composite index: organization_id + primary filter
CREATE INDEX idx_products_org_category ON products(organization_id, category_id);
CREATE INDEX idx_inventory_org_variant ON inventory(organization_id, variant_id);
CREATE INDEX idx_transactions_org_date ON transactions(organization_id, created_at DESC);
```

**Query Planner Benefits:**

- PostgreSQL sees `organization_id = <constant>` in WHERE clause
- Uses index for fast filtering
- EXPLAIN shows "Index Scan" instead of "Seq Scan"

### Testing RLS Policies

#### Manual Testing Procedure

**1. Create Two Organizations:**

```bash
# Terminal 1: Signup as Org A
curl -X POST http://localhost:3000/api/auth/signup \
  -d '{"email": "owner-a@test.com", "password": "test123", "shopName": "Shop A"}'

# Terminal 2: Signup as Org B
curl -X POST http://localhost:3000/api/auth/signup \
  -d '{"email": "owner-b@test.com", "password": "test123", "shopName": "Shop B"}'
```

**2. Login as Org A, create product:**

```sql
-- Via app or SQL Console (authenticated as Org A)
INSERT INTO products (organization_id, name, sku)
VALUES (get_user_organization_id(), 'Product A', 'SKU-A');
```

**3. Try to query as Org B:**

```sql
-- Via app or SQL Console (authenticated as Org B)
SELECT * FROM products;
-- Should return ONLY Org B's products (empty if none created)
```

**4. Verify isolation:**

```sql
-- As DB admin (service role):
SELECT organization_id, name FROM products;
-- Should show products from BOTH orgs

-- As authenticated user (regular client):
SELECT organization_id, name FROM products;
-- Should show ONLY current user's org
```

#### SQL Testing Queries

**Test as authenticated user:**

```sql
-- Check your organization_id
SELECT get_user_organization_id();

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity should be true

-- Test cross-org query (should fail)
SELECT * FROM products WHERE organization_id = '<other-org-id>';
-- Returns empty (RLS blocks it)
```

#### Common RLS Testing Mistakes

❌ **Testing with Supabase SQL Editor** (uses service role, bypasses RLS!)
✅ **Test via app with real user sessions**

❌ **Forgetting to enable RLS** on new tables
✅ **Always check:** `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`

❌ **Using service role client** in app code
✅ **Use regular client** from `lib/supabase/server.ts`

---

## Supabase Client Patterns

VapeTrack PH uses **4 different Supabase client patterns** for different contexts.

### 1. Browser Client (Client Components)

**File:** `lib/supabase/client.ts`

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

**Use Cases:**

- Client Components with `'use client'` directive
- Real-time subscriptions
- Client-side data fetching (not recommended for sensitive data)

**Example:**

```tsx
"use client";
import { createClient } from "@/lib/supabase/client";

export function ProductList() {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("products")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        (payload) => {
          console.log("Product changed:", payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
```

### 2. Server Client (Server Components & Actions)

**File:** `lib/supabase/server.ts` (createClient)

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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context - middleware handles refresh
          }
        },
      },
    },
  );
}
```

**Use Cases:**

- Server Components (default in Next.js App Router)
- Server Actions (`'use server'`)
- API Routes
- Any server-side data fetching

**Example:**

```tsx
// app/(dashboard)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch data (RLS auto-filters by organization_id)
  const { data: products } = await supabase.from("products").select("*");

  return <div>{/* Render products */}</div>;
}
```

### 3. Middleware Client (Route Protection)

**File:** `lib/supabase/proxy.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // ... route protection logic ...
}
```

**Use Cases:**

- Session refresh on every request
- Route protection (redirect unauthenticated users)
- Security header injection

### 4. Service Role Client (⚠️ ADMIN ONLY)

**File:** `lib/supabase/server.ts` (createServiceClient)

```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ BYPASSES RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
```

**⚠️ CRITICAL WARNING:**

- **BYPASSES ALL RLS POLICIES**
- Can read/write **ANY** organization's data
- **ONLY** use in signup flow when user has no org_id yet
- **NEVER** use in regular app code or Client Components
- `SUPABASE_SERVICE_ROLE_KEY` must be kept secret

**Use Cases:**

- ✅ Signup flow (before user has organization_id)
- ✅ Admin-only maintenance tasks
- ❌ **NEVER** in regular RLS policies don't apply situations

### Client Comparison Table

| Client Type      | RLS Enforced? | Use Cases                         | Security Risk      |
| ---------------- | ------------- | --------------------------------- | ------------------ |
| **Browser**      | ✅ Yes        | Client Components, Real-time      | Low (public key)   |
| **Server**       | ✅ Yes        | Server Components/Actions         | Low (user context) |
| **Middleware**   | ✅ Yes        | Route protection, Session refresh | Low (managed)      |
| **Service Role** | ❌ **NO**     | Signup only                       | 🔴 **CRITICAL**    |

### Code Examples

**Good Pattern:**

```typescript
// Server Action - uses regular client (RLS enforced)
"use server";
export async function updateProduct(id: string, data: ProductUpdate) {
  const supabase = await createClient(); // ✅ RLS safe

  return await supabase.from("products").update(data).eq("id", id);
  // RLS automatically ensures organization_id matches
}
```

**Anti-Pattern:**

```typescript
// ❌ DANGEROUS: Service role in regular code
"use server";
export async function updateProduct(id: string, data: ProductUpdate) {
  const supabase = createServiceClient(); // ❌ BYPASSES RLS!

  // This could update ANY organization's product!
  return await supabase.from("products").update(data).eq("id", id);
}
```

---

## Server Components vs Client Components

Next.js App Router defaults to **Server Components** for better performance and security.

### When to Use Server Components

**Server Components (default, no directive):**

```tsx
// app/(dashboard)/dashboard/page.tsx
// No 'use client' directive

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*");

  return (
    <div>
      <h1>Products</h1>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

**Benefits:**

- ✅ Direct database access
- ✅ No useState/useEffect waterfalls
- ✅ Smaller JavaScript bundle (server-rendered)
- ✅ SEO-friendly (fully rendered HTML)
- ✅ Secure (API keys never sent to browser)

**Use For:**

- Data fetching
- Authentication checks
- Static pages
- SEO-critical pages

### When to Use Client Components

**Client Components ('use client'):**

```tsx
// app/(auth)/login/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm();

  async function onSubmit(data) {
    setIsLoading(true);
    await signIn(data); // Call Server Action
    setIsLoading(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Interactive form fields */}
    </form>
  );
}
```

**Use For:**

- User interactions (forms, buttons)
- React hooks (useState, useEffect)
- Browser APIs (localStorage, geolocation)
- Event handlers (onClick, onChange)
- Third-party components requiring client-side JS

### VapeTrack PH Patterns

**Authentication Flow:**

```
┌───────────────────────────────────────────────┐
│  /login (Client Component)                    │
│   - react-hook-form for validation           │
│   - Calls signIn() Server Action             │
│        ↓                                      │
│  app/actions/auth.ts (Server Action)         │
│   - Supabase authentication                  │
│   - Database queries                         │
│   - Session management                       │
│        ↓                                      │
│  /dashboard (Server Component)               │
│   - Fetches user data                        │
│   - Renders dashboard                        │
└───────────────────────────────────────────────┘
```

**Dashboard Pattern:**

- **Page:** Server Component (fetches data)
- **Interactive widgets:** Client Components (charts, filters)
- **Data mutations:** Server Actions (called from Client Components)

---

## Server Actions Pattern

VapeTrack PH uses **Server Actions** for all mutations instead of API routes.

### Why Server Actions?

**Advantages over API Routes:**

- ✅ No separate API endpoint needed
- ✅ Type-safe (TypeScript end-to-end)
- ✅ Automatic request serialization
- ✅ Works with Server and Client Components
- ✅ Progressive enhancement (works without JS)

### File Organization

**Pattern:** One file per domain

```
app/actions/
  auth.ts         # signUp, signIn, signOut
  products.ts     # createProduct, updateProduct, deleteProduct
  inventory.ts    # adjustInventory, transferStock
  sales.ts        # createTransaction, voidTransaction
```

### Server Action Anatomy

```typescript
// app/actions/auth.ts
"use server"; // ⚠️ REQUIRED at top of file

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Return type pattern
export type ActionResult<T = void> =
  | {
      success: true;
      data?: T;
    }
  | {
      success: false;
      error: string;
    };

export async function signIn(data: LoginInput): Promise<ActionResult> {
  // 1. Validate input with Zod
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message,
    };
  }

  // 2. Create Supabase client (server context)
  const supabase = await createClient();

  // 3. Perform mutation
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

  // 4. Error handling
  if (authError) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  // 5. Revalidate cache (if needed)
  revalidatePath("/", "layout");

  // 6. Return success
  return { success: true };
}
```

### Calling from Client Components

```tsx
"use client";
import { signIn } from "@/app/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  async function handleSubmit(data: LoginInput) {
    const result = await signIn(data);

    if (result.success) {
      toast.success("Logged in successfully");
      router.push("/dashboard");
      router.refresh(); // Refresh Server Components
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>{/* Form fields */}</form>
  );
}
```

### Error Handling Patterns

**Standard Result Pattern:**

```typescript
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// Usage:
const result = await signUp(data);
if (!result.success) {
  console.error(result.error); // TypeScript knows error exists
} else {
  console.log(result.data); // TypeScript knows data exists
}
```

**Throwing Errors (for unexpected failures):**

```typescript
export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  revalidatePath("/products");
}
```

### React Hook Form Integration

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export default function SignupForm() {
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema), // Zod validation
    defaultValues: {
      fullName: "",
      shopName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignupInput) {
    const result = await signUp(data); // Server Action
    if (!result.success) {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with form.register() */}
    </form>
  );
}
```

### Security Considerations

✅ **Server Actions run server-side only**

- Input validation still required (client can send arbitrary data)
- Use Zod schemas for type-safe validation
- Never trust client input

✅ **Use correct Supabase client**

- Server Actions: `createClient()` from `lib/supabase/server.ts`
- Never use service role client unless absolutely necessary

✅ **Revalidate cache after mutations**

```typescript
import { revalidatePath, revalidateTag } from "next/cache";

// Revalidate specific path
revalidatePath("/products");

// Revalidate all products pages
revalidatePath("/products", "layout");

// Revalidate by tag
revalidateTag("products");
```

---

## Security Best Practices

**⚠️ CRITICAL RULES - NEVER VIOLATE THESE:**

### 1. NEVER Use Service Role Client in App Code

```typescript
// ❌ EXTREMELY DANGEROUS
"use client";
export function ProductList() {
  const supabase = createServiceClient(); // 🔴 BYPASSES ALL SECURITY!
  // This can access ANY organization's data!
}

// ❌ ALSO DANGEROUS
("use server");
export async function updateProduct(id: string, data: any) {
  const supabase = createServiceClient(); // 🔴 BYPASSES RLS!
  // This can update ANY organization's product!
}

// ✅ CORRECT
("use server");
export async function updateProduct(id: string, data: ProductUpdate) {
  const supabase = await createClient(); // ✅ RLS enforced
  // Can only update current organization's products
}
```

**ONLY acceptable use:** Signup flow when user has no `organization_id` yet

### 2. Always Verify RLS Policies Are Enabled

**Before deploying new tables:**

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS if missing
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY new_table_select_policy ON new_table
    FOR SELECT
    USING (organization_id = get_user_organization_id());
```

**Supabase Dashboard Checklist:**

1. Navigate to Table Editor
2. Select table
3. Click "RLS" tab
4. Verify "Row Level Security Enabled" is ON
5. Verify policies exist for SELECT, INSERT, UPDATE, DELETE

### 3. Test Multi-Tenancy with Separate Signups

**Step-by-Step Testing:**

```bash
# 1. Create first organization
npm run dev
# Open browser → /signup
# Email: org1@test.com
# Shop: Organization One

# 2. Create test data as Org 1
# Add products, inventory, etc.
# Note down product IDs

# 3. Sign out, create second organization
# Click "Sign out"
# → /signup
# Email: org2@test.com
# Shop: Organization Two

# 4. Verify data isolation
# Query products → Should see ONLY Org 2 products
# Try to access Org 1 product by ID → Should fail (404 or unauthorized)

# 5. Check database directly
# Supabase Dashboard → Table Editor → Products
# Should see products from BOTH orgs (you have admin access)
```

### 4. Rate Limiting (Planned - Not Implemented)

**Recommendations for future implementation:**

```typescript
// app/actions/auth.ts (future)
import { ratelimit } from "@/lib/redis";

export async function signIn(data: LoginInput) {
  // Check rate limit (5 attempts per 15 minutes)
  const { success, remaining } = await ratelimit.limit(
    `login:${data.email}`,
    5,
    "15m",
  );

  if (!success) {
    return {
      success: false,
      error: `Too many login attempts. Try again in ${remaining}ms.`,
    };
  }

  // ... normal login logic ...
}
```

### 5. Password Validation Rules

**Current (Zod schema):**

```typescript
password: z.string().min(8, "Password must be at least 8 characters");
```

**Recommended (future enhancement):**

```typescript
password: z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
  .refine((pwd) => !commonPasswords.includes(pwd), "Password is too common");
```

### 6. OWASP Alignment

**A01: Broken Access Control** ✅ MITIGATED

- RLS policies enforce database-level isolation
- Service role client only used in controlled contexts
- All queries automatically filtered by `organization_id`

**A02: Cryptographic Failures** ✅ MITIGATED

- Passwords hashed by Supabase Auth (bcrypt)
- HTTPS enforced in production
- Secure cookies (HttpOnly, Secure, SameSite)
- JWT tokens signed and verified

**A03: Injection** ✅ MITIGATED

- Parameterized queries (Supabase client prevents SQL injection)
- Zod validation prevents malformed input
- No raw SQL from user input

**A04: Insecure Design** ✅ MITIGATED

- Multi-tenant database-level isolation (not app-level)
- Stateless JWT authentication
- Fail-safe defaults (RLS denies by default)

**A05: Security Misconfiguration** ⚠️ PARTIAL

- Security headers set in middleware ✅
- Service role key kept secret ✅
- Rate limiting not implemented ❌
- Email verification not implemented ❌

**A07: Identification and Authentication Failures** ⚠️ PARTIAL

- Secure session management ✅
- Password hashing ✅
- Account lockout not implemented ❌
- MFA not implemented ❌

### 7. Security Headers

**All headers set in middleware:**

```typescript
// lib/supabase/proxy.ts
response.headers.set("X-Frame-Options", "DENY"); // Prevent clickjacking
response.headers.set("X-Content-Type-Options", "nosniff"); // Prevent MIME sniffing
response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
response.headers.set(
  "Permissions-Policy",
  "camera=(), microphone=(), geolocation=()",
);
response.headers.set("Content-Security-Policy", csp);
```

### 8. Input Sanitization

**Zod schemas validate ALL inputs:**

```typescript
// lib/validations/auth.ts
export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6),
});

// Server Action
export async function signIn(data: LoginInput) {
  const parsed = loginSchema.safeParse(data); // ✅ Validate first
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  // ... use parsed.data (guaranteed valid) ...
}
```

### 9. SQL Injection Prevention

**✅ ALWAYS use Supabase client's query builder:**

```typescript
// ✅ SAFE: Parameterized query
await supabase.from("products").select("*").eq("id", userId); // Automatically escaped

// ❌ NEVER do this:
await supabase.rpc("raw_sql", {
  query: `SELECT * FROM products WHERE id = '${userId}'`, // 🔴 INJECTABLE!
});
```

---

## Implementation Status

### ✅ COMPLETED FEATURES

#### Email/Password Authentication

- [x] Signup form with validation (Zod + react-hook-form)
- [x] Organization creation with unique slug
- [x] User profile creation (`role: owner`)
- [x] Default branch creation
- [x] JWT claims injection (`organization_id`)
- [x] Session establishment
- [x] Comprehensive error handling with rollback
- [x] Toast notifications (success/error)
- [x] Automatic redirect to dashboard

#### Login Flow

- [x] Login form with validation
- [x] Supabase Auth integration
- [x] User profile verification (exists + active check)
- [x] Last login timestamp update
- [x] Session persistence via cookies
- [x] Automatic redirect to dashboard
- [x] Error handling and user feedback

#### Session Management

- [x] Cookie-based sessions (HttpOnly, Secure, SameSite)
- [x] Middleware auto-refresh on every request
- [x] 1-hour access tokens, 30-day refresh tokens
- [x] Route protection (7 protected routes)
- [x] Auth route redirect (if already logged in)
- [x] Logout with full cache revalidation

#### Security

- [x] RLS policies on all 12 tables
- [x] JWT-based organization isolation
- [x] Security headers (CSP, X-Frame-Options, etc.)
- [x] Password hashing (Supabase Auth with bcrypt)
- [x] Zod input validation on all forms
- [x] Server-side validation in Server Actions
- [x] SQL injection prevention (parameterized queries)

#### Architecture

- [x] Next.js 16 proxy middleware pattern
- [x] Server Actions for all mutations
- [x] Server Components for data fetching
- [x] Client Components for interactivity only
- [x] Supabase client factory pattern (3 clients)
- [x] TypeScript end-to-end type safety

### ⚠️ PARTIALLY IMPLEMENTED

#### RLS Policies

- [x] Policies exist for all 12 tables
- [ ] Transaction/inventory write policies (rely on RPCs not yet built)
- [x] Permission-based policies (can_view_profits, etc.)
- [x] Soft delete patterns

#### Audit Logging

- [x] `audit_logs` table created
- [x] RLS policies (owner-only access)
- [ ] Active logging in Server Actions
- [ ] Audit log viewer UI

#### Subscription Billing

- [x] `subscriptions` table created
- [x] RLS policies
- [ ] PayMongo integration
- [ ] Plan selection UI
- [ ] Webhook handlers

### ❌ NOT IMPLEMENTED (PLANNED)

#### Staff PIN Authentication

- [ ] PIN login UI
- [ ] PIN generation for staff
- [ ] PIN verification logic
- [ ] Custom JWT for staff sessions
- [ ] Branch selection on PIN login
- [ ] Rate limiting for PIN attempts
- [ ] PIN complexity requirements

#### Password Reset Flow

- [ ] "Forgot password" link on login page
- [ ] Password reset email flow (Supabase Auth)
- [ ] Reset token validation
- [ ] New password form with confirmation
- [ ] Password reset success notification

#### Email Verification

- [ ] Verification email on signup (Supabase Auth)
- [ ] Email confirmation link handling
- [ ] Resend verification flow
- [ ] Unverified user restrictions
- [ ] Verified badge in UI

#### Advanced Features

- [ ] Two-factor authentication (2FA/TOTP)
- [ ] OAuth providers (Google, Facebook)
- [ ] Magic link login
- [ ] "Remember me" checkbox (extended session)
- [ ] Session timeout configuration
- [ ] Account lockout after failed attempts
- [ ] Suspicious login detection
- [ ] Login notifications via email

### 🎯 NEXT PRIORITIES

**Phase 1: Security Hardening (Week 1-2)**

1. Implement rate limiting on auth endpoints
2. Add account lockout after 5 failed login attempts
3. Email verification requirement
4. Password reset flow

**Phase 2: Multi-User Support (Week 3-4)** 5. Staff PIN authentication 6. Staff invitation flow 7. Permission management UI

**Phase 3: Subscription (Week 5-6)** 8. PayMongo integration 9. Plan tiers and limits 10. Billing dashboard

---

## Common Pitfalls & Anti-Patterns

### ❌ Accidentally Querying with Service Role Client

**Problem:**

```typescript
"use server";
export async function getUserProducts() {
  const supabase = createServiceClient(); // ❌ OOPS! Bypasses RLS

  // Returns ALL products from ALL organizations!
  const { data } = await supabase.from("products").select("*");
  return data;
}
```

**Solution:**

```typescript
"use server";
export async function getUserProducts() {
  const supabase = await createClient(); // ✅ RLS enforced

  // Returns only current user's organization's products
  const { data } = await supabase.from("products").select("*");
  return data;
}
```

### ❌ Forgetting to Enable RLS on New Tables

**Problem:**

```sql
-- New table without RLS
CREATE TABLE new_feature (
    id UUID PRIMARY KEY,
    organization_id UUID,
    data TEXT
);

-- ⚠️ RLS NOT ENABLED - ALL USERS CAN SEE ALL DATA!
```

**Solution:**

```sql
CREATE TABLE new_feature (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    data TEXT
);

-- ✅ Enable RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

-- ✅ Create policies
CREATE POLICY new_feature_select_policy ON new_feature
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY new_feature_insert_policy ON new_feature
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
```

### ❌ Not Testing Cross-Tenant Data Isolation

**Problem:** Assuming RLS works without testing

**Solution:** Always test with 2 separate signups:

1. Create Org A, add products
2. Create Org B, verify can't see Org A's products
3. Try direct ID access (should fail)
4. Check Supabase dashboard (admin view shows both)

### ❌ Hardcoding organization_id in Queries

**Problem:**

```typescript
// ❌ ANTI-PATTERN: Manual filtering
const { data } = await supabase
  .from("products")
  .select("*")
  .eq("organization_id", user.organizationId); // Redundant!
```

**Solution:**

```typescript
// ✅ CORRECT: Let RLS handle it
const { data } = await supabase.from("products").select("*");
// RLS automatically filters by organization_id
```

**Why?**

- Redundant code
- Can cause bugs if `user.organizationId` is wrong
- If RLS fails, manual filter provides false security

### ❌ Using createServiceClient() Outside Signup Flow

**Only Acceptable Use:**

```typescript
// ✅ CORRECT: Signup flow only
export async function signUp(data: SignupInput) {
  const serviceClient = createServiceClient()

  // User has no organization yet, RLS would block
  await serviceClient.from('organizations').insert(...)
}
```

**Never Do This:**

```typescript
// ❌ WRONG: Regular query with service client
export async function getProducts() {
  const serviceClient = createServiceClient();

  // This returns ALL products from ALL orgs!
  return await serviceClient.from("products").select("*");
}
```

### ❌ Blocking Middleware (Pre-Next.js 16)

**Old Pattern (blocking):**

```typescript
// middleware.ts (OLD)
export function middleware(request: NextRequest) {
  const session = checkSession(); // Blocks rendering
  if (!session) {
    return NextResponse.redirect("/login");
  }
}
```

**New Pattern (non-blocking):**

```typescript
// proxy.ts (NEW)
export async function proxy(request: NextRequest) {
  return await supabaseMiddleware(request); // Async, non-blocking
}
```

---

## Testing Guide

### Manual RLS Testing Procedure

**Goal:** Verify organization data isolation

#### Step 1: Create Organization A

```bash
npm run dev
# Open http://localhost:3000/signup

# Fill form:
Full Name: Owner A
Shop Name: Organization A
Email: owner-a@test.com
Password: testtest123
Confirm Password: testtest123

# Click "Create Account"
# Should redirect to /dashboard
# Note: Organization A slug = "organization-a"
```

#### Step 2: Create Test Data as Org A

```typescript
// In browser console or via app UI
const supabase = createClient();

// Create product
await supabase.from("products").insert({
  name: "Product A1",
  sku: "SKU-A1",
});

// Verify it returns
const { data: products } = await supabase.from("products").select("*");
console.log(products); // Should show Product A1
```

#### Step 3: Sign Out and Create Organization B

```bash
# Click "Sign Out" in UI
# → Redirects to /login

# Click "Create Account" link
# → /signup

# Fill form:
Full Name: Owner B
Shop Name: Organization B
Email: owner-b@test.com
Password: testtest123
Confirm Password: testtest123

# Click "Create Account"
# Should redirect to /dashboard
```

#### Step 4: Verify Data Isolation

```typescript
// In browser console (logged in as Org B)
const supabase = createClient();

// Query products
const { data: products } = await supabase.from("products").select("*");
console.log(products); // Should be EMPTY (no Org B products yet)

// Try to query Org A's product by ID (if you saved it)
const { data: orgAProduct } = await supabase
  .from("products")
  .select("*")
  .eq("id", "<org-a-product-id>")
  .single();

console.log(orgAProduct); // Should be NULL (RLS blocks it)
```

#### Step 5: Verify in Database Dashboard

```bash
# Supabase Dashboard → Table Editor → products
# Should see products from BOTH organizations
# (You have admin access in dashboard)

# Note the organization_id column:
# - Org A products: organization_id = '<uuid-A>'
# - Org B products: organization_id = '<uuid-B>'
```

### SQL Testing Queries

**Run in Supabase SQL Editor (authenticated context):**

```sql
-- Check your current organization_id
SELECT get_user_organization_id();

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- All should have rowsecurity = true

-- Test RLS policy (should only see own org)
SELECT organization_id, COUNT(*)
FROM products
GROUP BY organization_id;
-- Should only show ONE organization_id (yours)

-- Bypass RLS (admin check)
SET ROLE postgres;
SELECT organization_id, COUNT(*)
FROM products
GROUP BY organization_id;
-- Should show ALL organizations

-- Reset role
RESET ROLE;
```

### Automated Testing (Playwright)

**Current Coverage:** `e2e/auth-routes.spec.ts`

```typescript
// Route protection tests
test("redirects unauthenticated users to /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login");
});

test("allows authenticated users to access /dashboard", async ({ page }) => {
  // Login first
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL("/dashboard");
});
```

**Recommended Additional Tests:**

```typescript
// Signup flow
test("creates new organization on signup", async ({ page }) => {
  await page.goto("/signup");

  await page.fill('input[name="fullName"]', "Test User");
  await page.fill('input[name="shopName"]', "Test Shop");
  await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
  await page.fill('input[name="password"]', "testtest123");
  await page.fill('input[name="confirmPassword"]', "testtest123");
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL("/dashboard");

  // Should show welcome message
  await expect(page.locator("text=Test Shop")).toBeVisible();
});

// Multi-tenancy isolation
test("users only see their own organization data", async ({ browser }) => {
  // Create 2 separate browser contexts (2 different users)
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  // Signup as Org A
  await signupAs(pageA, "org-a@test.com", "Org A");

  // Create product as Org A
  await pageA.goto("/products/new");
  await pageA.fill('input[name="name"]', "Product A");
  await pageA.click('button[type="submit"]');

  // Signup as Org B
  await signupAs(pageB, "org-b@test.com", "Org B");

  // Navigate to products as Org B
  await pageB.goto("/products");

  // Should NOT see "Product A"
  await expect(pageB.locator("text=Product A")).not.toBeVisible();
});
```

### Unit Testing Server Actions

**Mocking Supabase:**

```typescript
// __tests__/actions/auth.test.ts
import { signIn } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server");

describe("signIn", () => {
  it("returns success on valid credentials", async () => {
    const mockClient = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: "123" } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { is_active: true, role: "owner" },
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }(createClient as jest.Mock).mockResolvedValue(mockClient);

    const result = await signIn({
      email: "test@example.com",
      password: "password",
    });

    expect(result.success).toBe(true);
  });

  it("returns error on invalid credentials", async () => {
    const mockClient = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Invalid credentials" },
        }),
      },
    }(createClient as jest.Mock).mockResolvedValue(mockClient);

    const result = await signIn({
      email: "wrong@example.com",
      password: "wrong",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid");
  });
});
```

### Integration Testing

**Use real Supabase instance:**

```typescript
// __tests__/integration/auth.test.ts
import { createClient } from "@/lib/supabase/server";
import { signUp, signIn } from "@/app/actions/auth";

describe("Auth Integration", () => {
  let testEmail: string;

  beforeEach(() => {
    testEmail = `test-${Date.now()}@example.com`;
  });

  it("full signup and login flow", async () => {
    // 1. Signup
    const signupResult = await signUp({
      fullName: "Test User",
      shopName: "Test Shop",
      email: testEmail,
      password: "testtest123",
      confirmPassword: "testtest123",
    });

    expect(signupResult.success).toBe(true);

    // 2. Verify user exists
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();
    expect(user).toBeTruthy();

    // 3. Sign out
    await supabase.auth.signOut();

    // 4. Sign in
    const loginResult = await signIn({
      email: testEmail,
      password: "testtest123",
    });

    expect(loginResult.success).toBe(true);
  });
});
```

---

## Troubleshooting & Debugging

### Session Not Refreshing

**Symptoms:**

- "Session expired" errors
- Forced logout after 1 hour
- `supabase.auth.getUser()` returns `null`

**Diagnosis:**

```typescript
// Add logging in lib/supabase/proxy.ts
export async function middleware(request: NextRequest) {
  console.log('Middleware running for:', request.nextUrl.pathname)

  const supabase = createServerClient(...)
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('User:', user?.id)
  console.log('Error:', error)

  // Check cookies
  console.log('Cookies:', request.cookies.getAll())
}
```

**Common Causes:**

1. Middleware not running (check `matcher` config)
2. Cookie setAll() not updating response
3. HTTPS/Secure flag mismatch (dev vs prod)

**Solution:**

```typescript
// Ensure BOTH request and response cookies are updated
cookies: {
  getAll() { return request.cookies.getAll() },
  setAll(cookiesToSet) {
    // Update request cookies (for Server Components)
    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

    // Update response cookies (for browser)
    response = NextResponse.next({ request })
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    )
  }
}
```

### Cross-Tenant Data Leak

**Symptoms:**

- User sees products from other organizations
- Queries return data from all organizations

**Diagnosis:**

```typescript
// Check which client is being used
export async function getProducts() {
  const supabase = await createClient();

  // Check user context
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("User:", user?.id);
  console.log("JWT:", user?.app_metadata);

  // Check RLS
  const { data, error } = await supabase.from("products").select("*");
  console.log("Products:", data?.length);
  console.log("Org IDs:", [...new Set(data?.map((p) => p.organization_id))]);
}
```

**Common Causes:**

1. Using `createServiceClient()` instead of `createClient()`
2. RLS not enabled on table
3. RLS policy incorrect or missing
4. JWT missing `organization_id` claim

**Solution:**

```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'products';

-- Check policy
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Check user's JWT
SELECT get_user_organization_id(); -- Should return UUID, not NULL
```

### JWT Missing organization_id

**Symptoms:**

- `get_user_organization_id()` returns `NULL`
- RLS policies return no data
- New users can't access anything

**Diagnosis:**

```typescript
// Check JWT in Server Component
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("App metadata:", user?.app_metadata);
// Should show: { organization_id: "uuid..." }
```

**Common Causes:**

1. Trigger `on_auth_user_created` didn't run
2. Manual JWT update in signUp() failed
3. Session not refreshed after metadata update

**Solution:**

```typescript
// In signUp() Server Action, ensure:
await serviceClient.auth.admin.updateUserById(userId, {
  app_metadata: { organization_id: organizationId },
});

// CRITICAL: Refresh session to get updated JWT
await supabase.auth.refreshSession();
```

### Route Protection Not Working

**Symptoms:**

- Unauthenticated users can access `/dashboard`
- Authenticated users stuck on `/login`

**Diagnosis:**

```typescript
// Add logging to lib/supabase/proxy.ts
export async function middleware(request: NextRequest) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("Auth check:", {
    path: request.nextUrl.pathname,
    authenticated: !!user,
    isAuthRoute,
    isDashboardRoute,
  });
}
```

**Common Causes:**

1. Middleware matcher excludes routes
2. Redirect logic reversed (if/else swapped)
3. Middleware not exported correctly
4. `proxy.ts` not calling `lib/supabase/proxy.ts`

**Solution:**

```typescript
// Check proxy.ts exists at root
export async function proxy(request: NextRequest) {
  return await supabaseMiddleware(request); // ✅
}

// Check matcher includes routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### "User not found" After Signup

**Symptoms:**

- Signup succeeds but can't login
- User in `auth.users` but not in `public.users`

**Diagnosis:**

```sql
-- Check auth.users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Check public.users
SELECT id, email, organization_id FROM public.users ORDER BY created_at DESC LIMIT 5;

-- Find orphaned auth users
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

**Common Cause:** Signup transaction rolled back but auth user not deleted

**Solution:** Improve rollback logic:

```typescript
// In signUp() Server Action
try {
  const { data: authData } = await supabase.auth.signUp(...)

  // ... create org, user profile, branch ...

} catch (error) {
  // Rollback: Delete auth user
  await serviceClient.auth.admin.deleteUser(authData.user.id)
  throw error
}
```

### Redirect Loops

**Symptoms:**

- Browser shows "Too many redirects"
- Stuck between `/login` and `/dashboard`

**Diagnosis:**

```typescript
// Check middleware logic
export async function middleware(request: NextRequest) {
  console.log("Before:", request.nextUrl.pathname);

  // ... middleware logic ...

  console.log("After:", response.url);
}
```

**Common Cause:** Route is both auth route AND dashboard route

**Solution:** Ensure mutually exclusive route checks:

```typescript
const isAuthRoute =
  request.nextUrl.pathname === "/login" ||
  request.nextUrl.pathname === "/signup"; // No wildcards

const isDashboardRoute =
  request.nextUrl.pathname.startsWith("/dashboard") && !isAuthRoute; // Explicit exclusion
```

### CORS Errors

**Symptoms:**

- "CORS policy blocked" in console
- Supabase requests fail from browser

**Diagnosis:**

```typescript
// Check Supabase project URL
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
// Should be: https://<project>.supabase.co
```

**Common Causes:**

1. Wrong Supabase project URL
2. Missing `NEXT_PUBLIC_` prefix
3. Supabase project not deployed

**Solution:**

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
```

### Logging Recommendations

**Structured Logging with Pino:**

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label })
  }
})

// Usage in Server Actions
export async function signIn(data: LoginInput) {
  logger.info({ email: data.email }, 'Login attempt')

  const result = await supabase.auth.signInWithPassword(...)

  if (result.error) {
    logger.error({ email: data.email, error: result.error }, 'Login failed')
  } else {
    logger.info({ userId: result.data.user.id }, 'Login successful')
  }
}
```

### Debugging with Chrome DevTools

**Network Tab:**

1. Open DevTools → Network tab
2. Check Supabase requests (`https://*.supabase.co`)
3. Inspect request/response headers
4. Check `Authorization: Bearer <jwt>` header
5. Decode JWT at jwt.io to inspect claims

**Application Tab:**

1. Open DevTools → Application tab
2. Cookies → `localhost`
3. Look for `sb-*-auth-token` cookies
4. Check `HttpOnly`, `Secure`, `SameSite` flags
5. Verify expiration times

---

**End of AUTH_GUIDE.md**

````

#### Step 1 Verification Checklist
- [ ] File created at `docs/AUTH_GUIDE.md`
- [ ] File contains complete markdown content (15+ pages)
- [ ] All 14 sections are present
- [ ] Code blocks are properly formatted
- [ ] No placeholder text or TODOs

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to review, stage, and commit this file before proceeding to the next step.

---

### Step 2: Update ARCHITECTURE.md

This step updates the existing architecture documentation to reflect the actual authentication implementation.

- [ ] Open `docs/ARCHITECTURE.md` for editing
- [ ] Locate the Authentication section (around lines 337-402)
- [ ] Replace the outdated authentication content with the updated version below

**Note:** The exact line numbers may vary. Look for the section with heading `## Authentication & Authorization`.

- [ ] Find and replace the Authentication section with:

```markdown
## Authentication & Authorization

VapeTrack PH implements a sophisticated multi-tenant authentication system with database-level isolation using Supabase Auth, Row Level Security (RLS), and Next.js 16 Server Actions.

### Authentication Architecture

**Key Components:**
1. **Supabase Auth** - JWT-based authentication service
2. **Next.js 16 Proxy Middleware** - Session refresh and route protection
3. **Server Actions** - Secure mutations without API routes
4. **RLS Policies** - Database-level data isolation

**Flow Diagram:**
````

┌─────────────────────────────────────────────────────────┐
│ User Request → Proxy Middleware │
│ ↓ │
│ Session Check → Auto-Refresh (if token expired) │
│ ↓ │
│ Extract JWT → organization_id from app_metadata │
│ ↓ │
│ Database Query → RLS Filters by organization_id │
│ ↓ │
│ Return Filtered Data → Response │
└─────────────────────────────────────────────────────────┘

````

### Email/Password Authentication (Owner)

**Signup Flow (7 Steps):**

1. **Create Auth User** - Supabase Auth creates user record
2. **Generate Org Slug** - Unique slug with collision handling
3. **Create Organization** - Using service role client (bypasses RLS)
4. **Create User Profile** - In `public.users` table
5. **Create Default Branch** - "Main Branch" for organization
6. **Inject JWT Claims** - Add `organization_id` to `app_metadata`
7. **Refresh Session** - Update JWT with new claims

**Implementation:** `app/actions/auth.ts` - `signUp()`

**Security Consideration:**
⚠️ Service role client is used ONLY during signup because the user has no `organization_id` yet, and regular RLS policies would block the insert operations. This is the ONLY acceptable use of the service role client in application code.

**Login Flow:**

1. **Authenticate** - Verify email/password with Supabase Auth
2. **Verify Profile** - Check user exists in `public.users` and is active
3. **Check Status** - Ensure `is_active = true`
4. **Update Timestamp** - Set `last_login_at`
5. **Establish Session** - Create secure cookies

**Implementation:** `app/actions/auth.ts` - `signIn()`

### Session Management

**Cookie-Based Sessions:**
- `sb-<project>-auth-token` - Access token (1 hour lifespan)
- `sb-<project>-auth-token-refresh` - Refresh token (30 days lifespan)
- Cookies are `HttpOnly`, `Secure`, `SameSite=Lax`

**Auto-Refresh Mechanism:**

The Next.js 16 proxy middleware automatically refreshes sessions on every request:

```typescript
// lib/supabase/proxy.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        // Update BOTH request and response cookies
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      }
    }
  })

  // Auto-refreshes if token expired
  await supabase.auth.getUser()
}
````

**Token Lifecycle:**

- Request at 30 min → Token valid → No refresh
- Request at 65 min → Token expired → Auto-refresh → New 1-hour token
- No requests for 30 days → Refresh expired → User must re-login

### Next.js 16 Proxy Middleware Pattern

**Why Proxy vs Traditional Middleware:**

Next.js 16 deprecated blocking middleware in favor of an async proxy pattern for better performance and non-blocking execution.

**Official Documentation:** [Next.js Middleware to Proxy Pattern](https://nextjs.org/docs/messages/middleware-to-proxy)

**Architecture:**

```
proxy.ts (root)
    ↓
lib/supabase/proxy.ts (implementation)
    ↓
1. Create Supabase client with cookie handlers
2. Auto-refresh session (if needed)
3. Check authentication status
4. Apply route protection rules
5. Set security headers
```

**Protected Routes (7 total):**

- `/dashboard` - Main dashboard
- `/pos` - Point of Sale
- `/inventory` - Inventory management
- `/products` - Product catalog
- `/sales` - Sales records
- `/reports` - Analytics

**Auth Routes (redirect if authenticated):**

- `/login`
- `/signup`

**Security Headers Applied:**

- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Limit referrer leakage
- `Permissions-Policy` - Disable unused browser features
- `Content-Security-Policy` - XSS protection

### JWT Claims Injection

**Organization ID in JWT:**

Every authenticated user's JWT contains `app_metadata.organization_id`, enabling stateless multi-tenant isolation.

**Method 1: Database Trigger (Ideal but has limitations)**

```sql
CREATE OR REPLACE FUNCTION set_organization_claim()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    SELECT organization_id INTO user_org_id
    FROM public.users
    WHERE id = NEW.id;

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
    FOR EACH ROW
    EXECUTE FUNCTION set_organization_claim();
```

**⚠️ Limitation:** Trigger fires BEFORE `public.users` insert completes, so it returns NULL during signup.

**Method 2: Manual Update (Used in Signup)**

```typescript
// app/actions/auth.ts - signUp()
await serviceClient.auth.admin.updateUserById(userId, {
  app_metadata: { organization_id: organizationId },
});

// Refresh session to get updated JWT
await supabase.auth.refreshSession();
```

**RLS Helper Function:**

```sql
CREATE FUNCTION get_user_organization_id() RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

Used in all RLS policies to extract `organization_id` from JWT.

### Supabase Client Patterns

**4 Client Types:**

| Client           | File                                           | RLS?      | Use Case                          |
| ---------------- | ---------------------------------------------- | --------- | --------------------------------- |
| **Browser**      | `lib/supabase/client.ts`                       | ✅ Yes    | Client Components, Real-time      |
| **Server**       | `lib/supabase/server.ts` (createClient)        | ✅ Yes    | Server Components, Server Actions |
| **Middleware**   | `lib/supabase/proxy.ts`                        | ✅ Yes    | Session refresh, Route protection |
| **Service Role** | `lib/supabase/server.ts` (createServiceClient) | ❌ **NO** | ⚠️ Signup ONLY                    |

**⚠️ CRITICAL SECURITY WARNING:**

`createServiceClient()` uses `SUPABASE_SERVICE_ROLE_KEY` and **BYPASSES ALL RLS POLICIES**. It can read/write ANY organization's data.

**ONLY acceptable use:** Signup flow when user has no `organization_id` yet.

**NEVER use in:**

- Regular Server Actions
- Client Components
- API Routes
- Any code after user has been created

### Row Level Security (RLS) Policies

**All 12 tables have RLS enabled with organization-based isolation:**

1. organizations
2. users
3. branches
4. product_categories
5. products
6. product_variants
7. inventory
8. transactions
9. transaction_items
10. stock_movements
11. audit_logs
12. subscriptions

**Basic Policy Pattern:**

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_policy ON products
    FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY products_insert_policy ON products
    FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());
```

**Permission-Based Policies (Example: Profit Visibility)**

```sql
-- transaction_items: Hide profit from staff without permission
CREATE POLICY transaction_items_select_policy ON transaction_items
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_id)
        AND (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
            OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND can_view_profits = true)
        )
    );
```

**See Also:** [docs/AUTH_GUIDE.md](./AUTH_GUIDE.md) for comprehensive RLS testing procedures.

### Error Handling & Rollback

**Signup Rollback Strategy:**

If any step fails during signup, all previous steps are rolled back:

```typescript
try {
  // Step 1: Create auth user
  const { data: authData } = await supabase.auth.signUp(...)

  // Step 3: Create organization
  const { data: org, error: orgError } = await serviceClient.from('organizations').insert(...)
  if (orgError) {
    await serviceClient.auth.admin.deleteUser(authData.user.id) // Rollback Step 1
    throw new Error('Failed to create organization')
  }

  // Step 4: Create user profile
  const { error: userError } = await serviceClient.from('users').insert(...)
  if (userError) {
    await serviceClient.from('organizations').delete().eq('id', org.id) // Rollback Step 3
    await serviceClient.auth.admin.deleteUser(authData.user.id) // Rollback Step 1
    throw new Error('Failed to create user profile')
  }

  // ... continue with remaining steps ...
} catch (error) {
  return { success: false, error: error.message }
}
```

### Implementation Status

#### ✅ Implemented Features

- Email/password authentication for owners
- Multi-tenant RLS policies (all 12 tables)
- JWT claims injection (`organization_id`)
- Next.js 16 proxy middleware pattern
- Session auto-refresh mechanism
- Route protection (7 protected routes)
- Security headers (CSP, X-Frame-Options, etc.)
- Server Actions for auth mutations
- Comprehensive error handling with rollback

#### ❌ Planned Features (Not Yet Implemented)

- Staff PIN authentication
- Password reset flow
- Email verification
- Two-factor authentication (2FA)
- OAuth providers (Google, Facebook)
- Account lockout after failed attempts
- Suspicious login detection

**For detailed implementation guides, security best practices, and troubleshooting, see:**  
📘 [docs/AUTH_GUIDE.md](./AUTH_GUIDE.md)

````

#### Step 2 Verification Checklist
- [ ] `docs/ARCHITECTURE.md` updated with new Authentication section
- [ ] Removed references to PIN authentication (marked as planned)
- [ ] Added Next.js 16 proxy middleware documentation
- [ ] Added service role client security warning
- [ ] Added session refresh mechanism details
- [ ] No build errors after update

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to review, stage, and commit the changes before proceeding.

---

### Step 3: Update API_SPEC.md

This step adds Server Actions documentation and clarifies implementation status.

- [ ] Open `docs/API_SPEC.md` for editing
- [ ] Find the section after the Overview (around line 25)
- [ ] Add a new "Server Actions" section before Database Functions

- [ ] Insert this new section:

```markdown
## Server Actions

VapeTrack PH uses Next.js Server Actions instead of traditional REST API routes for all mutations. Server Actions provide type-safe, server-side mutations callable from both Server and Client Components.

### Authentication Actions

**File:** `app/actions/auth.ts`

#### signUp()

Create a new organization with owner account.

```typescript
export async function signUp(data: SignupInput): Promise<ActionResult<{ userId: string }>>

type SignupInput = {
  fullName: string      // Owner's full name
  shopName: string      // Organization name
  email: string         // Owner email (must be unique)
  password: string      // Min 8 characters
  confirmPassword: string
}

type ActionResult<T> =
  | { success: true; data?: T }
  | { success: false; error: string }
````

**Process:**

1. Validate input against `signupSchema` (Zod)
2. Create auth user in Supabase Auth
3. Generate unique organization slug
4. Create organization record
5. Create owner user profile
6. Create default branch
7. Inject `organization_id` into JWT claims
8. Refresh session

**Returns:**

- Success: `{ success: true, data: { userId: string } }`
- Failure: `{ success: false, error: string }`

**Errors:**

- Email already exists
- Slug generation failed (5 attempts)
- Database errors (with automatic rollback)

#### signIn()

Authenticate existing user.

```typescript
export async function signIn(data: LoginInput): Promise<ActionResult>;

type LoginInput = {
  email: string;
  password: string;
};
```

**Process:**

1. Validate input against `loginSchema` (Zod)
2. Authenticate with Supabase Auth
3. Verify user profile exists
4. Check `is_active` status
5. Update `last_login_at`
6. Establish session cookies

**Returns:**

- Success: `{ success: true }`
- Failure: `{ success: false, error: string }`

**Errors:**

- Invalid email or password
- User profile not found
- Account deactivated

#### signOut()

End current session and redirect to login.

```typescript
export async function signOut(): Promise<void>;
```

**Process:**

1. Call `supabase.auth.signOut()`
2. Revalidate all cached pages
3. Redirect to `/login`

**Note:** No return value; always redirects.

---

````

- [ ] Find the "Database Functions (RPCs)" section
- [ ] Add a warning note at the top of that section:

```markdown
## Database Functions (RPCs)

⚠️ **IMPLEMENTATION STATUS: Schema Defined - Deployment Pending**

The database functions listed below exist in `migrations/001_initial_schema.sql` but have not been deployed to the Supabase project yet. They are part of the planned architecture but are not currently callable from the application.

**Deployment Status:**
- ✅ Function definitions created in migration file
- ⚠️ Migration not yet applied to database
- ❌ Not integrated into application code

---
````

#### Step 3 Verification Checklist

- [ ] `docs/API_SPEC.md` updated with Server Actions section
- [ ] Added deployment status warning to Database Functions section
- [ ] All TypeScript types are accurate
- [ ] No build errors after update

#### Step 3 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, stage, and commit the changes.

---

### Step 4: Update SCHEMA.md

This step adds session refresh documentation and trigger limitations.

- [ ] Open `docs/SCHEMA.md` for editing
- [ ] Find the "Triggers & Functions" section (around line 180)
- [ ] Add detailed documentation for the JWT claim injection trigger

- [ ] Insert after the trigger SQL definition:

````markdown
### JWT Claims Injection Trigger

The `set_organization_claim()` trigger automatically injects the user's `organization_id` into their JWT token's `app_metadata` field. This enables stateless RLS policies.

**Trigger Definition:**

```sql
CREATE OR REPLACE FUNCTION set_organization_claim()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Lookup organization_id from public.users table
    SELECT organization_id INTO user_org_id
    FROM public.users
    WHERE id = NEW.id;

    -- Inject organization_id into JWT app_metadata
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
    FOR EACH ROW
    EXECUTE FUNCTION set_organization_claim();
```
````

**⚠️ Limitation During Signup:**

This trigger has a timing issue during the signup flow:

1. Trigger fires BEFORE INSERT on `auth.users`
2. Trigger tries to SELECT from `public.users` WHERE `id = NEW.id`
3. But `public.users` record doesn't exist yet!
4. Result: `user_org_id` is NULL

**Workaround:**

In the `signUp()` Server Action, we manually update the JWT metadata after creating the user profile:

```typescript
// Step 6 in signUp() - app/actions/auth.ts
await serviceClient.auth.admin.updateUserById(userId, {
  app_metadata: { organization_id: organizationId },
});

// Step 7: Refresh session to get updated JWT
await supabase.auth.refreshSession();
```

**Future Improvement:**

Consider using an AFTER INSERT trigger or moving JWT update to a database function called explicitly after user creation.

---

### RLS Helper Function

**get_user_organization_id()**

Extracts `organization_id` from the authenticated user's JWT token.

```sql
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Usage in RLS Policies:**

```sql
CREATE POLICY products_select_policy ON products
    FOR SELECT
    USING (organization_id = get_user_organization_id());
```

**Why SECURITY DEFINER:**

- Allows function to access `auth.jwt()` even though caller may not have direct access
- Function runs with privileges of the owner (postgres)
- Safe because it only reads, never writes

**Why STABLE:**

- Function result doesn't change within a single query
- Allows PostgreSQL to optimize by calling once and caching result
- Performance benefit for complex queries with multiple RLS checks

---

````

- [ ] Find the "RLS Policies" section
- [ ] Add a new subsection on testing RLS policies

- [ ] Insert at the end of the RLS Policies section:

```markdown
### Testing RLS Policies

**Manual Testing Procedure:**

1. **Create Two Organizations:**
   - Signup as `org-a@test.com` with shop name "Organization A"
   - Sign out
   - Signup as `org-b@test.com` with shop name "Organization B"

2. **Create Test Data (as Org A):**
   - Login as `org-a@test.com`
   - Create a product: "Product A"
   - Note the product ID

3. **Verify Isolation (as Org B):**
   - Login as `org-b@test.com`
   - Query products → Should be empty (no Org B products yet)
   - Try to access Org A's product by ID → Should fail (404)

4. **Verify in Database (as Admin):**
   - Supabase Dashboard → Table Editor → products
   - Should see products from BOTH organizations
   - Note different `organization_id` values

**SQL Testing Queries:**

```sql
-- Check your organization_id
SELECT get_user_organization_id();
-- Should return a UUID

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All tables should have rowsecurity = true

-- Test isolation (should only see own org)
SELECT organization_id, COUNT(*)
FROM products
GROUP BY organization_id;
-- Should show only ONE organization_id (yours)
````

**Common Testing Mistakes:**

❌ **Using Supabase SQL Editor** - Uses service role, bypasses RLS  
✅ **Test via application** - With real user sessions

❌ **Forgetting to enable RLS** on new tables  
✅ **Always check:** `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`

❌ **Using service role client** in tests  
✅ **Use regular client** from `lib/supabase/server.ts`

**See Also:** [docs/AUTH_GUIDE.md - Testing Guide](./AUTH_GUIDE.md#testing-guide) for comprehensive testing procedures.

---

````

#### Step 4 Verification Checklist
- [ ] `docs/SCHEMA.md` updated with trigger documentation
- [ ] Added JWT claims injection explanation
- [ ] Added trigger limitation caveat
- [ ] Added RLS testing procedures
- [ ] No build errors after update

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to review, stage, and commit the changes.

---

### Step 5: Update PRD.md

This step clarifies feature implementation status in the Product Requirements Document.

- [ ] Open `docs/PRD.md` for editing
- [ ] Find the "Authentication & User Management" section (around line 267)
- [ ] Update the feature list with implementation status markers

- [ ] Replace the authentication feature list with:

```markdown
### Authentication & User Management

**Owner Authentication:**
- ✅ **Email/Password Login** - Implemented
  - Email validation
  - Password requirements (min 8 characters)
  - Secure password hashing (bcrypt via Supabase Auth)
  - Session management with auto-refresh
  - "Remember me" via 30-day refresh tokens

**Staff Authentication:**
- 📋 **PIN Login** - Planned, Not Implemented
  - 6-digit PIN for quick staff access
  - Branch-specific login
  - Rate limiting for brute force protection
  - PIN reset by owner

**Account Security:**
- ✅ **Active Status Check** - Implemented
  - Owners can deactivate staff accounts
  - Deactivated users cannot login
  - Soft delete pattern (data preserved)
- 📋 **Password Reset Flow** - Planned, Not Implemented
  - Email-based password reset
  - Secure reset tokens
  - Password strength requirements
- 📋 **Email Verification** - Planned, Not Implemented
  - Verification email on signup
  - Resend verification flow
  - Unverified user restrictions
- 📋 **Two-Factor Authentication** - Post-MVP
  - TOTP-based 2FA
  - Backup codes
  - Optional for owners

**Session Management:**
- ✅ **Auto-Refresh** - Implemented
  - 1-hour access tokens
  - 30-day refresh tokens
  - Middleware auto-refreshes on every request
  - No forced logout during active use
- ✅ **Secure Cookies** - Implemented
  - HttpOnly, Secure, SameSite=Lax
  - CSRF protection via SameSite
  - XSS protection via HttpOnly

**Multi-Tenancy:**
- ✅ **Organization Isolation** - Implemented
  - Database-level RLS policies
  - JWT-based organization identification
  - Automatic filtering on all queries
  - No manual filtering needed in code

**Implementation Files:**
- `app/actions/auth.ts` - Server Actions for signup/login/logout
- `lib/supabase/proxy.ts` - Session refresh middleware
- `app/(auth)/login/page.tsx` - Login form
- `app/(auth)/signup/page.tsx` - Signup form
- `migrations/001_initial_schema.sql` - RLS policies and triggers

**See Also:** [docs/AUTH_GUIDE.md](./AUTH_GUIDE.md) for complete authentication documentation.

---
````

- [ ] Find the "Subscription & Billing" section
- [ ] Add implementation status note

- [ ] Insert at the top of the Subscription section:

```markdown
### Subscription & Billing

⚠️ **STATUS: Schema Ready - Integration Pending**

The `subscriptions` table and RLS policies exist in the database, but PayMongo integration has not been implemented yet.

**Database Schema:** ✅ Ready
**PayMongo Integration:** ❌ Not Implemented
**Subscription Plans:** ✅ Defined
**Webhook Handler:** ❌ Not Implemented
**Billing Dashboard:** ❌ Not Implemented

---
```

#### Step 5 Verification Checklist

- [ ] `docs/PRD.md` updated with feature status markers
- [ ] Added implementation status to authentication features
- [ ] Added subscription integration status
- [ ] Used consistent status icons (✅ ❌ 📋)
- [ ] No build errors after update

#### Step 5 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, stage, and commit the changes.

---

### Step 6: Update ROADMAP.md

This step marks completed authentication tasks and moves planned features to future sprints.

- [ ] Open `docs/ROADMAP.md` for editing
- [ ] Find the "Days 4-5: Authentication Implementation" section (around line 185)
- [ ] Update checkboxes to mark completed tasks

- [ ] Replace the authentication tasks section with:

```markdown
### Day 4-5: Authentication Implementation ✅ COMPLETED

**Email/Password Authentication:**

- [x] Create `lib/supabase/client.ts` - Browser client
- [x] Create `lib/supabase/server.ts` - Server client + service client
- [x] Create `lib/supabase/proxy.ts` - Next.js 16 middleware proxy
- [x] Create `proxy.ts` - Root proxy delegator
- [x] Create `app/actions/auth.ts` - Server Actions for signup/login/logout
- [x] Create `lib/validations/auth.ts` - Zod schemas
- [x] Create `app/(auth)/layout.tsx` - Centered card layout
- [x] Create `app/(auth)/login/page.tsx` - Login form (Client Component)
- [x] Create `app/(auth)/signup/page.tsx` - Signup form (Client Component)
- [x] Implement route protection (7 protected routes)
- [x] Implement session auto-refresh mechanism
- [x] Implement security headers (CSP, X-Frame-Options, etc.)
- [x] Implement JWT claims injection (`organization_id`)
- [x] Implement RLS policies on all 12 tables
- [x] Test multi-tenant isolation with separate signups
- [x] Write e2e tests for route protection (`e2e/auth-routes.spec.ts`)

**Documentation:**

- [x] Create comprehensive AUTH_GUIDE.md
- [x] Update ARCHITECTURE.md with actual implementation
- [x] Update API_SPEC.md with Server Actions
- [x] Update SCHEMA.md with trigger details
- [x] Update PRD.md with implementation status
- [x] Update ROADMAP.md (this file)

**Acceptance Criteria:** ✅ All Met

- ✅ Owner can signup with email/password
- ✅ Unique organization created on signup
- ✅ User profile + default branch created
- ✅ JWT contains `organization_id` claim
- ✅ Login redirects to dashboard
- ✅ Dashboard protected (redirects to login if unauthenticated)
- ✅ Dashboard shows user + organization info
- ✅ Session auto-refreshes (no forced logout)
- ✅ Multi-tenant isolation verified (2 separate signups)
- ✅ All e2e tests passing

**Total Time:** ~16 hours (2 days)

---

### Future Sprints (Post-MVP)

**Sprint 2: Advanced Authentication**

- [ ] Staff PIN authentication
  - PIN login UI
  - PIN generation and management
  - Branch selection on login
  - Rate limiting for PIN attempts
- [ ] Password reset flow
  - "Forgot password" link
  - Email-based reset
  - Reset token validation
  - New password form
- [ ] Email verification
  - Verification email on signup
  - Email confirmation link
  - Resend verification
  - Unverified user restrictions

**Sprint 3: Subscription & Billing**

- [ ] PayMongo integration
  - GCash payment method
  - Card payments
  - Webhook handler
  - Payment confirmation flow
- [ ] Subscription management
  - Plan selection UI
  - Subscription status enforcement
  - Trial period tracking
  - Billing dashboard
  - Invoice generation

**Sprint 4: Audit Logging & Analytics**

- [ ] Integrate audit logging
  - Login/logout events
  - User actions (create, update, delete)
  - IP address capture
  - User agent tracking
- [ ] Audit log viewer
  - Admin-only access
  - Filter by user, action, date
  - Export to CSV
  - Retention policy

**Sprint 5: Advanced Security**

- [ ] Two-factor authentication (2FA)
  - TOTP setup and verification
  - Backup codes
  - SMS fallback (optional)
- [ ] OAuth providers
  - Google Sign-In
  - Facebook Login
  - Apple Sign-In
- [ ] Account security features
  - Account lockout (5 failed attempts)
  - Suspicious login detection
  - Login notifications
  - Session management (view/revoke active sessions)

---
```

#### Step 6 Verification Checklist

- [ ] `docs/ROADMAP.md` updated with completed tasks marked
- [ ] All authentication tasks have `[x]` checkboxes
- [ ] Added "Future Sprints" section for planned features
- [ ] Acceptance criteria marked as met
- [ ] No build errors after update

#### Step 6 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, stage, and commit the changes.

---

### Step 7: Update RESOURCES.md

This step adds authentication-specific resources and code snippets.

- [ ] Open `docs/RESOURCES.md` for editing
- [ ] Find the "Supabase" section (around line 32)
- [ ] Add new authentication resources

- [ ] Add after the Supabase section:

```markdown
### Authentication & Security

**Next.js 16:**

- [Middleware to Proxy Pattern](https://nextjs.org/docs/messages/middleware-to-proxy) - Official migration guide

**Supabase Auth:**

- [Row Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [JWT Claims Injection](https://supabase.com/docs/guides/auth/managing-user-data#using-triggers)
- [Server-Side Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

**Testing:**

- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)

---
```

- [ ] Find the "Code Snippets" section (around line 215)
- [ ] Add authentication code examples

- [ ] Add these code snippets:

````markdown
### Authentication Code Snippets

**Signup Flow (Server Action):**

```typescript
// app/actions/auth.ts
"use server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export async function signUp(data: SignupInput) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // 1. Create auth user
  const { data: authData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  // 2. Create organization (service role - bypasses RLS)
  const { data: org } = await serviceClient
    .from("organizations")
    .insert({ name: data.shopName, slug: slugify(data.shopName) })
    .select()
    .single();

  // 3. Create user profile
  await serviceClient.from("users").insert({
    id: authData.user.id,
    organization_id: org.id,
    role: "owner",
  });

  // 4. Inject JWT claim
  await serviceClient.auth.admin.updateUserById(authData.user.id, {
    app_metadata: { organization_id: org.id },
  });

  // 5. Refresh session
  await supabase.auth.refreshSession();

  return { success: true, data: { userId: authData.user.id } };
}
```
````

**Session Refresh Pattern (Middleware):**

```typescript
// lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update both request and response cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Auto-refreshes session if token expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
```

**RLS Policy Pattern:**

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Basic isolation policy
CREATE POLICY products_select_policy ON products
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Permission-based policy
CREATE POLICY transaction_items_select_policy ON transaction_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND (role = 'owner' OR can_view_profits = true)
        )
    );
```

**Testing RLS Isolation:**

```typescript
// Create two test organizations
const org1 = await signUp({
  email: 'org1@test.com',
  shopName: 'Organization 1',
  password: 'test123',
  ...
})

const org2 = await signUp({
  email: 'org2@test.com',
  shopName: 'Organization 2',
  password: 'test123',
  ...
})

// As Org 1, create product
const supabase1 = createClient() // Authenticated as org1@test.com
await supabase1.from('products').insert({ name: 'Product 1' })

// As Org 2, try to query products
const supabase2 = createClient() // Authenticated as org2@test.com
const { data } = await supabase2.from('products').select('*')

console.log(data) // Should be empty (no Org 2 products yet)
```

---

```

#### Step 7 Verification Checklist
- [ ] `docs/RESOURCES.md` updated with authentication resources
- [ ] Added official documentation links
- [ ] Added code snippet examples
- [ ] All code examples are copy-paste ready
- [ ] No build errors after update

#### Step 7 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to review, stage, and commit all changes.

---

## Final Verification

After completing all steps, verify the following:

- [ ] All 7 files created/updated:
  - ✅ `docs/AUTH_GUIDE.md` (new file)
  - ✅ `docs/ARCHITECTURE.md` (updated)
  - ✅ `docs/API_SPEC.md` (updated)
  - ✅ `docs/SCHEMA.md` (updated)
  - ✅ `docs/PRD.md` (updated)
  - ✅ `docs/ROADMAP.md` (updated)
  - ✅ `docs/RESOURCES.md` (updated)

- [ ] All documentation is consistent:
  - No contradictions between files
  - Implementation status matches across all docs
  - Links between docs work correctly

- [ ] All code references are accurate:
  - File paths match actual project structure
  - Code snippets match actual implementation
  - Line numbers are approximate (noted where relevant)

- [ ] No build errors:
  - Run `npm run build` to verify
  - No TypeScript errors
  - No broken links in markdown

- [ ] Git status clean:
  - All changes committed
  - Branch: `docs/update-auth-documentation`
  - Ready to push and create PR

---

## Success Criteria

✅ Documentation Update is Complete When:

1. All 7 documentation files have been created/updated
2. No contradictions or outdated information remain
3. Implementation status is clearly marked (✅ ❌ 📋 ⚠️)
4. Code examples are complete and copy-paste ready
5. All changes committed to `docs/update-auth-documentation` branch
6. No build errors or TypeScript issues
7. Ready for PR/merge to main branch

---

**Notes:**
- This is a documentation-only update; no code changes to application files
- All updates reflect the current state of the codebase as of implementation
- AUTH_GUIDE.md is now the primary developer reference for authentication
- Other docs link to AUTH_GUIDE.md for detailed explanations
```
