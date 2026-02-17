# Product Category Management

**Branch:** `feat/product-category-management`
**Description:** Implement full CRUD for product categories including soft delete and search/filter functionality.

## Goal
Enable users to manage product categories (create, read, update, delete) to organize their inventory. This includes adding a soft-delete mechanism for data safety and a searchable list view for better UX since products are at the core of the business.

## Implementation Steps

### Step 1: Database Migration
**Files:** `migrations/002_add_soft_delete_to_categories.sql`
**What:** Add `deleted_at` column to `product_categories` table to support soft delete. Update RLS policies if necessary to exclude soft-deleted records by default.
**Testing:** Verify the column exists in the database and RLS policies filter out deleted records.

### Step 2: Validation Schema
**Files:** `lib/validations/category.ts`
**What:** Create Zod schema for category creation and updates.
- `CategorySchema`: name (min 2), description (optional).
**Testing:** Verify validation logic with unit tests or manual testing in the next steps.

### Step 3: Server Actions (CRUD)
**Files:** `app/actions/categories.ts`
**What:** Implement server actions for:
- `getCategories(query, page)`: Fetch categories with search and pagination, filtering out soft-deleted records.
- `createCategory(data)`: Create a new category.
- `updateCategory(id, data)`: Update category details.
- `deleteCategory(id)`: Soft delete a category (set `deleted_at` to current timestamp).
- Ensure role-based access control (check if user is allowed).
**Testing:** invoke actions manually or via a temporary test page to verify DB operations.

### Step 4: Category UI Components
**Files:**
- `app/(dashboard)/inventory/categories/page.tsx`
- `components/categories/category-form.tsx` (or similar for add/edit modal)
- `components/categories/category-list.tsx` (table view)
**What:**
- Create the main page layout with search bar.
- Implement `CategoryList` with search input (updating URL params) and pagination if needed.
- Implement `CategoryForm` dialog using `react-hook-form` + `zod` + `sonner` for feedback.
- Implement delete confirmation dialog.
**Testing:** Navigate to `/inventory/categories`, test creating, searching, updating, and deleting categories. Verify "soft deleted" items disappear from the list but remain in DB.
