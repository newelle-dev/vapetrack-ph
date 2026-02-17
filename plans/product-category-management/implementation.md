# Product Category Management

## Goal
Enable users to manage product categories (create, read, update, delete) to organize their inventory, including soft-delete functionality for data safety.

## Prerequisites
- User must be on the `feat/product-category-management` branch.
- Supabase project must be initialized.

### Step-by-Step Instructions

#### Step 1: Database Migration
- [x] Create a new migration file to add the `deleted_at` column to the `product_categories` table.
- [x] Copy and paste code below into `migrations/002_add_soft_delete_to_categories.sql`:

```sql
-- Migration: Add deleted_at to product_categories for soft delete support
-- Description: Adds nullable deleted_at timestamp column
-- UP
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON product_categories(deleted_at) WHERE deleted_at IS NOT NULL;
```

##### Step 1 Verification Checklist
- [x] Run the migration (e.g., via supabase migration up or manually in SQL editor).
- [x] Verify the column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'product_categories' AND column_name = 'deleted_at';`

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 2: Validation Schema
- [x] Create the Zod schema for category validation.
- [x] Copy and paste code below into `lib/validations/category.ts`:

```typescript
import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  display_order: z.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
```

##### Step 2 Verification Checklist
- [x] No type errors in the file.

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 3: Server Actions (CRUD)
- [x] Implement server actions for category management.
- [x] Copy and paste code below into `app/actions/categories.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function getCategories(
  query?: string,
  page: number = 1,
  pageSize: number = 10
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) throw new Error("Organization not found");

  let dbQuery = supabase
    .from("product_categories")
    .select("*", { count: "exact" })
    .eq("organization_id", userData.organization_id)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await dbQuery.range(from, to);

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }

  return {
    data,
    metadata: {
      total: count || 0,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
    },
  };
}

export async function createCategory(data: CategoryInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userData) return { success: false, error: "User not found" };

    // Generate Slug
    const baseSlug = slugify(parsed.data.name);
    const slug = generateUniqueSlug(baseSlug); 

    const { error } = await supabase.from("product_categories").insert({
      organization_id: userData.organization_id,
      name: parsed.data.name,
      slug: slug, 
      description: parsed.data.description,
      parent_id: parsed.data.parent_id,
      display_order: parsed.data.display_order,
    });

    if (error) throw error;

    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Create category error:", error);
    return { success: false, error: error.message || "Failed to create category" };
  }
}

export async function updateCategory(id: string, data: CategoryInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const { error } = await supabase
      .from("product_categories")
      .update({
        name: parsed.data.name,
        description: parsed.data.description,
        parent_id: parsed.data.parent_id,
        display_order: parsed.data.display_order,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Update category error:", error);
    return { success: false, error: error.message || "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Soft delete
    const { error } = await supabase
      .from("product_categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Delete category error:", error);
    return { success: false, error: error.message || "Failed to delete category" };
  }
}
```

##### Step 3 Verification Checklist
- [x] Check for import errors (ensure `slugify` utils exist or create them if needed).
- [x] If `slugify` utility is missing in `lib/utils/slugify.ts`, create it.

*Note: `slugify.ts` already exists and is compatible.*
- [x] Check if `lib/utils/slugify.ts` exists.

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 4: UI Components - Form and List
- [x] Ensure required UI components exist.
- [x] Check if `components/ui/textarea.tsx` exists. If not, create it.
- [x] Create the Category Form Component using Shadcn/UI Dialog and Form.
- [x] Copy and paste code below into `components/categories/category-form.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/app/actions/categories";
import { useState } from "react";

interface CategoryFormProps {
  initialData?: CategoryInput & { id: string };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CategoryForm({
  initialData,
  open,
  onOpenChange,
  trigger,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);

  // Control dialog state either externally or internally
  const isDialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      display_order: initialData?.display_order || 0,
      parent_id: initialData?.parent_id || null,
    },
  });

  function onSubmit(data: CategoryInput) {
    startTransition(async () => {
      try {
        const result = initialData
          ? await updateCategory(initialData.id, data)
          : await createCategory(data);

        if (result.success) {
          toast.success(
            initialData ? "Category updated" : "Category created"
          );
          setDialogOpen(false);
          if (!initialData) form.reset();
        } else {
          toast.error(result.error || "Something went wrong");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E-Liquids" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Category description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [x] Create the Category List Component (Table).
- [x] Copy and paste code below into `components/categories/category-list.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryForm } from "./category-form";
import { deleteCategory } from "@/app/actions/categories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  parent_id: string | null;
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        toast.success("Category deleted");
      } else {
        toast.error(result.error || "Failed to delete");
      }
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.display_order}</TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description || "-"}</TableCell>
                <TableCell className="flex gap-2">
                  <CategoryForm
                    initialData={category}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the category from the active list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category.id)}
                          disabled={isPending}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

##### Step 4 Verification Checklist
- [x] No build errors.
- [x] Components import correctly.

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 5: Main Page Implementation
- [x] Implement the main categories page with search and data fetching.
- [x] Copy and paste code below into `app/(dashboard)/inventory/categories/page.tsx`:

```tsx
import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { redirect } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryForm } from "@/components/categories/category-form";
import { getCategories } from "@/app/actions/categories";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Categories - VapeTrack PH",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";
  const page = Number(resolvedSearchParams.page) || 1;
  const { data, metadata } = await getCategories(query, page);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Product Categories</h2>
        <div className="flex items-center space-x-2">
          <CategoryForm 
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            }
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <form className="flex-1 max-w-sm flex items-center gap-2">
           <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search categories..."
              defaultValue={query}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <Suspense fallback={<div>Loading categories...</div>}>
         <CategoryList categories={data || []} />
      </Suspense>

       {/* Pagination Controls Placeholder */}
       <div className="flex items-center justify-end space-x-2 py-4">
        {metadata.totalPages > 1 && (
           <div className="text-sm text-muted-foreground">
             Page {metadata.page} of {metadata.totalPages}
           </div>
        )}
      </div>
    </div>
  );
}
```

##### Step 5 Verification Checklist
- [x] UI loads correctly at `/inventory/categories`.
- [x] "Add Category" button opens modal.
- [x] Creating a category adds it to the list.
- [x] Searching filters the list.
- [x] Soft deletion removes from list.

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
