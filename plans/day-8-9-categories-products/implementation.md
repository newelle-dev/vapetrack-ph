# Day 8-9: Product Categories & Base Products — Gap Closure

## Goal
Close remaining quality gaps in the existing category CRUD and product list implementation so Sprint 2 Day 8-9 items can be confidently marked as complete.

## Prerequisites
Make sure that the user is currently on the `feat/day-8-9-categories-products-polish` branch before beginning implementation.
If not, move them to the correct branch. If the branch does not exist, create it from main.

---

### Step-by-Step Instructions

#### Step 1: Fix Validation Schema & Category List Empty State

This step fixes two bugs:
1. **Validation schema mismatch** — `description` and `display_order` are required in the Zod schema but optional/nullable in the DB. This causes form submission issues when description is empty.
2. **Missing `colSpan`** — The empty state `<TableCell>` doesn't span all 4 columns, creating a visual glitch.

- [x] Open `lib/validations/category.ts` and replace the entire file with the code below:

```typescript
import { z } from "zod";

export const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional().or(z.literal("")),
    parent_id: z.string().uuid().nullable().optional(),
    display_order: z.number().int().optional().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
```

- [x] Open `components/categories/category-list.tsx` and find line 71 (the empty state `<TableCell>`). Add `colSpan={4}` to the cell. Replace this:

```tsx
                            <TableCell className="text-center h-24 text-muted-foreground">
```

with this:

```tsx
                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
```

##### Step 1 Verification Checklist
- [ ] No build errors (`npm run dev` hot-reloads without issues)
- [ ] Navigate to `/inventory/categories`
- [ ] Click "Add Category", leave the description field empty, enter only a name → form submits successfully without validation errors
- [ ] Edit an existing category, clear the description field → saves successfully
- [ ] Delete all categories (or search for a term with no results) → "No categories found" message spans the full table width across all 4 columns

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 2: Add Server-Side Pagination to Categories Page

The categories page currently shows "Page X of Y" text but has no clickable navigation buttons. Since this is a server-rendered page, we'll use `<Link>` components with URL search params for pagination instead of the client-side `PaginationControls` component (which requires `onPageChange` state).

- [x] Open `app/(dashboard)/inventory/categories/page.tsx` and replace the **entire file** with the code below:

```tsx
import { Suspense } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryForm } from "@/components/categories/category-form";
import { getCategories } from "@/app/actions/categories";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layouts/page-container";

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
    const { data, metadata: paginationMeta } = await getCategories(query, page);

    const totalPages = paginationMeta.totalPages;
    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    // Helper to build pagination URLs preserving search query
    function buildPageUrl(targetPage: number) {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (targetPage > 1) params.set("page", String(targetPage));
        const qs = params.toString();
        return `/inventory/categories${qs ? `?${qs}` : ""}`;
    }

    // Calculate visible page numbers (up to 5)
    function getPageNumbers() {
        const maxVisible = 5;
        const pages: number[] = [];
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (page <= 3) {
            for (let i = 1; i <= maxVisible; i++) pages.push(i);
        } else if (page >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
        } else {
            for (let i = page - 2; i <= page + 2; i++) pages.push(i);
        }
        return pages;
    }

    return (
        <PageContainer
            title="Product Categories"
            action={
                <CategoryForm
                    trigger={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    }
                />
            }
        >
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

            {/* Server-Side Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 py-4">
                    {/* Page Info */}
                    <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1">
                        {/* First Page */}
                        {canGoPrevious ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={buildPageUrl(1)} aria-label="Go to first page">
                                    <ChevronsLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" disabled aria-label="Go to first page">
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Previous Page */}
                        {canGoPrevious ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={buildPageUrl(page - 1)} aria-label="Go to previous page">
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" disabled aria-label="Go to previous page">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Page Numbers (hidden on small screens) */}
                        <div className="hidden sm:flex items-center gap-1 mx-2">
                            {getPageNumbers().map((pageNum) => (
                                <Button
                                    key={pageNum}
                                    variant={pageNum === page ? "default" : "outline"}
                                    size="sm"
                                    className="min-w-[36px]"
                                    asChild={pageNum !== page}
                                >
                                    {pageNum === page ? (
                                        <span>{pageNum}</span>
                                    ) : (
                                        <Link href={buildPageUrl(pageNum)}>
                                            {pageNum}
                                        </Link>
                                    )}
                                </Button>
                            ))}
                        </div>

                        {/* Next Page */}
                        {canGoNext ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={buildPageUrl(page + 1)} aria-label="Go to next page">
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" disabled aria-label="Go to next page">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Last Page */}
                        {canGoNext ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={buildPageUrl(totalPages)} aria-label="Go to last page">
                                    <ChevronsRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" disabled aria-label="Go to last page">
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
```

**Key changes explained:**
- Renamed the destructured `metadata` from `getCategories()` to `paginationMeta` to avoid conflict with the Next.js `export const metadata`.
- Replaced the "Page X of Y" text-only display with full pagination controls using `<Link>` components and `<Button asChild>` for server-side navigation.
- Pagination buttons mirror the same visual style as the existing `PaginationControls` component (first/prev/page numbers/next/last) but use URL-based navigation instead of `onClick` state.
- Search query (`q`) is preserved across pagination links.

##### Step 2 Verification Checklist
- [ ] No build errors
- [ ] Navigate to `/inventory/categories`
- [ ] If there are fewer than 11 categories, pagination controls should NOT appear (hidden when only 1 page)
- [ ] Add 11+ categories → pagination controls appear with "Page 1 of 2"
- [ ] Click the "Next" chevron → URL updates to `?page=2`, page 2 loads with correct categories
- [ ] Click the "Previous" chevron → returns to page 1
- [ ] Click a page number button → navigates to that page
- [ ] First/Last page buttons work correctly
- [ ] Search for a term + pagination works together (e.g., `?q=liquid&page=2`)
- [ ] On mobile, page number buttons are hidden but prev/next chevrons still appear
- [ ] Disabled state: Previous/First buttons are disabled on page 1, Next/Last buttons are disabled on last page

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 3: Update Roadmap Checklist

Mark all Day 8-9 items in `docs/product/roadmap.md` as completed since all deliverables are now functional.

- [x] Open `docs/product/roadmap.md`
- [x] Find the **"Day 8-9: Product Categories & Base Products"** section (around lines 401-444)
- [x] Replace all `[ ]` checkboxes with `[x]` in that section. Specifically, replace:

**Tasks — Day 8 (lines ~407-415):**
```markdown
1. [ ] Create product category management:
```
→
```markdown
1. [x] Create product category management:
```

```markdown
3. [ ] Create Server Actions:
```
→
```markdown
3. [x] Create Server Actions:
```

```markdown
4. [ ] Implement category list with search/filter
```
→
```markdown
4. [x] Implement category list with search/filter
```

**Tasks — Day 9 (lines ~419-428):**
```markdown
1. [ ] Create product list page:
```
→
```markdown
1. [x] Create product list page:
```

```markdown
2. [ ] Add TanStack Query hooks:
```
→
```markdown
2. [x] Add TanStack Query hooks:
```

**Deliverables (lines ~432-434):**
```markdown
- [ ] Category CRUD functional
- [ ] Product list with search/filter
- [ ] TanStack Query caching working
```
→
```markdown
- [x] Category CRUD functional
- [x] Product list with search/filter
- [x] TanStack Query caching working
```

**Definition of Done (lines ~438-443):**
```markdown
- [ ] Can create/edit/delete categories
- [ ] Product list loads and displays correctly
- [ ] Search filters products by name/SKU
- [ ] Category filter works
- [ ] Loading states show spinner/skeleton
- [ ] Mobile-optimized (table scrolls horizontally if needed)
```
→
```markdown
- [x] Can create/edit/delete categories
- [x] Product list loads and displays correctly
- [x] Search filters products by name/SKU
- [x] Category filter works
- [x] Loading states show spinner/skeleton
- [x] Mobile-optimized (table scrolls horizontally if needed)
```

- [x] Also update the **Sprint 2 status** in the Implementation Status table (around line 20):

```markdown
| **Sprint 2: Inventory Management** | ⏸️ Not Started   | 0%         |
```
→
```markdown
| **Sprint 2: Inventory Management** | 🔄 In Progress   | 30%        |
```

##### Step 3 Verification Checklist
- [ ] Open `docs/product/roadmap.md` and visually confirm all Day 8-9 checkboxes show `[x]`
- [ ] Sprint 2 row in the status table shows "In Progress" at 30%
- [ ] No formatting issues in the markdown file

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
