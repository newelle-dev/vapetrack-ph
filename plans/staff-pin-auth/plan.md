# Staff PIN Authentication Plan

**Branch:** `feat/staff-pin-auth`
**Description:** Implement staff PIN authentication and management system.

## Goal
Enable shop owners to manage staff members and allow staff to log in using a secure 6-digit PIN. This involves a custom authentication flow using JWTs signed with the project secret, bypassing standard Supabase email/password auth for staff users.

## Implementation Steps

### Step 1: Core Dependencies & Utilities
**Files:**
- `package.json`
- `lib/auth/password.ts` (New)
- `lib/auth/jwt.ts` (New)

**What:**
- Install `jose` and `bcryptjs`.
- Create utility functions for hashing PINs (`hashPin`, `verifyPin`).
- Create utility for generating custom Supabase-compatible JWTs.

**Testing:**
- Unit test PIN hashing/verification.
- Verify JWT generation produces a token with correct `app_metadata` and signature.

### Step 2: Staff Management Logic (Server Actions)
**Files:**
- `app/actions/staff.ts` (New)
- `types/database.ts` (Reference)

**What:**
- Implement `getStaffMembers()`: Fetch users with role 'staff'.
- Implement `createStaffMember()`: precise validation, hash PIN, insert into `users`.
- Implement `updateStaffMember()`: Handle PIN rotation (re-hashing) and detail updates.
- Implement `deleteStaffMember()`: Soft delete or remove access.

**Testing:**
- Verify owner can create a staff member with a hashed PIN.
- Verify staff lists are filtered by organization (via RLS).

### Step 3: Staff Management UI
**Files:**
- `app/(dashboard)/settings/staff/page.tsx` (New)
- `components/staff/staff-list.tsx` (New)
- `components/staff/staff-form.tsx` (New)
- `app/(dashboard)/settings/layout.tsx` (Update navigation if needed)

**What:**
- Create a settings page to list staff.
- Add "Add Staff" modal/drawer with form (Name, PIN, Branch - optional if branch association logic exists, otherwise just global org staff).
- Implement Edit/Delete actions.

**Testing:**
- Manually test adding, editing, and removing staff members.
- Verify validation errors (e.g., short PIN).

### Step 4: Staff Login API
**Files:**
- `app/api/auth/pin/route.ts` (New)

**What:**
- Create an API route that accepts `{ slug, pin }`.
- Find Organization by Slug -> Find User in Org with matching PIN hash.
- Issue a JWT signed with `SUPABASE_JWT_SECRET` containing `role: 'staff'` and `app_metadata: { organization_id }`.
- Return the token and user details to the client.

**Testing:**
- Test authentication with valid/invalid PINs and slugs.
- Verify the returned JWT works for RLS requests.

### Step 5: Staff Login Page
**Files:**
- `app/(auth)/login/staff/page.tsx` (New)
- `app/(auth)/login/page.tsx` (Update with link)
- `check-auth-layout` (middleware/layouts)

**What:**
- Create a dedicated login page for staff.
- Inputs: Organization Slug, PIN.
- On success: Store the returned JWT in cookie.
- Redirect to Dashboard.

**Testing:**
- End-to-end test of staff login using the new page.
- Verify access specifically to allowed areas (POS, Inventory) and denial to restricted (Profit View).

### Step 6: Middleware & Security Verification
**Files:**
- `middleware.ts` (or `proxy.ts`)

**What:**
- Ensure middleware respects the custom JWT cookie.
- Verify session persistence across requests.

**Testing:**
- Verify session works after login.
