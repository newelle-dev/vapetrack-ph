# VapeTrack PH - Complete Implementation Guide

**Generated:** February 17, 2026  
**Purpose:** Comprehensive reference for implementing features in the VapeTrack PH codebase

---

## 📑 Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Code Patterns Library](#code-patterns-library)
4. [Architecture Principles](#architecture-principles)
5. [Component Inventory](#component-inventory)
6. [Database Schema Reference](#database-schema-reference)
7. [Implementation Checklist](#implementation-checklist)
8. [Common Gotchas](#common-gotchas)

---

## Technology Stack

### Core Dependencies (from package.json)

```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "typescript": "^5",
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.95.3",
  "@tanstack/react-query": "^5.90.20",
  "react-hook-form": "^7.71.1",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^4.3.6",
  "zustand": "^5.0.11",
  "sonner": "^2.0.7",
  "tailwindcss": "^4",
  "lucide-react": "^0.563.0"
}
```

### Build Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build with TypeScript validation
npm run start        # Start production server
npm run lint         # ESLint check
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright UI mode
```

### TypeScript Configuration

- **Target:** ES2017
- **Module:** ESNext (bundler resolution)
- **JSX:** react-jsx (React 19)
- **Strict Mode:** Enabled
- **Path Alias:** `@/*` maps to project root

### Build System

- **Shadow UI:** New York style, RSC-enabled, Tailwind v4
- **Icon Library:** lucide-react
- **CSS:** Tailwind v4 with @import 'tailwindcss'
- **Dark Mode:** Default (see globals.css)

---

## Project Structure

```
vapetrack-ph/
├── app/
│   ├── globals.css                    # Tailwind v4 + CSS variables
│   ├── layout.tsx                     # Root layout (dark mode, Toaster)
│   ├── page.tsx                       # Homepage
│   ├── (auth)/                        # Auth route group
│   │   ├── layout.tsx                 # Auth layout (centered card)
│   │   ├── login/page.tsx             # Login form
│   │   └── signup/page.tsx            # Signup wizard
│   ├── (dashboard)/                   # Protected dashboard
│   │   ├── layout.tsx                 # Server Component (role delegation)
│   │   ├── layout-client.tsx          # Owner dashboard layout
│   │   ├── layout-staff.tsx           # Staff dashboard layout
│   │   ├── dashboard/page.tsx         # Dashboard home
│   │   ├── branches/page.tsx          # Branch management
│   │   ├── inventory/page.tsx         # Inventory (placeholder)
│   │   ├── pos/page.tsx               # Point of Sale
│   │   ├── reports/page.tsx           # Analytics
│   │   ├── settings/page.tsx          # Shop settings
│   │   └── staff/page.tsx             # Staff management
│   └── actions/                       # Server Actions ('use server')
│       ├── auth.ts                    # signUp, signIn, signOut
│       ├── branches.ts                # createBranch, updateBranch, deleteBranch
│       ├── categories.ts              # getCategories, createCategory, updateCategory, deleteCategory
│       └── organizations.ts           # Organization actions
│
├── components/
│   ├── ui/                            # shadcn/ui components (copied, not npm)
│   │   ├── button.tsx                 # Button with variants
│   │   ├── dialog.tsx                 # Dialog/Modal
│   │   ├── form.tsx                   # react-hook-form integration
│   │   ├── input.tsx                  # Input field
│   │   ├── table.tsx                  # Table components
│   │   ├── card.tsx                   # Card container
│   │   ├── badge.tsx                  # Status badges
│   │   ├── sheet.tsx                  # Slide-out panel
│   │   ├── switch.tsx                 # Toggle switch
│   │   └── [others]                   # 18+ components available
│   ├── layouts/
│   │   ├── Header.tsx                 # App header
│   │   ├── Sidebar.tsx                # Desktop sidebar
│   │   ├── MobileNav.tsx              # Mobile bottom nav
│   │   ├── page-container.tsx         # Page wrapper
│   │   └── menu-config.ts             # Navigation config
│   ├── branch/
│   │   ├── branch-form.tsx            # Create/Edit branch form
│   │   ├── branch-list.tsx            # Branch list with actions
│   │   └── create-branch-dialog.tsx   # Dialog wrapper
│   ├── staff/
│   │   ├── staff-form.tsx             # Create/Edit staff form
│   │   ├── staff-list.tsx             # Staff list
│   │   └── create-staff-dialog.tsx    # Dialog wrapper
│   ├── categories/
│   │   ├── category-form.tsx          # Category form (dialog)
│   │   └── category-list.tsx          # Category table
│   ├── dashboard/                     # Dashboard widgets
│   │   ├── metrics-card.tsx
│   │   └── stat-card.tsx
│   └── pos/                           # POS components
│       ├── cart-sheet.tsx
│       ├── checkout-cart.tsx
│       ├── product-card.tsx
│       └── variant-selector.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client factory
│   │   ├── server.ts                  # Server client factory + service role
│   │   └── proxy.ts                   # Optional proxy
│   ├── utils.ts                       # cn() utility
│   ├── utils/
│   │   └── slugify.ts                 # slugify(), generateUniqueSlug()
│   └── validations/                   # Zod schemas
│       ├── auth.ts                    # loginSchema, signupSchema
│       ├── branch.ts                  # branchCreateSchema, branchUpdateSchema
│       ├── category.ts                # categorySchema
│       └── organization.ts            # organizationSchema
│
├── types/
│   └── database.ts                    # Auto-generated Supabase types
│
├── docs/
│   ├── architecture/                  # Architecture docs
│   │   ├── multi_tenancy.md          # RLS patterns
│   │   ├── authentication.md         # Auth flows
│   │   └── [others]
│   ├── database/
│   │   └── functions.md              # RPC functions (process_transaction)
│   └── development/
│       └── layout-system.md          # PageContainer patterns
│
├── migrations/                        # SQL migrations
│   ├── 001_initial_schema.sql
│   └── 002_add_soft_delete_to_categories.sql
│
└── e2e/                               # Playwright tests
    ├── auth-routes.spec.ts
    ├── dashboard-multi-tenant.spec.ts
    └── dashboard-navigation.spec.ts
```

---

## Code Patterns Library

### 1. Supabase Client Usage

#### Server Component (Default)

```typescript
// app/(dashboard)/products/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProductsPage() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch data (RLS automatically filters by organization_id)
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .is('deleted_at', null)  // Soft delete filter
    .order('created_at', { ascending: false })

  return <ProductList products={products ?? []} />
}
```

#### Client Component (with 'use client')

```typescript
// components/products/product-list.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ProductList() {
  const [products, setProducts] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)

      setProducts(data ?? [])
    }
    loadProducts()
  }, [])

  return <div>{/* render products */}</div>
}
```

#### Server Action (Mutations)

```typescript
// app/actions/products.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createProduct(input: {
  name: string;
  price: number;
}): Promise<ActionResult> {
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Get user's organization (for slug generation)
  const { data: userProfile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    return { success: false, error: "User profile not found" };
  }

  // Role check (if needed)
  if (userProfile.role !== "owner") {
    return { success: false, error: "Permission denied" };
  }

  // Generate slug
  const baseSlug = slugify(input.name);
  const slug = generateUniqueSlug(baseSlug);

  // Insert (RLS auto-sets organization_id)
  const { error } = await supabase.from("products").insert({
    organization_id: userProfile.organization_id,
    name: input.name,
    slug,
    // ... other fields
  });

  if (error) {
    console.error("Product creation error:", error);
    return { success: false, error: error.message };
  }

  // Revalidate page cache
  revalidatePath("/inventory");

  return { success: true };
}
```

### 2. Form Pattern (React Hook Form + Zod)

#### Validation Schema

```typescript
// lib/validations/product.ts
import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  brand: z.string().optional(),
  category_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
```

#### Form Component

```typescript
// components/products/product-form.tsx
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
import { productCreateSchema, type ProductCreateInput } from '@/lib/validations/product'
import { createProduct } from '@/app/actions/products'

interface ProductFormProps {
  product?: {
    id: string
    name: string
    brand: string | null
    is_active: boolean | null
  }
  onSuccess?: () => void
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!product

  const form = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: product?.name ?? '',
      brand: product?.brand ?? '',
      is_active: product?.is_active ?? true,
    },
  })

  async function onSubmit(data: ProductCreateInput) {
    setIsLoading(true)

    try {
      const result = await createProduct(data)

      if (result.success) {
        toast.success('Product created')
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
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Vape Juice 30ml"
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
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="IQOS"
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
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Available for sale in POS
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

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### 3. Dialog Pattern (Create/Edit Modal)

```typescript
// components/products/create-product-dialog.tsx
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProductForm } from './product-form'

export function CreateProductDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="mr-2 size-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product in your inventory.
          </DialogDescription>
        </DialogHeader>
        <ProductForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

### 4. Page Component Pattern

```typescript
// app/(dashboard)/products/page.tsx
import { ProductList } from '@/components/products/product-list'
import { CreateProductDialog } from '@/components/products/create-product-dialog'
import { PageContainer } from '@/components/layouts/page-container'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProductsPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Role check (optional)
  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  // Fetch data
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <PageContainer
      title="Products"
      subtitle="Manage your product catalog and inventory."
      action={<CreateProductDialog />}
    >
      <ProductList products={products ?? []} />
    </PageContainer>
  )
}
```

### 5. List Component Pattern (Mobile + Desktop)

```typescript
// components/products/product-list.tsx
'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
import { deleteProduct } from '@/app/actions/products'
import { ProductForm } from './product-form'

interface Product {
  id: string
  name: string
  brand: string | null
  is_active: boolean | null
  created_at: string
}

interface ProductListProps {
  products: Product[]
}

export function ProductList({ products }: ProductListProps) {
  const router = useRouter()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setEditDialogOpen(true)
  }

  const handleDelete = (productId: string) => {
    setDeletingProductId(productId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingProductId) return

    setIsDeleting(true)

    try {
      const result = await deleteProduct(deletingProductId)

      if (result.success) {
        toast.success('Product deleted successfully')
        setDeleteDialogOpen(false)
        setDeletingProductId(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete product')
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
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-card">
          <p className="text-lg font-medium">No products yet</p>
          <p className="text-sm text-muted-foreground">
            Get started by creating your first product.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile cards */}
          <div className="space-y-4 md:hidden">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                    </div>
                    {product.brand && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.brand}
                      </p>
                    )}
                  </div>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 touch-target"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 touch-target text-destructive hover:text-destructive"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.brand || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSuccess={() => {
                setEditDialogOpen(false)
                setEditingProduct(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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

### 6. TanStack Query Pattern (NOT YET IMPLEMENTED)

**Note:** TanStack Query is installed but NOT yet configured. You'll need to set up the provider first.

#### Setup Provider (Required First Step)

```typescript
// app/providers.tsx (CREATE THIS FILE)
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

```typescript
// app/layout.tsx (UPDATE THIS FILE)
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
```

#### Query Hook Example

```typescript
// lib/hooks/useProducts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface UseProductsOptions {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export function useProducts(filters?: UseProductsOptions) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, product_categories(name)")
        .is("deleted_at", null);

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return data;
    },
  });
}
```

#### Mutation Hook Example

```typescript
// lib/hooks/useCreateProduct.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/app/actions/products";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
```

---

## Architecture Principles

### 1. Multi-Tenancy via RLS (Row-Level Security)

**CRITICAL:** All tenant isolation happens at the database level. Never add manual `WHERE organization_id = X` filters in application code.

#### How It Works

1. **JWT Claims:** User's `organization_id` is injected into JWT during sign-in
2. **RLS Policies:** Database automatically filters queries by `organization_id`
3. **Application Code:** Query normally—RLS handles filtering

#### Example

```sql
-- RLS Policy (already configured in migrations)
CREATE POLICY tenant_isolation_policy ON products
  FOR ALL
  USING (organization_id = get_user_organization_id());
```

```typescript
// Application code (RLS auto-filters)
const { data } = await supabase.from("products").select("*");
// Returns only current user's organization's products
```

### 2. Soft Deletes

Most tables use soft deletes (`deleted_at` column). Always filter by `IS NULL`:

```typescript
// CORRECT
const { data } = await supabase
  .from("products")
  .select("*")
  .is("deleted_at", null);

// WRONG (includes deleted records)
const { data } = await supabase.from("products").select("*");
```

### 3. Product-Variant Pattern

**CRITICAL:** All inventory and sales operations reference `product_variants`, NOT `products`.

- **products** table: Base product info (name, brand, category)
- **product_variants** table: SKUs, prices, stock (e.g., "30ml", "60ml")
- Even single-variant products require one variant entry

```typescript
// CORRECT: Reference variant in sales
const { data } = await supabase.rpc("process_transaction", {
  p_items: [{ variant_id: "uuid", quantity: 2, unit_price: 350 }],
});

// WRONG: Referencing product directly
// (products table has no price/stock)
```

### 4. Server Actions vs. API Routes

**Prefer Server Actions** for mutations:

- ✅ Server Actions: `'use server'` at top of file
- ❌ API Routes: Only for webhooks or third-party integrations

```typescript
// app/actions/products.ts
"use server";

export async function createProduct(data: ProductInput) {
  const supabase = await createClient();
  // ... implementation
}
```

### 5. Atomic Operations with RPCs

**Use PostgreSQL functions for complex transactions:**

```typescript
// CORRECT: Atomic sale + inventory update
const { data } = await supabase.rpc('process_transaction', {
  p_organization_id: orgId,
  p_branch_id: branchId,
  p_items: cartItems,
  p_payment_method: 'cash'
})

// WRONG: Separate queries (race conditions possible)
await supabase.from('transactions').insert(...)
await supabase.from('inventory').update(...)
```

---

## Component Inventory

### Available shadcn/ui Components

Located in `components/ui/`:

- **alert-dialog.tsx** - Confirmation dialogs
- **alert.tsx** - Alert messages
- **avatar.tsx** - User avatars
- **badge.tsx** - Status badges (green/red/gray)
- **button.tsx** - Buttons with variants (default, outline, ghost, destructive)
- **card.tsx** - Card containers
- **dialog.tsx** - Modal dialogs
- **dropdown-menu.tsx** - Dropdown menus
- **form.tsx** - React Hook Form integration
- **input.tsx** - Text inputs
- **label.tsx** - Form labels
- **navigation-menu.tsx** - Navigation menus
- **search-input.tsx** - Search input with icon
- **sheet.tsx** - Slide-out panels
- **sonner.tsx** - Toast notifications
- **switch.tsx** - Toggle switches
- **table.tsx** - Table components
- **textarea.tsx** - Multiline text inputs

### Adding New Components

```bash
# Use shadcn CLI to copy components (not npm install)
npx shadcn@latest add <component-name>

# Example: Add select dropdown
npx shadcn@latest add select
```

### Common Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link Style</Button>

<Button size="default">Normal</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

### Common Badge Variants

```tsx
<Badge variant="default">Active</Badge>     {/* Green */}
<Badge variant="secondary">Inactive</Badge> {/* Gray */}
<Badge variant="destructive">Error</Badge>  {/* Red */}
```

---

## Database Schema Reference

### Core Tables

#### organizations

```typescript
{
  id: UUID(PK);
  name: string;
  slug: string(unique);
  owner_email: string;
  subscription_status: "trial" | "active" | "past_due" | "cancelled";
  trial_ends_at: timestamp;
  deleted_at: timestamp | null;
}
```

#### users

```typescript
{
  id: UUID (PK, FK → auth.users)
  organization_id: UUID (FK → organizations)
  role: 'owner' | 'staff'
  full_name: string
  email: string | null
  pin: string | null (4-6 digits for staff)
  is_active: boolean
  can_manage_inventory: boolean
  can_view_profits: boolean
  can_view_reports: boolean
}
```

#### branches

```typescript
{
  id: UUID (PK)
  organization_id: UUID (FK → organizations)
  name: string
  slug: string
  address: string | null
  phone: string | null
  is_default: boolean
  is_active: boolean
}
```

#### products

```typescript
{
  id: UUID (PK)
  organization_id: UUID (FK → organizations)
  category_id: UUID | null (FK → product_categories)
  name: string
  brand: string | null
  description: string | null
  slug: string
  image_url: string | null
  is_active: boolean
  deleted_at: timestamp | null
}
```

#### product_variants

```typescript
{
  id: UUID (PK)
  organization_id: UUID (FK → organizations)
  product_id: UUID (FK → products)
  name: string (e.g., "30ml", "60ml")
  sku: string (unique)
  capital_cost: integer (in centavos, e.g., 15000 = ₱150.00)
  selling_price: integer (in centavos)
  low_stock_threshold: integer | null
  is_active: boolean
  deleted_at: timestamp | null
}
```

#### inventory

```typescript
{
  id: UUID (PK)
  organization_id: UUID (FK → organizations)
  branch_id: UUID (FK → branches)
  product_variant_id: UUID (FK → product_variants)
  quantity: integer
  last_counted_at: timestamp | null
}
```

#### product_categories

```typescript
{
  id: UUID (PK)
  organization_id: UUID (FK → organizations)
  parent_id: UUID | null (FK → product_categories, hierarchical)
  name: string
  slug: string
  description: string | null
  display_order: integer
  deleted_at: timestamp | null
}
```

### Query Examples

#### Fetch Products with Category and Variant Count

```typescript
const { data } = await supabase
  .from("products")
  .select(
    `
    *,
    product_categories (
      id,
      name
    ),
    product_variants (
      id
    )
  `,
  )
  .is("deleted_at", null)
  .order("created_at", { ascending: false });

// Access: data[0].product_categories.name
// Variant count: data[0].product_variants.length
```

#### Fetch Products with Inventory Stock

```typescript
const { data } = await supabase
  .from("products")
  .select(
    `
    *,
    product_variants!inner (
      id,
      name,
      sku,
      selling_price,
      inventory (
        branch_id,
        quantity
      )
    )
  `,
  )
  .is("deleted_at", null)
  .eq("product_variants.is_active", true)
  .eq("product_variants.inventory.branch_id", branchId);
```

---

## Implementation Checklist

### Phase 1: Setup

- [ ] Verify TanStack Query provider is configured (app/providers.tsx)
- [ ] Verify database types are up-to-date (types/database.ts)
- [ ] Verify Supabase client factories exist (lib/supabase/client.ts, server.ts)
- [ ] Check RLS policies are enabled on relevant tables (migrations/)
- [ ] Run `npm run dev` and verify no console errors

### Phase 2: Component Development

- [ ] Create validation schema in lib/validations/
- [ ] Create Server Action in app/actions/
- [ ] Create form component in components/<feature>/
- [ ] Create list component in components/<feature>/
- [ ] Create dialog wrapper in components/<feature>/
- [ ] Create page component in app/(dashboard)/<feature>/page.tsx

### Phase 3: Testing

- [ ] Test create operation (form validation, success toast, data refresh)
- [ ] Test edit operation (pre-fill form, update, refresh)
- [ ] Test delete operation (confirmation dialog, soft delete)
- [ ] Test search/filter (query updates, debouncing)
- [ ] Test mobile layout (cards, touch targets ≥44px)
- [ ] Test desktop layout (table, action buttons)
- [ ] Test with multiple organizations (RLS isolation)
- [ ] Test role-based access (owner vs staff)

### Phase 4: Polish

- [ ] Add loading states (skeleton, spinner)
- [ ] Add error states (empty state, error message)
- [ ] Add TypeScript types for all props
- [ ] Add comments for complex logic
- [ ] Run `npm run build` to verify TypeScript
- [ ] Run `npm run lint` to check code style

---

## Common Gotchas

### 1. **Don't Filter by organization_id Manually**

❌ **WRONG:**

```typescript
const { data } = await supabase
  .from("products")
  .select("*")
  .eq("organization_id", userOrgId); // UNNECESSARY!
```

✅ **CORRECT:**

```typescript
const { data } = await supabase.from("products").select("*");
// RLS auto-filters by organization_id
```

### 2. **Always Filter Soft Deletes**

❌ **WRONG:**

```typescript
const { data } = await supabase.from("products").select("*");
// Includes deleted records!
```

✅ **CORRECT:**

```typescript
const { data } = await supabase
  .from("products")
  .select("*")
  .is("deleted_at", null);
```

### 3. **Use Variants for Inventory/Sales**

❌ **WRONG:**

```typescript
// products table has no price/stock
const { data } = await supabase.from("products").select("price, stock"); // These don't exist!
```

✅ **CORRECT:**

```typescript
const { data } = await supabase
  .from("product_variants")
  .select("selling_price, inventory(quantity)");
```

### 4. **Use revalidatePath After Mutations**

❌ **WRONG:**

```typescript
// Server Action
export async function createProduct(data) {
  await supabase.from("products").insert(data);
  return { success: true };
  // Page doesn't refresh!
}
```

✅ **CORRECT:**

```typescript
import { revalidatePath } from "next/cache";

export async function createProduct(data) {
  await supabase.from("products").insert(data);
  revalidatePath("/products"); // ← Add this
  return { success: true };
}
```

### 5. **Price/Cost is in Centavos (Integers)**

❌ **WRONG:**

```typescript
const priceInPesos = 150.5; // Floating point!
await supabase.from("product_variants").insert({
  selling_price: priceInPesos, // WRONG!
});
```

✅ **CORRECT:**

```typescript
const priceInCentavos = 15050; // ₱150.50 → 15050 centavos
await supabase.from("product_variants").insert({
  selling_price: priceInCentavos,
});

// Display: ₱{(priceInCentavos / 100).toFixed(2)}
```

### 6. **Client vs Server Supabase Client**

❌ **WRONG:**

```typescript
// Server Component using client factory
import { createClient } from "@/lib/supabase/client"; // WRONG!

export default async function Page() {
  const supabase = createClient(); // Won't work in Server Component
}
```

✅ **CORRECT:**

```typescript
// Server Component using server factory
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient(); // Note: await
}
```

### 7. **Slugs Must Be Unique**

❌ **WRONG:**

```typescript
const slug = slugify(name) // May collide!
await supabase.from('products').insert({ slug, ... })
```

✅ **CORRECT:**

```typescript
const baseSlug = slugify(name)
const slug = generateUniqueSlug(baseSlug) // Adds random suffix
await supabase.from('products').insert({ slug, ... })
```

### 8. **Touch Targets on Mobile**

❌ **WRONG:**

```tsx
<Button size="icon">...</Button> // Too small on mobile
```

✅ **CORRECT:**

```tsx
<Button size="icon" className="min-h-[44px] min-w-[44px]">
  ...
</Button>
```

---

## Quick Reference

### Common Imports

```typescript
// Supabase
import { createClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

// Next.js
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { useRouter } from "next/navigation";

// React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// Utilities
import { cn } from "@/lib/utils";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

// Icons
import { Plus, Pencil, Trash2, Search } from "lucide-react";
```

### Essential Commands

```bash
# Development
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Add shadcn component
npx shadcn@latest add <component>

# Generate Supabase types (after schema changes)
npx supabase gen types typescript --project-id <ref> > types/database.ts
```

### File Naming Conventions

- **Pages:** `page.tsx` (Next.js convention)
- **Layouts:** `layout.tsx` (Next.js convention)
- **Components:** `component-name.tsx` (kebab-case)
- **Actions:** `entity-name.ts` (singular, e.g., `product.ts`)
- **Validations:** `entity-name.ts` (e.g., `product.ts`)
- **Hooks:** `useEntityName.ts` (camelCase, e.g., `useProducts.ts`)

---

## Additional Resources

- **Next.js 16 Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **TanStack Query Docs:** https://tanstack.com/query/latest
- **shadcn/ui Docs:** https://ui.shadcn.com
- **React Hook Form Docs:** https://react-hook-form.com
- **Zod Docs:** https://zod.dev

**Project-Specific Docs:**

- [docs/architecture/multi_tenancy.md](docs/architecture/multi_tenancy.md) - RLS patterns
- [docs/architecture/authentication.md](docs/architecture/authentication.md) - Auth flows
- [docs/database/functions.md](docs/database/functions.md) - RPC functions
- [docs/development/layout-system.md](docs/development/layout-system.md) - PageContainer patterns
- [docs/product/prd.md](docs/product/prd.md) - Product requirements

---

**End of Implementation Guide**
