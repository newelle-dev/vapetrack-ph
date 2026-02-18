# Authentication Architecture

**Last Updated:** February 4, 2026

## Supabase Auth (Email/Password + PIN)

### Authentication Flows

**1. Shop Owner Login (Email/Password)**

```typescript
// Server Action (app/actions/auth.ts)
'use server'

export async function signIn(email: string, password: string) {
  const supabase = createServerClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) return { error: error.message }
  
  // Set organization_id in user metadata
  const { data: user } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', data.user.id)
    .single()
  
  // Store in JWT claims via Supabase Auth Hooks
  return { user: data.user, organizationId: user.organization_id }
}
```

**2. Staff PIN Login (Custom Implementation)**

```typescript
// API Route: /api/auth/pin
export async function POST(request: Request) {
  const { pin, branchId } = await request.json()
  
  const { data: staff, error } = await supabase
    .from('users')
    .select('id, full_name, organization_id, role')
    .eq('pin', pin)
    .eq('role', 'staff')
    .eq('is_active', true)
    .single()
  
  if (error) return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  
  // Create custom session token (JWT)
  const token = await signJWT({
    userId: staff.id,
    organizationId: staff.organization_id,
    role: 'staff',
    branchId,
  })
  
  return NextResponse.json({ token, user: staff })
}
```

**Session Management:**
- **Owner:** Supabase Auth session (1 hour access token, 30-day refresh)
- **Staff:** Custom JWT (8-hour expiry, no refresh)
- **Storage:** HTTP-only cookies (mitigate XSS)

## Middleware & Proxy

The application utilizes a **Next.js Proxy** pattern (implemented in `proxy.ts`) to handle authentication checks, route protection, and security headers before requests reach the page components.

### Implementation Details (`lib/supabase/proxy.ts`)

1.  **Supabase Client Creation**: Initializes a server-side Supabase client with cookie handling (`getAll`/`setAll`) to manage the session.
2.  **Session Refresh**: Automatically refreshes the Auth token if it has expired.
3.  **Route Protection**:
    *   **Public Routes**: `/login`, `/signup`, `_next/*`, public assets.
    *   **Protected Routes**: `/dashboard`, `/pos`, `/inventory`, `/products`, `/sales`, `/reports`.
    *   **Logic**:
        *   Unauthenticated users on protected routes ➔ Redirect to `/login`.
        *   Authenticated users on auth routes ➔ Redirect to `/dashboard`.
4.  **Security Headers**:
    *   **CSP (Content Security Policy)**: strict-dynamic, denies frame ancestors, restricts sources to `self` and Supabase domains.
    *   **X-Frame-Options**: DENY
    *   **X-Content-Type-Options**: nosniff
    *   **Referrer-Policy**: strict-origin-when-cross-origin
    *   **Permissions-Policy**: Camera, Microphone, Geolocation disabled by default.

