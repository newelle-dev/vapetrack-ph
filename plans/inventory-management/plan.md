# Inventory Management Page

**Branch:** `feature/inventory-management-page`
**Description:** Implement product inventory page with search, filtering, and TanStack Query integration

## Goal

Create a fully functional inventory management page that displays products with their variants, categories, and stock information. Users can search by name/SKU, filter by category and active status, and view products in a mobile-optimized responsive layout. This feature establishes the TanStack Query infrastructure for real-time data fetching throughout the application.

## Research Summary

### Key Findings

- **TanStack Query NOT yet configured** - Requires provider setup in root layout
- **Existing inventory page has placeholder/mock data** - Needs complete replacement
- **RLS handles multi-tenancy automatically** - No manual organization_id filters needed
- **Products table has soft deletes** - Filter by `deleted_at IS NULL`
- **Product-Variant relationship** - Products can have multiple variants; all operations reference variants
- **Full-text search index exists** - GIN index on products.name for efficient searching
- **Mobile-first design required** - Responsive card layout (mobile) → table (desktop)

### Database Schema

```typescript
products {
  id: UUID
  name: string
  brand: string | null
  category_id: UUID | null (FK → product_categories)
  is_active: boolean (default: true)
  slug: string
  organization_id: UUID (multi-tenant isolation)
  deleted_at: string | null (soft delete)
  created_at, updated_at
}

product_variants {
  id: UUID
  product_id: UUID (FK → products)
  name: string (e.g., "3mg", "30ml")
  sku: string (unique SKU code)
  is_active: boolean
  ... (pricing, stock)
}

product_categories {
  id: UUID
  name: string
  parent_id: UUID | null (hierarchical)
  deleted_at: string | null
}
```

### Query Pattern for Inventory Page

```sql
SELECT
  products.*,
  product_categories.name as category_name,
  COUNT(product_variants.id) as variant_count
FROM products
LEFT JOIN product_categories ON products.category_id = product_categories.id
LEFT JOIN product_variants ON products.id = product_variants.product_id
  AND product_variants.is_active = true
  AND product_variants.deleted_at IS NULL
WHERE products.deleted_at IS NULL
GROUP BY products.id, product_categories.id
```

## Implementation Steps

### Step 1: TanStack Query Provider Setup

**Files:**

- `app/providers.tsx` (create new)
- `app/layout.tsx` (modify)

**What:**
Set up TanStack Query's `QueryClientProvider` at the root layout level to enable data fetching hooks throughout the application. Configure retry logic (3 retries with exponential backoff) for Philippines network resilience and set 1-minute stale time for optimal caching.

**Implementation Details:**

1. Create `app/providers.tsx`:
   - Export `Providers` client component
   - Initialize QueryClient with network-resilient defaults
   - Wrap children with QueryClientProvider
2. Update `app/layout.tsx`:
   - Import and wrap `{children}` with `<Providers>`
   - Maintain existing metadata and font configuration

**Testing:**

- Run `npm run dev` - verify no errors
- Check browser console for QueryClient initialization
- Navigate to any dashboard page - should render without errors

---

### Step 2: Product Data Fetching Hooks

**Files:**

- `lib/hooks/useProducts.ts` (create new)
- `types/index.ts` (create new - for shared TypeScript types)

**What:**
Create TanStack Query hooks for fetching products with filtering capabilities (search, category, active status). Implement `useProducts()` for list view with filters and `useProductById()` for single product details. Use Supabase client-side instance with proper query key management for caching.

**Implementation Details:**

1. Create `lib/hooks/useProducts.ts`:

   ```typescript
   // useProducts(filters?) - Returns products with variant counts
   // Filters: {
   //   search?: string,
   //   categoryId?: string,
   //   isActive?: boolean,
   //   page?: number,      // Page number (1-indexed)
   //   pageSize?: number   // Items per page (default: 25)
   // }
   // Returns: { data, total, pageCount, isLoading, error }
   // Query includes: category name, variant count aggregate

   // useProductById(id) - Returns single product with all variants
   // Includes: category details, all variants with pricing
   ```

2. Create `types/index.ts`:
   ```typescript
   // Export shared types not in database.ts
   // ProductWithCategory, ProductWithVariants, FilterOptions
   ```

**Query Key Strategy:**

- `['products', filters]` - List with filters (includes page number for caching)
- `['products', productId]` - Single product detail

**Pagination Implementation:**

- Use Supabase `range()` for offset pagination: `.range(start, end)`
- Calculate: `start = (page - 1) * pageSize`, `end = start + pageSize - 1`
- Use `count: 'exact'` option to get total count for page calculation
- Return both data and metadata: `{ data, total, pageCount }`

**Error Handling:**

- Throw errors from queryFn to trigger React Query error states
- Let components handle error display with toast notifications

**Testing:**

- Create test page/component that uses hooks
- Verify query keys update correctly when filters change
- Test with missing/invalid product ID
- Check that RLS filters by organization automatically

---

### Step 3: Inventory Page Implementation

**Files:**

- `app/(dashboard)/inventory/page.tsx` (replace existing)
- `components/inventory/product-table.tsx` (create new)
- `components/inventory/product-filters.tsx` (create new)
- `components/inventory/product-card.tsx` (create new)
- `components/inventory/product-details-dialog.tsx` (create new)
- `components/inventory/create-product-dialog.tsx` (create new)

**What:**
Build the complete inventory management page with responsive layout, search functionality, category/status filters, pagination (25 items/page), and product display. Use hybrid approach: Server Component for initial data load, Client Components with TanStack Query for interactive filtering. Display products in mobile-optimized cards (≤768px) and desktop table (>768px). Clicking any product opens a details dialog modal.

**Implementation Details:**

1. **`app/(dashboard)/inventory/page.tsx`** (Server Component):
   - Fetch initial products server-side for SEO/performance
   - Fetch categories for filter dropdown
   - Pass to Client Component as props
   - Use PageContainer for consistent layout
   - Add "Create Product" button in action slot (opens dialog modal)

2. **`components/inventory/product-filters.tsx`** (Client Component):
   - SearchInput for name/SKU search (debounced 300ms)
   - Category dropdown (DropdownMenu from shadcn/ui)
   - Active status toggle (Switch component)
   - "Clear Filters" button
   - Emit filter changes to parent via callbacks

3. **`components/inventory/product-table.tsx`** (Client Component):
   - Desktop table view (hidden on mobile: `hidden md:table`)
   - Columns: Name, Brand, Category, Variants, Status, Actions
   - Status: Badge component (green=active, gray=inactive)
   - Actions: View details button (opens dialog modal)
   - Default sorting: Created Date (newest first)
   - Pagination: 25 items per page with page controls
   - Empty state when no products match filters

4. **`components/inventory/product-card.tsx`** (Client Component):
   - Mobile card view (visible on mobile: `md:hidden`)
   - Display: Product name, brand, category badge, variant count
   - Status indicator (colored dot or badge)
   - Tap to open details dialog (full card is touch target)
   - Grid layout (1 column mobile, 2 columns tablet)

5. **`components/inventory/product-details-dialog.tsx`** (Client Component):
   - Modal dialog showing full product information
   - Display: All product fields, variants list, category details
   - Close button (X) and backdrop click to dismiss
   - Future: Add edit mode toggle for inline editing

**Data Flow:**

```
Server Component (page.tsx)
  ↓ (initial props)
Client Component (ProductList wrapper)
  ↓ (uses useProducts hook with filters)
ProductFilters + ProductTable/ProductCard
  ↓ (display data)
```

**Search Pattern:**

- Real-time search as user types (debounced)
- Searches both `products.name` and `product_variants.sku`
- Use `ilike` for case-insensitive matching: `%${searchTerm}%`

**Filter Pattern:**

- Category: Exact match on `category_id`
- Active status: Toggle between `true`, `false`, or `undefined` (all)
- Combine filters with AND logic

**Responsive Breakpoints:**

- Mobile (<768px): Card grid layout
- Desktop (≥768px): Table layout
- Touch targets: Minimum 44×44px for all interactive elements

**Testing:**

- Verify products display correctly on both mobile and desktop
- Test search functionality with product names and SKU codes
- Test category filter with multiple categories
- Test active status toggle (all/active/inactive)
- Test pagination controls (next/prev, page jump)
- Verify 25 items per page limit is enforced
- Test sorting by created date (newest first)
- Test product details dialog opens/closes correctly
- Verify RLS isolation by testing with different organizations
- Test empty states (no products, no search results, filtered out)
- Test loading states during data fetching and pagination

---

## Design Decisions (Confirmed)

1. **Create Product Action:** ✅
   - Opens dialog/modal for product creation form
   - Keeps user on same page for better UX

2. **Table Sorting:** ✅
   - Default sort: Created Date (newest first)
   - Shows most recently added products at top

3. **Pagination:** ✅
   - Implement server-side pagination
   - Page size: 25 items per page
   - Use offset pagination with page controls

4. **View/Edit Actions:** ✅
   - Clicking product opens details dialog
   - Modal shows full product information
   - No navigation away from inventory page
   - Future: Add edit mode within dialog

5. **Display Preferences:**
   - Responsive-only (no manual toggle)
   - Mobile: Card grid layout
   - Desktop: Table layout
   - Filter state in component state (no URL persistence for MVP)

## Technical Decisions

### Why TanStack Query?

- Real-time filtering without full page reloads
- Built-in caching reduces unnecessary API calls
- Retry logic improves reliability on slow Philippine networks
- Establishes pattern for future features (POS, reports, etc.)

### Why Hybrid Server/Client Approach?

- Server Component provides initial data (SEO, faster first paint)
- Client Component enables interactive filtering without page refresh
- Balances performance with user experience

### Why Separate Table/Card Components?

- Cleaner code separation for different layouts
- Easier to maintain mobile vs desktop experiences
- Can be independently tested and optimized

### Query Design Rationale

- Aggregating variant count at database level (more efficient than client-side)
- LEFT JOIN ensures products without variants still display
- Filtering `deleted_at IS NULL` at query level (not application layer)
- RLS policies handle `organization_id` filtering automatically

## Performance Considerations

- **Search debouncing (300ms):** Prevents excessive API calls during typing
- **Query caching (1 minute stale time):** Reduces database load for repeated views
- **Indexed queries:** Full-text GIN index exists on `products.name`
- **Minimal data fetching:** Only fetch columns needed for list view
- **Pagination (25 items/page):** Limits result set size and improves query speed
- **Efficient aggregation:** Variant counting done at database level (not client-side)

## Security Considerations

- **RLS enforcement:** All queries automatically filtered by `organization_id`
- **Client-side validation:** Validate filter inputs before passing to query function
- **No sensitive data exposure:** Product details appropriate for all staff roles
- **Permission checks (future):** Check `can_manage_inventory` flag for edit/delete actions

## Future Enhancements (Out of Scope)

- Bulk product import/export (CSV)
- Barcode scanning for quick search
- Product analytics (sales trends, low stock alerts)
- Advanced filtering (price range, stock levels)
- Product images optimization (WebP/AVIF formats)
- Offline mode with service worker caching
