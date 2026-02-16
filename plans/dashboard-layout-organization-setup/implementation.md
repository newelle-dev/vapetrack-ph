# Dashboard Layout & Organization Setup - Implementation Guide

## Goal

Implement a production-ready dashboard layout with mobile-first responsive navigation, organization settings management, and branch CRUD operations, strictly following multi-tenant RLS patterns and the VapeTrack PH design system.

## Prerequisites

### Branch Setup

- [ ] Ensure you are on the `feature/dashboard-layout-org-setup` branch
- [ ] If branch doesn't exist, create it from main: `git checkout -b feature/dashboard-layout-org-setup`

### Install Required shadcn Components

```bash
npx shadcn@latest add sheet navigation-menu avatar dropdown-menu table badge alert-dialog
```

---

## Step 1: Dashboard Layout Foundation - Part 1 (Header & Sidebar Components)

### Step 1.1: Create Header Component

- [x] Create `components/layouts/Header.tsx` with the following code:

```typescript
'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { toast } from 'sonner'

interface HeaderProps {
  userFullName: string
  userRole: string
  onMenuClick: () => void
}

export function Header({ userFullName, userRole, onMenuClick }: HeaderProps) {
  const router = useRouter()

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Error logging out')
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo/Brand */}
        <div className="flex items-center gap-2 md:flex-1">
          <span className="text-lg font-bold">VapeTrack PH</span>
        </div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 gap-2 rounded-full px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(userFullName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {userFullName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userFullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="cursor-pointer"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### Step 1.2: Create Sidebar Component

- [x] Create `components/layouts/Sidebar.tsx` with the following code:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingCart,
  Package,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

interface SidebarProps {
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
}

export function Sidebar({ userRole, canManageInventory, canViewReports }: SidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, show: true },
    { label: 'POS', href: '/dashboard/pos', icon: ShoppingCart, show: true },
    {
      label: 'Inventory',
      href: '/dashboard/inventory',
      icon: Package,
      show: canManageInventory,
    },
    {
      label: 'Branches',
      href: '/dashboard/branches',
      icon: Building2,
      show: userRole === 'owner',
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      show: canViewReports,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      show: userRole === 'owner',
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-30 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-border md:bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-bold">VapeTrack PH</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

### Step 1.3: Create Mobile Navigation Component

- [x] Create `components/layouts/MobileNav.tsx` with the following code:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, ShoppingCart, Package, BarChart3, type LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

interface MobileNavProps {
  canManageInventory: boolean
  canViewReports: boolean
}

export function MobileNav({ canManageInventory, canViewReports }: MobileNavProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, show: true },
    { label: 'POS', href: '/dashboard/pos', icon: ShoppingCart, show: true },
    {
      label: 'Inventory',
      href: '/dashboard/inventory',
      icon: Package,
      show: canManageInventory,
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      show: canViewReports,
    },
  ]

  const visibleItems = navItems.filter((item) => item.show).slice(0, 4)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Step 1 STOP & COMMIT

**STOP & COMMIT:** Verify the three layout components are created without errors before proceeding.

**Verification Checklist:**

- [ ] No TypeScript errors in `components/layouts/Header.tsx`
- [ ] No TypeScript errors in `components/layouts/Sidebar.tsx`
- [ ] No TypeScript errors in `components/layouts/MobileNav.tsx`
- [ ] Run `npm run build` - should succeed

---

## Step 2: Dashboard Layout Foundation - Part 2 (Dashboard Layout)

### Step 2.1: Create Dashboard Layout with Navigation Sheet

- [ ] Create `app/(dashboard)/layout.tsx` with the following code:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layouts/Header'
import { Sidebar } from '@/components/layouts/Sidebar'
import { MobileNav } from '@/components/layouts/MobileNav'
import { DashboardLayoutClient } from './layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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

### Step 2.2: Create Client Layout Component with Sheet

- [ ] Create `app/(dashboard)/layout-client.tsx` with the following code:

```typescript
'use client'

import { useState } from 'react'
import { Header } from '@/components/layouts/Header'
import { Sidebar } from '@/components/layouts/Sidebar'
import { MobileNav } from '@/components/layouts/MobileNav'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingCart,
  Package,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userFullName: string
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
}

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

export function DashboardLayoutClient({
  children,
  userFullName,
  userRole,
  canManageInventory,
  canViewReports,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, show: true },
    { label: 'POS', href: '/dashboard/pos', icon: ShoppingCart, show: true },
    {
      label: 'Inventory',
      href: '/dashboard/inventory',
      icon: Package,
      show: canManageInventory,
    },
    {
      label: 'Branches',
      href: '/dashboard/branches',
      icon: Building2,
      show: userRole === 'owner',
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      show: canViewReports,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      show: userRole === 'owner',
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <div className="min-h-screen">
      <Sidebar
        userRole={userRole}
        canManageInventory={canManageInventory}
        canViewReports={canViewReports}
      />
      <div className="flex flex-col md:pl-60">
        <Header
          userFullName={userFullName}
          userRole={userRole}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <MobileNav canManageInventory={canManageInventory} canViewReports={canViewReports} />

      {/* Mobile navigation sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-60">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

### Step 2 STOP & COMMIT

**STOP & COMMIT:** Verify the dashboard layout renders correctly before proceeding.

**Verification Checklist:**

- [ ] No TypeScript errors in `app/(dashboard)/layout.tsx`
- [ ] No TypeScript errors in `app/(dashboard)/layout-client.tsx`
- [ ] Run `npm run dev` and visit `http://localhost:3000/dashboard` while logged out - should redirect to `/login`
- [ ] Log in and visit `/dashboard` - should show dashboard layout with header
- [ ] Desktop (≥1024px): Sidebar visible on left, no bottom nav
- [ ] Mobile (375px): Bottom nav visible, hamburger menu in header, sidebar hidden
- [ ] Click hamburger menu - sheet should open with navigation
- [ ] Click user dropdown - should show "Settings" and "Logout"
- [ ] Run `npm run build` - should succeed

---

## Step 3: Organization Settings Page

### Step 3.1: Create Organization Validation Schema

- [ ] Create `lib/validations/organization.ts` with the following code:

```typescript
import { z } from "zod";

export const organizationUpdateSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
```

### Step 3.2: Create Organization Server Actions

- [ ] Create `app/actions/organizations.ts` with the following code:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrganizationUpdateInput } from "@/lib/validations/organization";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function updateOrganization(
  data: OrganizationUpdateInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Fetch user profile to get organization_id
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    if (userProfile.role !== "owner") {
      return {
        success: false,
        error: "Only organization owners can update settings",
      };
    }

    // RLS automatically filters to user's organization
    const { error } = await supabase
      .from("organizations")
      .update({
        name: data.name,
        address: data.address,
        phone: data.phone,
      })
      .eq("id", userProfile.organization_id);

    if (error) {
      console.error("Organization update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

### Step 3.3: Create Organization Settings Page (Server Component)

- [ ] Create folder `app/(dashboard)/settings`
- [ ] Create `app/(dashboard)/settings/page.tsx` with the following code:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrganizationSettingsForm } from './organization-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id,
      role,
      organization:organizations (
        id,
        name,
        slug,
        owner_email,
        address,
        phone,
        subscription_status,
        created_at
      )
    `)
    .eq('id', user.id)
    .single()

  if (!profile?.organization) {
    redirect('/dashboard')
  }

  const org = profile.organization as any

  return (
    <div className="container max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your shop details and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
          <CardDescription>
            Update your shop name, address, and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm
            organization={{
              id: org.id,
              name: org.name,
              slug: org.slug,
              ownerEmail: org.owner_email,
              address: org.address ?? '',
              phone: org.phone ?? '',
              subscriptionStatus: org.subscription_status ?? 'trial',
              createdAt: org.created_at,
            }}
            isOwner={profile.role === 'owner'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Read-Only Information</CardTitle>
          <CardDescription>
            System information that cannot be changed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Shop Slug</div>
            <div className="text-sm text-muted-foreground">{org.slug}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Owner Email</div>
            <div className="text-sm text-muted-foreground">{org.owner_email}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Subscription Status</div>
            <div className="text-sm text-muted-foreground capitalize">
              {org.subscription_status ?? 'trial'}
            </div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Created</div>
            <div className="text-sm text-muted-foreground">
              {new Date(org.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 3.4: Create Organization Settings Form (Client Component)

- [ ] Create `app/(dashboard)/settings/organization-settings-form.tsx` with the following code:

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  organizationUpdateSchema,
  type OrganizationUpdateInput,
} from '@/lib/validations/organization'
import { updateOrganization } from '@/app/actions/organizations'

interface OrganizationSettingsFormProps {
  organization: {
    id: string
    name: string
    slug: string
    ownerEmail: string
    address: string
    phone: string
    subscriptionStatus: string
    createdAt: string
  }
  isOwner: boolean
}

export function OrganizationSettingsForm({
  organization,
  isOwner,
}: OrganizationSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<OrganizationUpdateInput>({
    resolver: zodResolver(organizationUpdateSchema),
    defaultValues: {
      name: organization.name,
      address: organization.address,
      phone: organization.phone,
    },
  })

  async function onSubmit(data: OrganizationUpdateInput) {
    setIsLoading(true)

    try {
      const result = await updateOrganization(data)

      if (result.success) {
        toast.success('Organization updated successfully')
      } else {
        toast.error(result.error || 'Failed to update organization')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOwner) {
    return (
      <div className="text-sm text-muted-foreground">
        Only organization owners can edit these settings.
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shop Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="My Vape Shop"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main St, Manila"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="+63 912 345 6789"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
```

### Step 3 STOP & COMMIT

**STOP & COMMIT:** Verify organization settings page works before proceeding.

**Verification Checklist:**

- [ ] No TypeScript errors
- [ ] Run `npm run build` - should succeed
- [ ] Navigate to `/dashboard/settings` while logged in as owner
- [ ] Organization details display correctly
- [ ] Edit organization name, address, and phone
- [ ] Submit form - should show success toast
- [ ] Refresh page - changes should persist
- [ ] Try invalid input (empty name) - should show validation error
- [ ] Read-only fields (slug, owner email, subscription status) display correctly

---

## Step 4: Branch Management Page

### Step 4.1: Create Branch Validation Schema

- [ ] Create `lib/validations/branch.ts` with the following code:

```typescript
import { z } from "zod";

export const branchCreateSchema = z.object({
  name: z.string().min(2, "Branch name required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const branchUpdateSchema = branchCreateSchema;

export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;
```

### Step 4.2: Create Branch Server Actions

- [ ] Create `app/actions/branches.ts` with the following code:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateUniqueSlug, slugify } from "@/lib/utils/slugify";
import type {
  BranchCreateInput,
  BranchUpdateInput,
} from "@/lib/validations/branch";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createBranch(
  data: BranchCreateInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    if (userProfile.role !== "owner") {
      return {
        success: false,
        error: "Only organization owners can create branches",
      };
    }

    // If setting as default, unset other defaults
    if (data.is_default) {
      await supabase
        .from("branches")
        .update({ is_default: false })
        .eq("organization_id", userProfile.organization_id)
        .eq("is_default", true);
    }

    const baseSlug = slugify(data.name);
    const slug = generateUniqueSlug(baseSlug);

    const { error } = await supabase.from("branches").insert({
      organization_id: userProfile.organization_id,
      name: data.name,
      slug,
      address: data.address,
      phone: data.phone,
      is_default: data.is_default,
      is_active: data.is_active,
    });

    if (error) {
      console.error("Branch creation error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/branches");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateBranch(
  id: string,
  data: BranchUpdateInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    if (userProfile.role !== "owner") {
      return {
        success: false,
        error: "Only organization owners can update branches",
      };
    }

    // If setting as default, unset other defaults
    if (data.is_default) {
      await supabase
        .from("branches")
        .update({ is_default: false })
        .eq("organization_id", userProfile.organization_id)
        .eq("is_default", true)
        .neq("id", id);
    }

    const { error } = await supabase
      .from("branches")
      .update({
        name: data.name,
        address: data.address,
        phone: data.phone,
        is_default: data.is_default,
        is_active: data.is_active,
      })
      .eq("id", id)
      .eq("organization_id", userProfile.organization_id);

    if (error) {
      console.error("Branch update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/branches");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteBranch(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    if (userProfile.role !== "owner") {
      return {
        success: false,
        error: "Only organization owners can delete branches",
      };
    }

    // Check if branch is default
    const { data: branch } = await supabase
      .from("branches")
      .select("is_default")
      .eq("id", id)
      .eq("organization_id", userProfile.organization_id)
      .single();

    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    if (branch.is_default) {
      return { success: false, error: "Cannot delete default branch" };
    }

    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", id)
      .eq("organization_id", userProfile.organization_id);

    if (error) {
      console.error("Branch deletion error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/branches");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

### Step 4.3: Create Branch Management Page (Server Component)

- [ ] Create folder `app/(dashboard)/branches`
- [ ] Create `app/(dashboard)/branches/page.tsx` with the following code:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BranchList } from './branch-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function BranchesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <div className="container max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">
            Manage your shop locations and settings
          </p>
        </div>
      </div>

      <BranchList branches={branches ?? []} />
    </div>
  )
}
```

### Step 4.4: Create Branch List Component

- [ ] Create `app/(dashboard)/branches/branch-list.tsx` with the following code:

```typescript
'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BranchForm } from './branch-form'
import { deleteBranch } from '@/app/actions/branches'
import { useRouter } from 'next/navigation'

interface Branch {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  is_active: boolean | null
  is_default: boolean | null
  created_at: string
}

interface BranchListProps {
  branches: Branch[]
}

export function BranchList({ branches }: BranchListProps) {
  const router = useRouter()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setEditDialogOpen(true)
  }

  const handleDelete = (branchId: string) => {
    setDeletingBranchId(branchId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingBranchId) return

    setIsDeleting(true)

    try {
      const result = await deleteBranch(deletingBranchId)

      if (result.success) {
        toast.success('Branch deleted successfully')
        setDeleteDialogOpen(false)
        setDeletingBranchId(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete branch')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 size-4" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
              <DialogDescription>
                Create a new branch location for your organization.
              </DialogDescription>
            </DialogHeader>
            <BranchForm onSuccess={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No branches yet</p>
          <p className="text-sm text-muted-foreground">
            Get started by creating your first branch location.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {branch.name}
                      {branch.is_default && (
                        <Badge variant="default">Default</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {branch.address || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {branch.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(branch)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(branch.id)}
                        disabled={branch.is_default ?? false}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch details and settings.
            </DialogDescription>
          </DialogHeader>
          {editingBranch && (
            <BranchForm
              branch={editingBranch}
              onSuccess={() => {
                setEditDialogOpen(false)
                setEditingBranch(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

### Step 4.5: Create Branch Form Component

- [ ] Create `app/(dashboard)/branches/branch-form.tsx` with the following code:

```typescript
'use client'

import { useState } from 'react'
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
  branchCreateSchema,
  branchUpdateSchema,
  type BranchCreateInput,
  type BranchUpdateInput,
} from '@/lib/validations/branch'
import { createBranch, updateBranch } from '@/app/actions/branches'

interface BranchFormProps {
  branch?: {
    id: string
    name: string
    address: string | null
    phone: string | null
    is_default: boolean | null
    is_active: boolean | null
  }
  onSuccess?: () => void
}

export function BranchForm({ branch, onSuccess }: BranchFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!branch

  const form = useForm<BranchCreateInput | BranchUpdateInput>({
    resolver: zodResolver(isEditing ? branchUpdateSchema : branchCreateSchema),
    defaultValues: {
      name: branch?.name ?? '',
      address: branch?.address ?? '',
      phone: branch?.phone ?? '',
      is_default: branch?.is_default ?? false,
      is_active: branch?.is_active ?? true,
    },
  })

  async function onSubmit(data: BranchCreateInput | BranchUpdateInput) {
    setIsLoading(true)

    try {
      const result = isEditing
        ? await updateBranch(branch.id, data)
        : await createBranch(data)

      if (result.success) {
        toast.success(isEditing ? 'Branch updated' : 'Branch created')
        form.reset()
        router.refresh()
        onSuccess?.()
      } else {
        toast.error(result.error || 'Operation failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Form error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Main Branch"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main St, Manila"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="+63 912 345 6789"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Default Branch</FormLabel>
                <FormDescription>
                  Set as the primary branch for this organization
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this branch
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} size="lg" className="w-full">
          {isLoading
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
              ? 'Update Branch'
              : 'Create Branch'}
        </Button>
      </form>
    </Form>
  )
}
```

### Step 4.6: Install Switch Component

- [ ] Run the following command to install the Switch component:

```bash
npx shadcn@latest add switch
```

### Step 4 STOP & COMMIT

**STOP & COMMIT:** Verify branch management page works before proceeding.

**Verification Checklist:**

- [ ] No TypeScript errors
- [ ] Run `npm run build` - should succeed
- [ ] Navigate to `/dashboard/branches` while logged in as owner
- [ ] At least one branch exists (Main Branch created during signup)
- [ ] Click "Add Branch" - dialog opens with form
- [ ] Create new branch with name "Test Branch" - should appear in list
- [ ] Click edit icon on a branch - dialog opens with pre-filled form
- [ ] Update branch details - should save and update list
- [ ] Try to set two branches as default - only one should be default
- [ ] Test branch activation toggle (is_active field)
- [ ] Click delete icon on non-default branch - confirmation dialog appears
- [ ] Confirm deletion - branch removed from list
- [ ] Try to delete default branch - delete button should be disabled
- [ ] Sign up second account - verify branches are isolated

---

## Step 5: Multi-Tenant Testing & Polish

### Step 5.1: Create Multi-Tenant E2E Test

- [ ] Create `e2e/dashboard-multi-tenant.spec.ts` with the following code:

```typescript
import { test, expect, type Browser } from "@playwright/test";

test.describe("Dashboard Multi-Tenant Isolation", () => {
  test("organizations see only their own branches", async ({ browser }) => {
    // Create two separate browser contexts (isolated sessions)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Organization A: Sign up
    await pageA.goto("http://localhost:3000/signup");
    await pageA.fill('input[name="fullName"]', "Owner A");
    await pageA.fill('input[name="shopName"]', "Shop A");
    await pageA.fill('input[name="email"]', `ownera-${Date.now()}@test.com`);
    await pageA.fill('input[name="password"]', "password123");
    await pageA.fill('input[name="confirmPassword"]', "password123");
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL("**/dashboard");

    // Organization B: Sign up
    await pageB.goto("http://localhost:3000/signup");
    await pageB.fill('input[name="fullName"]', "Owner B");
    await pageB.fill('input[name="shopName"]', "Shop B");
    await pageB.fill('input[name="email"]', `ownerb-${Date.now()}@test.com`);
    await pageB.fill('input[name="password"]', "password123");
    await pageB.fill('input[name="confirmPassword"]', "password123");
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL("**/dashboard");

    // Org A: Create a branch
    await pageA.goto("http://localhost:3000/dashboard/branches");
    await pageA.click("text=Add Branch");
    await pageA.fill('input[name="name"]', "Branch A1");
    await pageA.click('button:has-text("Create Branch")');
    await pageA.waitForTimeout(1000);

    // Org B: Create a branch
    await pageB.goto("http://localhost:3000/dashboard/branches");
    await pageB.click("text=Add Branch");
    await pageB.fill('input[name="name"]', "Branch B1");
    await pageB.click('button:has-text("Create Branch")');
    await pageB.waitForTimeout(1000);

    // Verify isolation: Org A should NOT see Branch B1
    await pageA.reload();
    await expect(pageA.locator("text=Branch A1")).toBeVisible();
    await expect(pageA.locator("text=Branch B1")).not.toBeVisible();

    // Verify isolation: Org B should NOT see Branch A1
    await pageB.reload();
    await expect(pageB.locator("text=Branch B1")).toBeVisible();
    await expect(pageB.locator("text=Branch A1")).not.toBeVisible();

    // Cleanup
    await contextA.close();
    await contextB.close();
  });

  test("organization settings show only own data", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Sign up
    await page.goto("http://localhost:3000/signup");
    const email = `owner-${Date.now()}@test.com`;
    await page.fill('input[name="fullName"]', "Test Owner");
    await page.fill('input[name="shopName"]', "Test Shop");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Navigate to settings
    await page.goto("http://localhost:3000/dashboard/settings");

    // Verify organization details
    await expect(page.locator('input[name="name"]')).toHaveValue("Test Shop");
    await expect(page.locator("text=" + email)).toBeVisible();

    await context.close();
  });
});
```

### Step 5.2: Create Navigation E2E Test

- [ ] Create `e2e/dashboard-navigation.spec.ts` with the following code:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Dashboard Navigation", () => {
  test("owner sees all navigation items", async ({ page }) => {
    // Sign up as owner
    await page.goto("http://localhost:3000/signup");
    await page.fill('input[name="fullName"]', "Owner User");
    await page.fill('input[name="shopName"]', "Owner Shop");
    await page.fill('input[name="email"]', `owner-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Desktop: Check sidebar navigation
    await page.setViewportSize({ width: 1280, height: 800 });

    await expect(page.locator("aside >> text=Dashboard")).toBeVisible();
    await expect(page.locator("aside >> text=POS")).toBeVisible();
    await expect(page.locator("aside >> text=Inventory")).toBeVisible();
    await expect(page.locator("aside >> text=Branches")).toBeVisible();
    await expect(page.locator("aside >> text=Reports")).toBeVisible();
    await expect(page.locator("aside >> text=Settings")).toBeVisible();
  });

  test("navigation links work correctly", async ({ page }) => {
    // Sign up
    await page.goto("http://localhost:3000/signup");
    await page.fill('input[name="fullName"]', "Nav Test");
    await page.fill('input[name="shopName"]', "Nav Shop");
    await page.fill('input[name="email"]', `nav-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    await page.setViewportSize({ width: 1280, height: 800 });

    // Test Branches link
    await page.click("aside >> text=Branches");
    await page.waitForURL("**/dashboard/branches");
    await expect(
      page.locator('h1:has-text("Branch Management")'),
    ).toBeVisible();

    // Test Settings link
    await page.click("aside >> text=Settings");
    await page.waitForURL("**/dashboard/settings");
    await expect(
      page.locator('h1:has-text("Organization Settings")'),
    ).toBeVisible();

    // Test Dashboard link
    await page.click("aside >> text=Dashboard");
    await page.waitForURL("**/dashboard");
  });

  test("responsive navigation works on mobile", async ({ page }) => {
    // Sign up
    await page.goto("http://localhost:3000/signup");
    await page.fill('input[name="fullName"]', "Mobile User");
    await page.fill('input[name="shopName"]', "Mobile Shop");
    await page.fill('input[name="email"]', `mobile-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Desktop sidebar should be hidden
    await expect(page.locator("aside")).not.toBeVisible();

    // Mobile bottom nav should be visible
    await expect(page.locator('nav:has-text("Dashboard")')).toBeVisible();

    // Hamburger menu should open sheet
    await page.click('button[aria-label="Open menu"]');
    await expect(page.locator("text=Navigation")).toBeVisible();
  });
});
```

### Step 5.3: Run E2E Tests

- [ ] Run the E2E tests:

```bash
npm run test:e2e
```

### Step 5.4: Manual Testing Checklist

#### Responsive Testing

- [ ] Test at 375px (iPhone SE): Bottom nav visible, sidebar hidden, hamburger menu works
- [ ] Test at 768px (iPad): Bottom nav visible, sidebar hidden, hamburger menu works
- [ ] Test at 1024px+ (Desktop): Sidebar visible, bottom nav hidden
- [ ] Verify all touch targets are ≥ 44×44px on mobile
- [ ] Test hamburger menu on mobile - sheet slides in/out smoothly
- [ ] Test user dropdown on all screen sizes

#### Error Handling

- [ ] Try submitting empty organization name - validation error appears
- [ ] Try submitting empty branch name - validation error appears
- [ ] Test with DevTools offline mode - appropriate error messages
- [ ] Verify toast notifications appear and auto-dismiss

#### Accessibility

- [ ] Tab through navigation - focus indicators visible
- [ ] Tab through forms - logical tab order
- [ ] ARIA labels on icon-only buttons (hamburger menu, delete, edit)
- [ ] Form labels properly associated with inputs

#### Loading States & Polish

- [ ] Forms show loading state during submission
- [ ] Buttons disable during async operations
- [ ] Empty state message appears when no branches exist
- [ ] Success/error toasts appear with appropriate messages
- [ ] Forms reset after successful submission
- [ ] Delete confirmation dialog is readable on mobile

#### Multi-Tenant Verification

- [ ] Create second test account
- [ ] Verify organizations see completely separate data
- [ ] Verify branches created in Org A don't appear in Org B
- [ ] Verify organization settings show only own data

### Step 5 STOP & COMMIT

**STOP & COMMIT:** All tests passing and manual verification complete.

**Final Verification Checklist:**

- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] No TypeScript errors: `npm run build`
- [ ] No console errors or warnings in browser
- [ ] Multi-tenant isolation verified with 2+ test accounts
- [ ] Responsive behavior verified at all breakpoints
- [ ] All forms validated and error handling working
- [ ] Loading states and toast notifications working
- [ ] Accessibility verified (tab navigation, focus indicators, ARIA labels)

---

## Success Criteria - Final Checklist

- [ ] Authentication check in dashboard layout redirects unauthenticated users to `/login`
- [ ] Desktop sidebar displays all navigation items and user dropdown
- [ ] Mobile bottom nav displays with 44×44px touch targets
- [ ] Mobile hamburger menu opens sheet with navigation
- [ ] Permission-based navigation hides items based on role and permissions
- [ ] Organization settings page displays and updates organization data
- [ ] Branch management page lists, adds, edits, and deletes branches
- [ ] Branch deletion prevented for default branch (delete button disabled)
- [ ] Multi-tenant test passes: 2+ orgs see completely separate data
- [ ] Playwright E2E tests pass (multi-tenant + navigation)
- [ ] Responsive behavior verified at 375px, 768px, 1024px widths
- [ ] No console errors or TypeScript errors
- [ ] All forms validated with Zod schemas
- [ ] Toast notifications appear on success/error
- [ ] Loading states display during async operations
- [ ] `npm run build` succeeds without errors

---

## Troubleshooting

### Issue: TypeScript errors about missing Switch component

**Solution:** Run `npx shadcn@latest add switch`

### Issue: Navigation sheet doesn't open on mobile

**Solution:** Verify Sheet component installed: `npx shadcn@latest add sheet`

### Issue: "User profile not found" error

**Solution:** Ensure user signed up through the signup flow (which creates user profile)

### Issue: Branches from other organizations visible

**Solution:** Check Supabase RLS policies are enabled on `branches` table

### Issue: Forms don't reset after submission

**Solution:** Verify `form.reset()` is called in success handler and `router.refresh()` is called

### Issue: E2E tests failing

**Solution:**

- Ensure dev server is running: `npm run dev`
- Check Supabase credentials in `.env.local`
- Try running tests one at a time
- Increase timeouts if tests are flaky

---

## Notes

- All code follows the established patterns from the VapeTrack PH codebase
- RLS policies automatically filter data by `organization_id` - no manual filtering needed
- Server Components used for data fetching, Client Components only for interactivity
- Mobile-first design with 44×44px minimum touch targets
- Dark mode supported via Tailwind CSS variables
- All Server Actions return `{ success: boolean, error?: string, data?: T }` pattern
- Toast notifications used for user feedback on all mutations
