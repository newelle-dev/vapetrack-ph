# Stock Management & Adjustments

**Branch:** `feat/stock-management`
**Description:** Implement inventory stock view page with color-coded levels, quick stock adjustments via a Postgres RPC function, and stock movement history.

## Goal
Enable shop owners and staff to view current stock levels grouped by product, quickly adjust stock up/down with full audit trail via `stock_movements`, and browse stock movement history. This is critical for daily shop operations — knowing what's in stock, restocking, and having an immutable audit trail of all inventory changes.

## Implementation Steps

### Step 1: Database — Create `adjust_stock` Postgres Function
**Files:**
- `migrations/004_stock_functions.sql` (new)

**What:** Create a Postgres function `adjust_stock(p_variant_id, p_branch_id, p_quantity, p_movement_type, p_reason, p_user_id)` that atomically:
1. Reads current `inventory.quantity` (with `FOR UPDATE` row lock)
2. Validates the new quantity won't go below 0
3. Updates `inventory.quantity`
4. Inserts a `stock_movements` audit record with `quantity_before`, `quantity_after`, `quantity_change`
5. Returns the new quantity

Also adds RLS-compatible INSERT policies on `stock_movements` and an UPDATE policy on `inventory` scoped to the RPC function via `SECURITY DEFINER`.

**Key Design Decisions:**
- Use `SECURITY DEFINER` so the function can bypass the intentionally missing UPDATE/INSERT policies on `inventory`/`stock_movements`
- Use `SELECT ... FOR UPDATE` to prevent race conditions on concurrent stock adjustments
- `movement_type` accepts: `'stock_in'`, `'stock_out'`, `'adjustment'` (the roadmap's schema already defines these)
- The function raises an exception if stock would go negative

**Testing:**
- Apply migration to Supabase project
- Verify via SQL: call `adjust_stock()` with valid params → inventory updated, movement created
- Verify negative stock is rejected with clear error

---

### Step 2: Server Action & Validation — `adjustStock()` + Types
**Files:**
- `app/actions/inventory.ts` (new)
- `lib/validations/inventory.ts` (new)
- `types/index.ts` (update — add inventory-related types)

**What:** Create the server action `adjustStock()` that:
1. Authenticates the user via existing `getAuthContext()` pattern
2. Validates input with Zod schema (variant_id, branch_id, quantity > 0, movement_type, reason)
3. Calls `supabase.rpc('adjust_stock', { ... })`
4. Revalidates `/inventory/stock` path
5. Returns `ActionResult` with success/error

Also add a `getInventoryWithProducts(branchId?: string)` server action that:
- If **no branchId** (default "All Branches"): fetches all inventory records, then **aggregates quantities across branches** per variant (SUM). This gives a total stock count per variant across the entire organization.
- If **branchId provided**: fetches inventory filtered to that specific branch.
- Joins with `product_variants` → `products` for display names, SKUs, and `low_stock_threshold`.
- Groups results by product.

Also add a `getBranches()` helper to fetch all active branches for the branch filter dropdown.

Add new types to `types/index.ts`:
- `InventoryItem` — variant name, SKU, product name, low_stock_threshold, quantity (aggregated or per-branch), branch_id (null if aggregated)
- `StockGroupedByProduct` — product with its variants' inventory data
- `StockAdjustmentInput` — Zod inferred type

**Testing:**
- Import and call `adjustStock()` action → verify it updates DB and creates audit record
- Verify validation rejects invalid inputs (negative quantity, missing fields)

---

### Step 3: Stock View Page — Inventory Overview with Color-Coded Levels
**Files:**
- `app/(dashboard)/inventory/stock/page.tsx` (new — Server Component)
- `components/inventory/stock-list-client.tsx` (new — Client Component)
- `components/inventory/stock-product-group.tsx` (new)
- `components/inventory/stock-variant-row.tsx` (new)
- `components/inventory/stock-adjustment-dialog.tsx` (new)

**What:** Build the stock management page:
1. **Server Component** (`page.tsx`): Fetches inventory data via `getInventoryWithProducts()` and branches list for the filter. Passes to client component. Includes `PageContainer` with title "Stock Levels".
2. **Client Component** (`stock-list-client.tsx`): Renders the grouped inventory list, handles search filtering, branch filter dropdown, and manages dialog state for stock adjustments.
3. **Product Group** (`stock-product-group.tsx`): Collapsible card showing product name, brand, and total stock summary. Contains variant rows.
4. **Variant Row** (`stock-variant-row.tsx`): Shows variant name, SKU, current quantity with color-coded badge:
   - 🟢 **Green**: quantity > low_stock_threshold (sufficient)
   - 🟡 **Yellow**: 0 < quantity ≤ low_stock_threshold (low)
   - 🔴 **Red**: quantity = 0 (out of stock)
   - Inline "+" and "−" buttons for quick adjustment
5. **Adjustment Dialog** (`stock-adjustment-dialog.tsx`): Modal with:
   - **Branch selector** (required — user must pick which branch to adjust since stock is per-branch)
   - Quantity input field
   - Movement type selector (Add Stock / Remove Stock)
   - Reason text field
   - Submit calls `adjustStock()` server action
   - Shows toast on success/error

**Branch Filter Behavior:**
- **Default: "All Branches"** — Shows aggregated (summed) stock across all branches per variant. Gives an organization-wide overview.
- **Specific branch selected** — Shows stock for that branch only.
- When adjusting stock (via +/− buttons), the dialog always requires selecting a specific branch, even when in "All Branches" view. If a specific branch is already selected in the filter, it is pre-filled in the dialog.

**UI/UX Details:**
- Mobile-first: Stacked card layout, full-width variant rows
- Desktop: Wider cards with inline stock badges
- Branch filter: Dropdown at top of page ("All Branches" + list of branches)
- Search bar to filter by product name or SKU
- Summary stats at top: Total Products, Low Stock Count, Out of Stock Count
- Empty state if no inventory records exist

**Testing:**
- Navigate to `/inventory/stock` → see all products grouped with variants and stock levels
- Color badges match stock levels (green/yellow/red)
- Click "+" on a variant → dialog opens with "Add Stock" pre-selected
- Submit adjustment → stock level updates, toast shows success
- Try to remove more than available → error toast "Insufficient stock"
- Search filters products in real-time

---

### Step 4: Stock Movement History Page
**Files:**
- `app/(dashboard)/inventory/history/page.tsx` (new — Server Component)
- `components/inventory/stock-history-client.tsx` (new — Client Component)
- `components/inventory/stock-history-filters.tsx` (new)
- `lib/hooks/useStockHistory.ts` (new — TanStack Query hook)

**What:** Build the stock movement history page:
1. **Server Component** (`page.tsx`): Simple shell with `PageContainer` title "Stock History".
2. **Client Component** (`stock-history-client.tsx`): Fetches stock movements via TanStack Query hook, displays in a table/card list.
3. **Filters** (`stock-history-filters.tsx`): Filter by date range, product/variant, movement type.
4. **Hook** (`useStockHistory.ts`): TanStack Query hook that queries `stock_movements` with joins to `product_variants` and `users` for display names.

**Table/List columns:**
- Date/Time (formatted relative + absolute)
- Product → Variant (name + SKU)
- Type (badge: stock_in=green, stock_out=red, adjustment=yellow, sale=blue)
- Change (+/- quantity)
- Before → After
- User (who made the change)
- Notes/Reason

**Testing:**
- Navigate to `/inventory/history` → see all stock movements
- Filter by date range → correct results
- Filter by movement type → correct filtering
- Recent adjustments from Step 3 appear in history
- Mobile responsive (card view on small screens)
