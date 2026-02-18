# Staff PIN Authentication

## Goal
Implement staff PIN authentication allowing shop owners to manage staff members and staff to log in using a secure 6-digit PIN via custom JWTs signed with the Supabase JWT secret.

## Prerequisites
Make sure that you are currently on the `feat/staff-pin-auth` branch before beginning implementation.
If not, move to the correct branch. If the branch does not exist, create it from main.

---

### Step-by-Step Instructions

#### Step 1: Core Dependencies & Utilities [COMPLETED]

- [x] Install `jose` and `bcryptjs` with its type definitions:

```bash
npm install jose bcryptjs && npm install -D @types/bcryptjs
```

- [x] Add `SUPABASE_JWT_SECRET` to `.env.example`:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-default-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only
SUPABASE_JWT_SECRET=your-jwt-secret-here  # For signing custom staff JWTs
```

- [x] Add `SUPABASE_JWT_SECRET` to your local `.env` file. You can find this value in the Supabase Dashboard under **Settings → API → JWT Secret**.

- [x] Create `lib/auth/password.ts`:

```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a PIN using bcrypt.
 * @param pin - The plaintext 4-6 digit PIN
 * @returns The bcrypt hash of the PIN
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a plaintext PIN against a bcrypt hash.
 * @param pin - The plaintext PIN to verify
 * @param hash - The stored bcrypt hash
 * @returns True if the PIN matches the hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
```

- [x] Create `lib/auth/jwt.ts`:

```typescript
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_JWT_SECRET!
);

// Staff sessions last 8 hours, no refresh
const STAFF_SESSION_DURATION = "8h";

interface StaffJwtPayload {
  sub: string; // user ID
  role: string; // "authenticated" — required by Supabase RLS
  aud: string; // "authenticated"
  organization_id: string;
  user_role: string; // "staff" — application-level role
}

/**
 * Create a custom Supabase-compatible JWT for a staff user.
 * The token includes `app_metadata.organization_id` so `get_user_organization_id()`
 * works in RLS policies, and `role: "authenticated"` / `aud: "authenticated"` so
 * Supabase PostgREST accepts the token.
 */
export async function createStaffJwt(payload: {
  userId: string;
  organizationId: string;
  userRole: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: payload.userId,
    role: "authenticated",
    aud: "authenticated",
    user_role: payload.userRole,
    app_metadata: {
      organization_id: payload.organizationId,
    },
    iat: now,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(STAFF_SESSION_DURATION)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a staff JWT.
 * @returns The decoded payload or null if invalid/expired.
 */
export async function verifyStaffJwt(
  token: string
): Promise<StaffJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      audience: "authenticated",
    });
    return payload as unknown as StaffJwtPayload;
  } catch {
    return null;
  }
}
```

##### Step 1 Verification Checklist
- [x] No build errors (`npm run dev` runs without issues)
- [x] `lib/auth/password.ts` and `lib/auth/jwt.ts` exist with no TypeScript errors
- [x] `SUPABASE_JWT_SECRET` is set in your `.env` file

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 2: Staff Management Server Actions [COMPLETED]

- [x] Create `lib/validations/staff.ts`:

```typescript
import { z } from "zod";

/**
 * Validation schema for creating a staff member
 */
export const createStaffSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
  is_active: z.boolean().default(true),
  can_manage_inventory: z.boolean().default(false),
  can_view_profits: z.boolean().default(false),
  can_view_reports: z.boolean().default(false),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

/**
 * Validation schema for updating a staff member.
 * PIN is optional — leave blank to keep existing PIN.
 */
export const updateStaffSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, "PIN must be 4-6 digits")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  can_manage_inventory: z.boolean().default(false),
  can_view_profits: z.boolean().default(false),
  can_view_reports: z.boolean().default(false),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
```

- [x] Create `app/actions/staff.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPin } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";
import type { CreateStaffInput, UpdateStaffInput } from "@/lib/validations/staff";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Helper: get the current owner's profile. Returns null if not owner.
 */
async function getOwnerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") return null;
  return profile;
}

/**
 * Get all staff members for the current organization.
 */
export async function getStaffMembers(): Promise<
  ActionResult<
    {
      id: string;
      full_name: string;
      email: string | null;
      pin: string | null;
      role: string;
      is_active: boolean | null;
      can_manage_inventory: boolean | null;
      can_view_profits: boolean | null;
      can_view_reports: boolean | null;
      last_login_at: string | null;
      created_at: string;
    }[]
  >
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, full_name, email, pin, role, is_active, can_manage_inventory, can_view_profits, can_view_reports, last_login_at, created_at"
    )
    .eq("role", "staff")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

/**
 * Create a new staff member with a hashed PIN.
 */
export async function createStaffMember(
  input: CreateStaffInput
): Promise<ActionResult<{ id: string }>> {
  const owner = await getOwnerProfile();
  if (!owner) return { success: false, error: "Only owners can manage staff" };

  const supabase = await createClient();

  // Hash the PIN before storing
  const pinHash = await hashPin(input.pin);

  const { data, error } = await supabase
    .from("users")
    .insert({
      organization_id: owner.organization_id,
      full_name: input.full_name,
      email: input.email || null,
      pin: pinHash,
      password_hash: null,
      role: "staff",
      is_active: input.is_active,
      can_manage_inventory: input.can_manage_inventory,
      can_view_profits: input.can_view_profits,
      can_view_reports: input.can_view_reports,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Create staff error:", error);
    if (error.message.includes("chk_auth_method")) {
      return { success: false, error: "Staff must have a PIN set." };
    }
    if (error.message.includes("idx_users_pin_unique")) {
      return {
        success: false,
        error: "This PIN is already in use by another staff member.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/staff");
  return { success: true, data: { id: data.id } };
}

/**
 * Update an existing staff member. Only re-hashes PIN if a new one is provided.
 */
export async function updateStaffMember(
  staffId: string,
  input: UpdateStaffInput
): Promise<ActionResult> {
  const owner = await getOwnerProfile();
  if (!owner) return { success: false, error: "Only owners can manage staff" };

  const supabase = await createClient();

  // Build update payload
  const updateData: Record<string, unknown> = {
    full_name: input.full_name,
    email: input.email || null,
    is_active: input.is_active,
    can_manage_inventory: input.can_manage_inventory,
    can_view_profits: input.can_view_profits,
    can_view_reports: input.can_view_reports,
  };

  // Only re-hash PIN if a new one is provided
  if (input.pin && input.pin.length >= 4) {
    updateData.pin = await hashPin(input.pin);
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", staffId)
    .eq("role", "staff");

  if (error) {
    console.error("Update staff error:", error);
    if (error.message.includes("idx_users_pin_unique")) {
      return {
        success: false,
        error: "This PIN is already in use by another staff member.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/staff");
  return { success: true };
}

/**
 * Soft-delete a staff member by setting deleted_at and is_active = false.
 */
export async function deleteStaffMember(
  staffId: string
): Promise<ActionResult> {
  const owner = await getOwnerProfile();
  if (!owner) return { success: false, error: "Only owners can manage staff" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", staffId)
    .eq("role", "staff");

  if (error) {
    console.error("Delete staff error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/staff");
  return { success: true };
}
```

##### Step 2 Verification Checklist
- [x] No build errors
- [x] `lib/validations/staff.ts` compiles without errors
- [x] `app/actions/staff.ts` compiles without errors

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 3: Staff Management UI (Wire Up Forms) [COMPLETED]

- [x] Update `components/staff/staff-form.tsx` — replace the entire file with the fully wired-up version:

```tsx
'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  createStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from '@/lib/validations/staff'
import { createStaffMember, updateStaffMember } from '@/app/actions/staff'

interface StaffFormProps {
  staff?: {
    id: string
    full_name: string
    email: string | null
    pin: string | null
    is_active: boolean | null
    can_manage_inventory: boolean | null
    can_view_profits: boolean | null
    can_view_reports: boolean | null
  }
  onSuccess: () => void
}

export function StaffForm({ staff, onSuccess }: StaffFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEditing = !!staff

  const form = useForm<CreateStaffInput | UpdateStaffInput>({
    resolver: zodResolver(isEditing ? updateStaffSchema : createStaffSchema),
    defaultValues: {
      full_name: staff?.full_name || '',
      email: staff?.email || '',
      pin: '',
      is_active: staff?.is_active ?? true,
      can_manage_inventory: staff?.can_manage_inventory ?? false,
      can_view_profits: staff?.can_view_profits ?? false,
      can_view_reports: staff?.can_view_reports ?? false,
    },
  })

  const onSubmit = (data: CreateStaffInput | UpdateStaffInput) => {
    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateStaffMember(staff.id, data as UpdateStaffInput)
          : await createStaffMember(data as CreateStaffInput)

        if (result.success) {
          toast.success(
            isEditing ? 'Staff member updated' : 'Staff member created'
          )
          router.refresh()
          onSuccess()
        } else {
          toast.error(result.error || 'An error occurred')
        }
      } catch (error) {
        toast.error('An unexpected error occurred')
        console.error('Staff form error:', error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Juan Dela Cruz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="staff@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Email is optional. Staff can login with PIN only.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEditing ? 'New PIN (leave blank to keep current)' : 'PIN'}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="4-6 digit PIN"
                  inputMode="numeric"
                  maxLength={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                4-6 digit PIN for quick staff login on POS
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold">Permissions</h3>

          <FormField
            control={form.control}
            name="can_manage_inventory"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Manage Inventory</FormLabel>
                  <FormDescription>
                    Can add, edit, and update stock levels
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="can_view_profits"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">View Profits</FormLabel>
                  <FormDescription>
                    Can see profit margins and financial data
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="can_view_reports"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">View Reports</FormLabel>
                  <FormDescription>
                    Can access sales reports and analytics
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Staff member can login when active
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Saving...'
              : isEditing
                ? 'Update Staff'
                : 'Create Staff'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

- [x] Update `components/staff/staff-list.tsx` — replace the `confirmDelete` function body (around line 71-88) to wire up the real action:

Find the existing `confirmDelete` function and replace the `// TODO` line with the actual call:

```tsx
// Inside staff-list.tsx, add this import at the top:
import { deleteStaffMember } from '@/app/actions/staff'
import { useRouter } from 'next/navigation'

// Inside the StaffList component, add useRouter:
const router = useRouter()

// Replace the confirmDelete function body:
const confirmDelete = async () => {
  if (!deletingStaffId) return

  setIsDeleting(true)

  try {
    const result = await deleteStaffMember(deletingStaffId)
    if (result.success) {
      toast.success('Staff member removed')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete staff member')
    }
    setDeleteDialogOpen(false)
    setDeletingStaffId(null)
  } catch (error) {
    toast.error('An unexpected error occurred')
    console.error('Delete error:', error)
  } finally {
    setIsDeleting(false)
  }
}
```

##### Step 3 Verification Checklist
- [x] No build errors
- [x] Navigate to `/staff` page — "Add Staff Member" dialog opens and creates a staff record with hashed PIN
- [x] Edit dialog updates staff member details
- [x] Delete confirmation soft-deletes the staff member
- [x] PIN validation shows errors for non-numeric or wrong-length input

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4: Staff Login API Route

- [ ] Create directory `app/api/auth/pin/` and file `app/api/auth/pin/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyPin } from "@/lib/auth/password";
import { createStaffJwt } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, pin } = body;

    // Validate input
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Organization slug is required" },
        { status: 400 }
      );
    }

    if (!pin || typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: "A valid 4-6 digit PIN is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Find organization by slug
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();

    if (orgError || !org) {
      // Generic error to avoid slug enumeration
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2. Find all active staff in this organization who have a PIN set
    const { data: staffMembers, error: staffError } = await supabase
      .from("users")
      .select("id, full_name, organization_id, role, pin, can_manage_inventory, can_view_profits, can_view_reports")
      .eq("organization_id", org.id)
      .eq("role", "staff")
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("pin", "is", null);

    if (staffError || !staffMembers || staffMembers.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Compare PIN hash against each staff member
    let matchedStaff = null;
    for (const staff of staffMembers) {
      if (staff.pin && (await verifyPin(pin, staff.pin))) {
        matchedStaff = staff;
        break;
      }
    }

    if (!matchedStaff) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 4. Generate custom JWT
    const token = await createStaffJwt({
      userId: matchedStaff.id,
      organizationId: matchedStaff.organization_id,
      userRole: "staff",
    });

    // 5. Update last_login_at
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", matchedStaff.id);

    // 6. Return token and user info
    return NextResponse.json({
      token,
      user: {
        id: matchedStaff.id,
        full_name: matchedStaff.full_name,
        role: matchedStaff.role,
        organization_id: matchedStaff.organization_id,
        can_manage_inventory: matchedStaff.can_manage_inventory,
        can_view_profits: matchedStaff.can_view_profits,
        can_view_reports: matchedStaff.can_view_reports,
      },
    });
  } catch (error) {
    console.error("PIN auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

##### Step 4 Verification Checklist
- [ ] No build errors
- [ ] Test with `curl` or Postman: `POST /api/auth/pin` with `{ "slug": "your-org-slug", "pin": "123456" }` returns a JWT and user details for a valid staff/PIN combo
- [ ] Invalid PIN returns 401
- [ ] Invalid slug returns 401 (generic error, no information leak)

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 5: Staff Login Page

- [ ] Create `app/(auth)/login/staff/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function StaffLoginPage() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim().toLowerCase(), pin }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        return
      }

      // Store the JWT in a cookie via a server action
      const cookieRes = await fetch('/api/auth/pin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
      })

      if (!cookieRes.ok) {
        setError('Failed to create session')
        return
      }

      toast.success(`Welcome, ${data.user.full_name}!`)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Staff login error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Staff Login</h1>
        <p className="text-sm text-muted-foreground">
          Enter your shop code and PIN to access POS
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="slug">Shop Code</Label>
          <Input
            id="slug"
            placeholder="e.g. joes-vape-shop"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={isLoading}
            autoComplete="organization"
            required
          />
          <p className="text-xs text-muted-foreground">
            Ask your shop owner for the shop code
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            type="password"
            placeholder="Enter your PIN"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              setPin(val)
            }}
            disabled={isLoading}
            autoComplete="one-time-code"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading || pin.length < 4}
        >
          {isLoading ? 'Signing in...' : 'Sign in with PIN'}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3" />
          Owner login
        </Link>
      </div>
    </div>
  )
}
```

- [ ] Create `app/api/auth/pin/session/route.ts` to set the JWT as an HTTP-only cookie:

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStaffJwt } from "@/lib/auth/jwt";

const STAFF_SESSION_COOKIE = "sb-staff-token";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify the token before storing
    const payload = await verifyStaffJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Set as HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(STAFF_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours (matches JWT expiry)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
```

- [ ] Update `app/(auth)/login/page.tsx` — add a link to the staff login page. Add the following block just before the closing `</div>` of the component (after the "Don't have an account?" section):

```tsx
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/login/staff"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Staff PIN login →
        </Link>
      </div>
```

##### Step 5 Verification Checklist
- [ ] No build errors
- [ ] Navigate to `/login` — "Staff PIN login →" link is visible and navigates to `/login/staff`
- [ ] On `/login/staff`, entering a valid org slug and staff PIN logs the user in and redirects to `/dashboard`
- [ ] Invalid credentials show an error message
- [ ] The staff token is stored as an HTTP-only cookie named `sb-staff-token`

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6: Middleware & Security Verification

- [ ] Update `lib/supabase/proxy.ts` to also check for the staff JWT cookie and allow access to dashboard routes for staff users:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const STAFF_SESSION_COOKIE = "sb-staff-token";

async function getStaffSession(request: NextRequest) {
  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret, {
      audience: "authenticated",
    });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // 1. Create Supabase client and refresh session
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

  // 2. Check both auth methods
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const staffSession = await getStaffSession(request);
  const isAuthenticated = !!user || !!staffSession;

  console.log('[Middleware]', {
    path: request.nextUrl.pathname,
    isAuthenticated,
    authType: user ? 'supabase' : staffSession ? 'staff-pin' : 'none',
    userId: user?.id || (staffSession?.sub as string) || null,
  });

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
    request.nextUrl.pathname.startsWith("/reports") ||
    request.nextUrl.pathname.startsWith("/staff") ||
    request.nextUrl.pathname.startsWith("/branches") ||
    request.nextUrl.pathname.startsWith("/settings");

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
    "camera=(), microphone=(), geolocation=()",
  );

  // Content Security Policy
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

- [ ] Update the dashboard layout `app/(dashboard)/layout.tsx` to handle staff JWT sessions by reading the staff cookie when the Supabase user is null:

```tsx
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardLayoutClient } from './layout-client'
import { StaffLayoutClient } from './layout-staff'
import { verifyStaffJwt } from '@/lib/auth/jwt'

const STAFF_SESSION_COOKIE = 'sb-staff-token'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Try staff JWT if no Supabase user
  if (!user) {
    const cookieStore = await cookies()
    const staffToken = cookieStore.get(STAFF_SESSION_COOKIE)?.value

    if (!staffToken) {
      redirect('/login')
    }

    const staffPayload = await verifyStaffJwt(staffToken)
    if (!staffPayload) {
      // Expired or invalid token — clear cookie and redirect
      cookieStore.delete(STAFF_SESSION_COOKIE)
      redirect('/login')
    }

    // Use service client to fetch staff profile (staff JWT is custom, not Supabase auth)
    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('users')
      .select(`
        id,
        full_name,
        role,
        can_view_profits,
        can_manage_inventory,
        can_view_reports,
        organization:organizations (
          id,
          name,
          slug,
          subscription_status
        )
      `)
      .eq('id', staffPayload.sub)
      .single()

    if (!profile || !profile.is_active) {
      cookieStore.delete(STAFF_SESSION_COOKIE)
      redirect('/login')
    }

    return (
      <StaffLayoutClient
        userFullName={profile.full_name}
        userRole={profile.role}
        canManageInventory={profile.can_manage_inventory ?? false}
      >
        {children}
      </StaffLayoutClient>
    )
  }

  // Standard Supabase auth path (owner flow)
  const { data: profile } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      role,
      can_view_profits,
      can_manage_inventory,
      can_view_reports,
      organization:organizations (
        id,
        name,
        slug,
        subscription_status
      )
    `)
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Use simplified staff layout for staff users
  if (profile.role === 'staff') {
    return (
      <StaffLayoutClient
        userFullName={profile.full_name}
        userRole={profile.role}
        canManageInventory={profile.can_manage_inventory ?? false}
      >
        {children}
      </StaffLayoutClient>
    )
  }

  // Use full dashboard layout for owners
  return (
    <DashboardLayoutClient
      userFullName={profile.full_name}
      userRole={profile.role}
      canManageInventory={profile.can_manage_inventory ?? false}
      canViewReports={profile.can_view_reports ?? false}
    >
      {children}
    </DashboardLayoutClient>
  )
}
```

- [ ] Add a staff sign-out action in `app/actions/auth.ts`. Add the following function at the bottom of the file:

```typescript
/**
 * Sign out a staff user (clears custom JWT cookie)
 */
export async function signOutStaff(): Promise<void> {
  const cookieStore = await (await import("next/headers")).cookies();
  cookieStore.delete("sb-staff-token");
  revalidatePath("/", "layout");
  redirect("/login");
}
```

##### Step 6 Verification Checklist
- [ ] No build errors
- [ ] Staff user can log in via `/login/staff` with org slug + PIN and is redirected to `/dashboard`
- [ ] Staff user sees the staff layout (no sidebar, FAB actions)
- [ ] Staff user session persists across page refreshes (cookie-based)
- [ ] Unauthenticated users are redirected from protected routes to `/login`
- [ ] Authenticated users (both owner and staff) are redirected from `/login` to `/dashboard`
- [ ] Staff sign-out clears the cookie and redirects to `/login`

#### Step 6 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
