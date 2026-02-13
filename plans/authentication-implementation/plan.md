# Authentication Implementation

**Branch:** `feature/authentication-implementation`
**Description:** Implement complete authentication flow with Supabase Auth, including signup (creates org + user + branch), login, logout, and route protection via middleware.

## Goal

Implement a fully functional multi-tenant authentication system where shop owners can sign up (automatically creating their organization, user record, and default branch), log in with email/password, and access protected dashboard routes. The implementation leverages Supabase Auth with RLS-based tenant isolation, ensuring each organization's data remains completely separate through database-level policies.

## Prerequisites

### Environment Variables

`.env.local` must contain:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Required for consistency
```

**⚠️ ISSUE FOUND:** Current code uses inconsistent env var names:

- `lib/supabase/client.ts`: Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ❌
- `lib/supabase/server.ts`: Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- **Resolution:** Will standardize to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Step 1

### Database Schema Status

**VERIFY BEFORE STARTING:**

- [ ] Migration `001_initial_schema.sql` deployed to Supabase
- [ ] Tables exist: `organizations`, `users`, `branches`
- [ ] RLS enabled on all tables
- [ ] JWT claim function `set_organization_claim()` exists
- [ ] Helper function `get_user_organization_id()` exists

**Check via:** Supabase Dashboard → Database → Tables

---

## Implementation Steps

### Step 1: Dependencies & Environment Setup

**Commit Message:** `chore: install auth dependencies and fix environment variables`

**Files:**

- `lib/supabase/client.ts` (fix env var name)
- `lib/supabase/proxy.ts` (fix env var name + route exclusions)
- `package.json` (add dependencies)
- `.env.local` (verify/create - not committed)

**What:**

1. Install missing packages:
   ```bash
   npm install react-hook-form zod @hookform/resolvers sonner
   npx shadcn@latest add form alert toast
   ```
2. Fix environment variable naming:
   - Change `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` in:
     - `lib/supabase/client.ts`
     - `lib/supabase/proxy.ts`
3. Update `proxy.ts` route exclusions:
   - Change `/auth` → `/login` and `/signup` (route group renders without parentheses)
4. Verify `.env.local` has correct variable names

**Testing:**

- [ ] `npm run dev` starts without errors
- [ ] No console warnings about missing env vars
- [ ] shadcn/ui form components in `components/ui/`

**Dependencies Added:**

- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Zod resolver for RHF
- `sonner` - Toast notifications

---

### Step 2: Server Actions Implementation

**Commit Message:** `feat: implement auth server actions (signup, login, logout)`

**Files:**

- `app/actions/auth.ts` (create new)
- `lib/utils/slugify.ts` (create new - for org slug generation)

**What:**
Implement three core Server Actions with comprehensive error handling:

#### **1. `signUp()` Action**

Creates complete organization setup atomically:

```typescript
export async function signUp(data: {
  email: string;
  password: string;
  shopName: string;
  fullName: string;
}) {
  // 1. Create auth user (Supabase Auth)
  // 2. Create organization record with slug
  // 3. Create user in public.users table
  // 4. Create default branch ("Main Branch")
  // 5. Trigger JWT claim injection (via database trigger)
  // 6. Return success or detailed error
}
```

**Key Implementation Details:**

- Use `supabase.auth.signUp()` for Supabase Auth
- Generate unique org slug from shop name (e.g., "Vape Shop" → "vape-shop")
- Handle slug collisions (append random suffix if exists)
- Use Supabase transactions via RPC if needed (or sequential inserts with rollback)
- Set `is_default: true` for the first branch
- **CRITICAL:** User's `organization_id` must be set before JWT claim trigger fires

#### **2. `signIn()` Action**

```typescript
export async function signIn(data: { email: string; password: string }) {
  // 1. Validate credentials via supabase.auth.signInWithPassword()
  // 2. Verify user exists in public.users table
  // 3. Check is_active flag
  // 4. Return success or error
}
```

#### **3. `signOut()` Action**

```typescript
export async function signOut() {
  // 1. Call supabase.auth.signOut()
  // 2. Clear cookies
  // 3. Redirect to /login
}
```

**Error Handling:**

- Return typed objects: `{ success: boolean; error?: string; data?: any }`
- User-friendly messages:
  - ✅ "Email already in use"
  - ✅ "Invalid email or password"
  - ✅ "Shop name already taken" (if slug collision fails)
  - ❌ NO raw postgres errors exposed

**Testing:**

- [ ] Can call `signUp()` from browser console (temporarily export as test)
- [ ] Creates records in all 3 tables (organizations, users, branches)
- [ ] Duplicate email returns error
- [ ] Database rollback on partial failure (test by breaking SQL)
- [ ] JWT contains `app_metadata.organization_id` (check in Supabase Dashboard)

---

### Step 3: Authentication Pages UI

**Commit Message:** `feat: implement login and signup forms with validation`

**Files:**

- `app/(auth)/layout.tsx` (create new)
- `app/(auth)/login/page.tsx` (implement form)
- `app/(auth)/signup/page.tsx` (implement form)
- `components/auth/AuthForm.tsx` (optional shared component)

**What:**

#### **Auth Layout** (`app/(auth)/layout.tsx`)

```typescript
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        {children}
      </Card>
    </div>
  )
}
```

- Dark theme background
- Centered card (max-width: 28rem)
- Mobile-responsive padding

#### **Login Form** (`app/(auth)/login/page.tsx`)

**Fields:**

- Email (type="email", required, validated)
- Password (type="password", required, min 6 chars)
- Submit button (with loading state)
- Link to signup page

**Validation Schema (Zod):**

```typescript
const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
```

**Behavior:**

- On submit: Call `signIn()` Server Action
- Show loading spinner on button during submission
- Display error toast if login fails
- Redirect to `/dashboard` on success (handled by Server Action)

#### **Signup Form** (`app/(auth)/signup/page.tsx`)

**Fields:**

- Full Name (text, required)
- Shop Name (text, required, will generate slug)
- Email (email, required, validated)
- Password (password, required, min 8 chars)
- Confirm Password (password, must match)
- Submit button (with loading state)
- Link to login page

**Validation Schema (Zod):**

```typescript
const signupSchema = z
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
```

**Behavior:**

- On submit: Call `signUp()` Server Action
- Show loading spinner during org creation
- Display success toast: "Account created! Redirecting..."
- Display error toast if signup fails
- Redirect to `/dashboard` on success

**Design Specs (from UI_UX.md):**

- Touch targets ≥44×44px
- `focus-visible:ring-2` on all inputs
- Dark mode colors (use shadcn/ui defaults)
- Stack inputs vertically with 16px gap

**Testing:**

- [ ] Login form validates email format
- [ ] Login form prevents submission if fields empty
- [ ] Signup form checks password match
- [ ] Both forms show loading state during submission
- [ ] Error messages appear as toasts (using Sonner)
- [ ] Works on mobile view (375×667px)
- [ ] Tab navigation works correctly
- [ ] Enter key submits form

---

### Step 4: Route Protection Middleware

**Commit Message:** `feat: add middleware for route protection and session management`

**Files:**

- `middleware.ts` (create new in project root)
- `lib/supabase/proxy.ts` (reference, no changes)

**What:**
Create Next.js middleware to:

1. Refresh Supabase session on every request
2. Redirect unauthenticated users attempting to access dashboard
3. Redirect authenticated users away from auth pages
4. Set security headers (CSP, HSTS, etc.)

**Implementation:**

```typescript
import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Update Supabase session (from proxy.ts)
  const response = await updateSession(request);

  // 2. Get user from session
  const { data } = await supabase.auth.getUser();
  const isAuthenticated = !!data.user;

  // 3. Define route types
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/pos") ||
    request.nextUrl.pathname.startsWith("/inventory");

  // 4. Redirect logic
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Set security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CSP (from ARCHITECTURE.md)
  response.headers.set(
    "Content-Security-Policy",
    `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.supabase.co;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  `
      .replace(/\s+/g, " ")
      .trim(),
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Testing:**

- [ ] Visiting `/dashboard` when logged out → redirects to `/login`
- [ ] Visiting `/login` when logged in → redirects to `/dashboard`
- [ ] Session persists across page reloads
- [ ] Session refreshes automatically (check cookies)
- [ ] Security headers present (check Network tab → Response Headers)
- [ ] Works with browser back/forward buttons

---

### Step 5: Integration & User Flow Testing

**Commit Message:** `test: verify complete auth flow and multi-tenant isolation`

**Files:**

- `app/(dashboard)/dashboard/page.tsx` (add user display for testing)
- Create test scenarios documentation (optional)

**What:**

1. Add temporary user info display on dashboard:

   ```typescript
   // app/(dashboard)/dashboard/page.tsx
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   const { data: profile } = await supabase
     .from('users')
     .select('*, organizations(*)')
     .single()

   return (
     <div>
       <h1>Welcome, {profile.full_name}!</h1>
       <p>Organization: {profile.organizations.name}</p>
       <p>Email: {user.email}</p>
     </div>
   )
   ```

2. **End-to-End Testing:**
   - Scenario 1: New user signup flow
   - Scenario 2: Existing user login
   - Scenario 3: Multi-tenant isolation
   - Scenario 4: Session persistence

3. **Multi-Tenant Isolation Test:**
   - Sign up as User A (shop: "Vape Shop A")
   - Note organization ID in dashboard
   - Log out
   - Sign up as User B (shop: "Vape Shop B")
   - Verify different organization ID
   - Check Supabase Dashboard → Database:
     - 2 organizations exist
     - 2 users with different org IDs
     - Each user sees only their own org (RLS test)

**Testing Checklist:**

- [ ] **Signup Flow:**
  - [ ] Can sign up with valid data
  - [ ] Creates organization with slug (e.g., "vape-shop-a")
  - [ ] Creates user record linked to org
  - [ ] Creates default branch ("Main Branch")
  - [ ] Automatically logs in and redirects to dashboard
  - [ ] Dashboard shows correct user name and org name
- [ ] **Login Flow:**
  - [ ] Can log in with valid credentials
  - [ ] Redirects to dashboard on success
  - [ ] Shows error toast on invalid credentials
  - [ ] Email validation works
- [ ] **Logout Flow:**
  - [ ] Clicking logout clears session
  - [ ] Redirects to /login
  - [ ] Cannot access /dashboard after logout
- [ ] **Session Persistence:**
  - [ ] Refreshing page maintains session
  - [ ] Session survives browser restart (if "remember me" checked - future)
  - [ ] Session expires after inactivity (default: 1 hour access token)
- [ ] **Multi-Tenant Isolation:**
  - [ ] User A cannot see User B's organization
  - [ ] RLS policies enforce data separation
  - [ ] JWT contains correct organization_id
- [ ] **Mobile Responsiveness:**
  - [ ] Login form works on 375×667px screen
  - [ ] Signup form works on mobile
  - [ ] Touch targets ≥44×44px
  - [ ] No horizontal scroll
- [ ] **Error Handling:**
  - [ ] Duplicate email shows error
  - [ ] Weak password rejected (client-side validation)
  - [ ] Network errors show toast
  - [ ] Database errors don't expose internals
- [ ] **Accessibility:**
  - [ ] Can navigate forms with keyboard (Tab, Enter)
  - [ ] Error messages announced (aria-live)
  - [ ] Labels associated with inputs
  - [ ] Focus visible on all interactive elements

---

## Edge Cases & Error Scenarios

### Signup Edge Cases

1. **Duplicate Email:**
   - Expected: "Email already in use" error toast
   - No organization created
2. **Duplicate Shop Name:**
   - Expected: Slug gets random suffix (e.g., "vape-shop-a-x7k2")
   - Fallback after 5 attempts: Fail with error
3. **Partial Database Failure:**
   - Scenario: Org created but branch creation fails
   - Expected: All records rolled back (transaction)
   - Test: Temporarily break branch insert SQL
4. **JWT Claim Injection Failure:**
   - Scenario: Trigger doesn't set organization_id
   - Expected: User can't access any data (RLS blocks)
   - Fix: Re-run database migration for trigger

### Login Edge Cases

1. **Unverified Email:** (if Supabase email verification enabled)
   - Expected: "Please verify your email" error
2. **Inactive User:**
   - Scenario: `is_active = false` in users table
   - Expected: "Account deactivated" error
3. **User Exists in Auth but Not in public.users:**
   - Scenario: Signup partially failed in past
   - Expected: Error + instructions to contact support

### Session Edge Cases

1. **Token Expired:**
   - Expected: Middleware refreshes automatically
   - If refresh fails: Redirect to login
2. **Concurrent Sessions:**
   - Multiple tabs open
   - Logout in one tab should invalidate all

---

## Post-Implementation Checklist

### Code Quality

- [ ] ESLint passes: `npm run lint`
- [ ] TypeScript compiles: `npm run build`
- [ ] No console errors in browser
- [ ] No console warnings about missing dependencies

### Documentation

- [ ] Update [README.md](../../README.md) with setup instructions
- [ ] Add authentication section to [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [ ] Update [ROADMAP.md](../../docs/ROADMAP.md) to mark Days 4-5 complete

### Security Audit

- [ ] No secrets in code (all in .env.local)
- [ ] Passwords never logged
- [ ] Session cookies are HttpOnly, Secure, SameSite=Strict
- [ ] RLS policies tested and verified
- [ ] CSP headers set correctly
- [ ] Rate limiting considered (future: add via Upstash)

### Performance

- [ ] Login/signup complete in <2 seconds
- [ ] Dashboard loads in <1 second after auth
- [ ] No unnecessary re-renders (check React DevTools)
- [ ] Optimistic UI where appropriate

### Git Hygiene

- [ ] All commits follow conventional commits format
- [ ] Each commit is testable independently
- [ ] Sensitive files in .gitignore (.env.local)
- [ ] Meaningful commit messages with context

---

## Known Limitations & Future Enhancements

### Current MVP Limitations

1. **No Email Verification:** Users can sign up without verifying email (Phase 2)
2. **No Password Reset:** Forgot password not implemented (Phase 2)
3. **No Rate Limiting:** Brute force protection missing (add via Upstash)
4. **No Staff PIN Auth:** Only owner email/password (Phase 2)
5. **No "Remember Me":** Session expires after default timeout

### Planned Enhancements (Post-MVP)

- [ ] Email verification flow
- [ ] Password reset with secure token
- [ ] Rate limiting (5 failed attempts = 15 min lockout)
- [ ] Staff PIN authentication (4-6 digits)
- [ ] Two-factor authentication (TOTP)
- [ ] Social login (Google, Facebook)
- [ ] Account recovery options

---

## Rollback Plan

If authentication implementation causes critical issues:

### Immediate Rollback

```bash
git revert <commit-hash> --no-commit
git commit -m "revert: rollback auth implementation due to [issue]"
git push origin main
```

### Partial Rollback (Keep Some Commits)

Use `git revert` selectively on problematic commits:

```bash
git log --oneline  # Find problematic commit
git revert abc1234 --no-commit
# Fix issues manually
git commit -m "fix: address auth issue [description]"
```

### Database Rollback (if needed)

If database migrations cause issues:

1. Go to Supabase Dashboard → Database → Migrations
2. Create rollback migration to undo changes
3. Apply via SQL Editor

---

## Success Criteria

✅ Authentication is complete when:

- [ ] User can sign up and automatically log in
- [ ] Signup creates organization + user + default branch
- [ ] User can log in with email/password
- [ ] User can log out and session clears
- [ ] Dashboard shows user's name and organization
- [ ] Protected routes redirect to /login when not authenticated
- [ ] Login/signup pages redirect to /dashboard when authenticated
- [ ] Multi-tenant isolation verified (2 separate orgs tested)
- [ ] Session persists across page reloads
- [ ] Works smoothly on mobile (375×667px)
- [ ] No console errors or warnings
- [ ] Passes all testing scenarios above
- [ ] Code committed with clear messages
- [ ] Documentation updated

**Estimated Time:** 12-16 hours (Days 4-5 per ROADMAP.md)
