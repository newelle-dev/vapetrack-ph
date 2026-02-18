# Day 15: POS UI & Cart State

**Branch:** `feat/day-15-pos-cart-zustand`
**Description:** Refactor POS to use Zustand cart, real product data, branch selector, and responsive split-view layout.

## Goal
Replace the hardcoded prototype POS page with a production-ready POS interface that uses a Zustand cart store, fetches real product/variant data from the database (filtered by selected branch), and implements a responsive layout with a split-view for tablet/desktop while keeping the mobile-first bottom-sheet cart experience.

## Design Decisions
- **Profit visibility:** Owner-only (check `userRole === 'owner'`). Staff never sees profit/cost data in cart.
- **Branch selection:** POS header includes a branch selector dropdown. Products/inventory filtered by selected branch.
- **Staff items:** Already fully implemented — marked as ✅.

## Implementation Steps

### Step 1: Install Missing shadcn/ui Components + Mark Staff Items Done
**Files:** `components/ui/separator.tsx`, `components/ui/scroll-area.tsx`, `docs/product/roadmap.md`
**What:**
1. Run `npx shadcn@latest add separator scroll-area` to install the missing UI components.
2. Update `roadmap.md` to mark Day 15 staff items as ✅ complete:
   - ✅ Staff Management & PIN Auth (already implemented)
   - ✅ Staff Login API (already implemented)
   - ✅ shadcn `sheet` (already installed), install `separator` + `scroll-area`
**Testing:** Verify components exist in `components/ui/` and project builds without errors.

### Step 2: Create Zustand Cart Store
**Files:** `lib/hooks/useCart.ts`
**What:** Create a Zustand store for cart state management. The store manages `CartItem[]` with real variant IDs, product names, variant names, SKU, selling price, and capital cost. Implements `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal`, `getItemCount`, and `getProfit` methods. Items are keyed by `variantId` to prevent duplicates.

```typescript
interface CartItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;        // selling_price
  capitalCost: number;   // for profit calculation (owner-only display)
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getProfit: () => number;
}
```

**Key behavior:**
- `addItem`: If variant already in cart, increment quantity by 1. Otherwise add with quantity 1.
- `removeItem`: Remove item by variantId.
- `updateQuantity`: Set exact quantity. If quantity ≤ 0, remove item.
- `getTotal`: Sum of (price × quantity) for all items.
- `getProfit`: Sum of ((price - capitalCost) × quantity) for all items.
- `getItemCount`: Sum of all quantities.

**Testing:** Import store in component, add items, verify state updates correctly.

### Step 3: Create POS Products Query Hook
**Files:** `lib/hooks/usePosProducts.ts`
**What:** Create a TanStack Query hook that fetches active products with their active variants and inventory counts for the POS screen, **filtered by branch**. Query joins `products → product_variants → inventory` and groups by product. Includes category filtering and search.

```typescript
interface PosVariant {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  capitalCost: number;
  stock: number;          // from inventory table, for the selected branch
}

interface PosProduct {
  id: string;
  name: string;
  brand: string | null;
  categoryName: string | null;
  categoryId: string | null;
  variants: PosVariant[];
}

interface PosProductFilters {
  branchId: string;        // REQUIRED — which branch's inventory to show
  search?: string;
  categoryId?: string;
}
```

**Query strategy:**
1. Fetch active products with category name join
2. Fetch active variants for each product
3. Fetch inventory for the selected `branchId`
4. Combine: product → variants[] with stock from inventory
5. Apply client-side search/category filtering OR use Supabase filters

**Testing:** Verify products load with correct stock counts for the selected branch.

### Step 4: Refactor POS Page & Components
**Files:** `app/(dashboard)/pos/page.tsx`, `components/pos/product-card.tsx`, `components/pos/variant-selector.tsx`, `components/pos/cart-sheet.tsx`, `components/pos/pos-cart-sidebar.tsx` (NEW)
**What:**

#### 4a. POS Page (`app/(dashboard)/pos/page.tsx`)
- Convert to client component (already is)
- Replace hardcoded `PRODUCTS` with `usePosProducts({ branchId })` hook
- Replace `useState` cart with `useCartStore()`
- Fetch real categories from `useCategories()` for category chips
- **Add branch selector dropdown** in header (fetches branches from existing `useBranches` or inline query)
  - Default to org's default branch
  - Persist selection in state
  - Re-fetches products when branch changes
- **Responsive layout:**
  - Mobile (`<md`): Full-screen product grid + floating cart button → `CartSheet` bottom sheet
  - Tablet/Desktop (`≥md`): `grid grid-cols-[1fr_380px]` — products left, `PosCartSidebar` right
- **Floating checkout button** (mobile only): Fixed bottom, full-width minus 32px (mx-4), 64px height, green gradient, shows total + item count

#### 4b. ProductCard (`components/pos/product-card.tsx`)
- Accept `PosProduct` type instead of hardcoded `Product`
- Show price: if all variants same price → single price; if different → "₱X – ₱Y" range
- Stock badge: show lowest stock across variants; color-coded (green/yellow/red)
- Single variant → tap adds to cart directly via `useCartStore().addItem()`
- Multi-variant → tap opens `VariantSelector`
- **No profit display** on card (moved to cart, owner-only)

#### 4c. VariantSelector (`components/pos/variant-selector.tsx`)
- Accept `PosVariant[]` array (real data, not hardcoded `VARIANTS` map)
- Show variant name, price, stock count per variant
- Disable variants with 0 stock
- On "Add to Cart" → call `useCartStore().addItem()` with variant data
- Quantity stepper respects available stock

#### 4d. CartSheet (`components/pos/cart-sheet.tsx`) — Mobile
- Read from `useCartStore()` instead of props
- Use `removeItem()`, `updateQuantity()`, `clearCart()` from Zustand store
- **Profit display**: Only show if user is owner (pass `showProfit` boolean prop, determined by layout)
- Use `scroll-area` for scrollable cart items

#### 4e. PosCartSidebar (`components/pos/pos-cart-sidebar.tsx`) — NEW, Desktop
- Inline cart panel (not overlay) for split-view layout
- Same Zustand store data as `CartSheet`
- Always visible on `≥md` screens
- Sticky header ("Cart" + item count), scrollable item list, sticky footer (totals + checkout button)
- **Profit display**: Owner-only (same `showProfit` prop)
- Uses `scroll-area` for item list

**Props flow / role awareness:**
- The POS page determines `isOwner` from the dashboard layout context or a prop/cookie check
- Passes `showProfit={isOwner}` to both `CartSheet` and `PosCartSidebar`

**Testing:**
- Mobile: Tap product → cart updates → open cart sheet → correct items/totals. No profit visible for staff.
- Desktop: Split view visible, inline cart on right. Profit visible only for owner.
- Switch branches → products/stock update accordingly
- Search + category filter works with real data
- Cart persists across filter/search changes (Zustand)
- Empty states: "No products found" when search returns nothing

### Step 5: Final Polish & Commit
**Files:** `docs/product/roadmap.md`
**What:**
1. Update roadmap to mark all Day 15 items as ✅
2. Verify build passes (`npm run build` or dev server has no errors)
3. Git commit with conventional commit message

**Testing:**
- Full E2E flow: Login → POS → select branch → search/filter products → add to cart → see totals
- Responsive: test mobile (375px), tablet (768px), desktop (1280px)
- Verify no console errors

## Architecture

### Data Flow
```
Dashboard Layout (role, branches)
    ↓
POS Page
    ├── usePosProducts({ branchId, search, categoryId }) → ProductCard[]
    ├── useCategories() → Category chips
    ├── useCartStore() → Cart state (Zustand)
    │       ↓
    ├── CartSheet (mobile) ← reads from Zustand
    └── PosCartSidebar (desktop) ← reads from Zustand
```

### Component Tree (Mobile)
```
POS Page
├── StickyTop
│   ├── Branch Selector (dropdown)
│   ├── Search Input
│   └── Category Chips (horizontal scroll)
├── Product Grid (2-col)
│   └── ProductCard × N
│       └── (tap) → VariantSelector (bottom sheet) OR addItem()
├── Floating Cart Button (shows badge)
│   └── (tap) → CartSheet (bottom sheet)
└── Floating Checkout Button (shows total)
```

### Component Tree (Desktop ≥md)
```
POS Page (grid: [1fr 380px])
├── Left Panel
│   ├── StickyTop (branch + search + categories)
│   └── Product Grid (3-4 col)
│       └── ProductCard × N
└── Right Panel
    └── PosCartSidebar (sticky, full height)
        ├── Header ("Cart" + count)
        ├── ScrollArea (cart items)
        └── Footer (totals + checkout)
```

### Why Zustand over useState?
- Cart state persists across POS sub-interactions (variant selector, search, category switch)
- No prop drilling through deeply nested components
- Clean API for cart mutations from any component
- Performance: Only re-renders components that subscribe to specific state slices
