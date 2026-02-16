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
