# Implementation Roadmap
## VapeTrack PH - 4-Week MVP Development Plan

**Version:** 1.0  
**Last Updated:** February 4, 2026  
**Developer:** Solo Full-Stack Developer  
**Timeline:** 4-6 Weeks to MVP  
**Methodology:** Agile Sprints (1-week cycles)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Sprint 1: Foundation](#sprint-1-foundation-days-1-7)
- [Sprint 2: Inventory Management](#sprint-2-inventory-management-days-8-14)
- [Sprint 3: Point of Sale (POS)](#sprint-3-point-of-sale-pos-days-15-21)
- [Sprint 4: Analytics & Polish](#sprint-4-analytics--polish-days-22-28)
- [Definition of Done Checklist](#definition-of-done-checklist)
- [Testing Strategy](#testing-strategy)
- [Deployment Checklist](#deployment-checklist)

---

## Overview

### Goals

Build a **Minimum Viable Product (MVP)** that allows a single vape shop owner to:
- ✅ Sign up and create their shop account
- ✅ Add products with variants (flavors, nicotine levels)
- ✅ Manage inventory across one or more branches
- ✅ Process sales through a mobile-optimized POS interface
- ✅ View daily sales and profit analytics

### MVP Scope

**What's IN:**
- Multi-tenant authentication (email/password for owners)
- Product & variant management
- Inventory tracking (per branch, per variant)
- Basic POS (cart, checkout, profit calculation)
- Simple dashboard (today's sales, low stock alerts)

**What's OUT (Post-MVP):**
- Staff PIN authentication (owner-only for MVP)
- Multi-branch comparison reports
- Advanced analytics (charts, trends)
- Email notifications
- Subscription billing integration
- Offline-first PWA capabilities

### Success Criteria

By end of Week 4, you must be able to:
1. Sign up as a shop owner and create organization
2. Add 10 products with variants
3. Adjust stock levels (add/remove inventory)
4. Process a complete sale (select items, checkout, confirm)
5. View today's sales summary on dashboard
6. Deploy to Vercel and access from mobile phone

---

## Sprint 1: Foundation (Days 1-7)

**Goal:** Set up project infrastructure and implement authentication flow.

### Day 1: Project Initialization

**Tasks:**
1. ✅ Install Node.js 20.x, VS Code, Git
2. ✅ Create Supabase project (free tier)
3. ✅ Clone starter repo: `npx create-next-app@latest vapetrack-ph --typescript --tailwind --app`
4. ✅ Install dependencies:
   ```bash
   npm install @supabase/supabase-js @tanstack/react-query zustand lucide-react
   npm install -D @types/node
   ```
5. ✅ Configure `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
6. ✅ Set up `.env.local` with Supabase keys
7. ✅ Create folder structure (see [README.md](/README.md) → Project Structure)

**Deliverables:**
- ✅ Dev server runs: `npm run dev`
- ✅ Tailwind CSS working (test with a colored `<div>`)
- ✅ No console errors

**Definition of Done:**
- ✅ All dependencies installed successfully
- ✅ Dev server starts without errors
- ✅ Tailwind styles render correctly
- ✅ `.env.local` configured with Supabase credentials

---

### Day 2-3: Database Schema & RLS Setup

**Tasks:**

**Day 2 Morning:**
1. ✅ Read [SCHEMA.md](SCHEMA.md) thoroughly
2. ✅ Create migration file: `supabase/migrations/001_initial_schema.sql`
3. ✅ Implement core tables:
   - `organizations` (shop/tenant)
   - `users` (shop owners)
   - `branches` (physical locations)

**Day 2 Afternoon:**
1. ✅ Create product tables:
   - `product_categories`
   - `products`
   - `product_variants`
   - `inventory` (stock per branch/variant)

**Day 3 Morning:**
1. ✅ Create transaction tables:
   - `transactions` (sales)
   - `transaction_items` (line items)
   - `stock_movements` (audit trail)

**Day 3 Afternoon:**
1. ✅ Apply migration via Supabase Dashboard (SQL Editor)
2. ✅ Create RLS policies for multi-tenancy (see [SCHEMA.md](SCHEMA.md) → RLS Policies)
3. ✅ Generate TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id <ref> > types/database.ts
   ```

**Deliverables:**
- ✅ All tables created in Supabase
- ✅ RLS policies active on all tables
- ✅ TypeScript types generated

**Definition of Done:**
- [ ] SQL migration runs without errors
- [ ] All tables visible in Supabase Table Editor
- [ ] RLS policies show as "Enabled" for all tables
- [ ] `types/database.ts` file exists and exports types

---

### Day 4-5: Authentication Implementation

**Tasks:**

**Day 4:**
1. ✅ Create Supabase client factories:
   - `lib/supabase/client.ts` (browser client)
   - `lib/supabase/server.ts` (server-side client)
2. ✅ Create authentication pages:
   - `app/(auth)/login/page.tsx`
   - `app/(auth)/signup/page.tsx`
3. ✅ Add shadcn/ui components:
   ```bash
   npx shadcn@latest add button input label card
   ```
4. ✅ Build login form (email + password)
5. ✅ Build signup form (email + password + shop name)

**Day 5:**
1. ✅ Create Server Actions:
   - `app/actions/auth.ts` (login, signup, logout)
2. ✅ Implement signup flow:
   - Create user in `auth.users` (Supabase Auth)
   - Create organization record
   - Create user record in `users` table
   - Create default branch
3. ✅ Implement login flow:
   - Validate credentials
   - Set session cookie
   - Redirect to dashboard
4. ✅ Create auth middleware:
   - `middleware.ts` (protect dashboard routes)

**Deliverables:**
- ✅ Signup creates organization + user + default branch
- ✅ Login redirects to dashboard
- ✅ Protected routes redirect to login if not authenticated

**Definition of Done:**
- [ ] Can sign up new user (creates org + user + branch)
- [ ] Can log in with valid credentials
- [ ] Protected pages redirect to login when not authenticated
- [ ] Session persists across page reloads
- [ ] Works on mobile view (375×667px)

---

### Day 6-7: Dashboard Layout & Organization Setup

**Tasks:**

**Day 6:**
1. ✅ Create dashboard layout:
   - `app/(dashboard)/layout.tsx` (sidebar navigation)
   - `components/layouts/DashboardLayout.tsx`
2. ✅ Add navigation items:
   - Dashboard, POS, Inventory, Branches, Settings
3. ✅ Add shadcn/ui components:
   ```bash
   npx shadcn@latest add navigation-menu avatar dropdown-menu
   ```
4. ✅ Implement user dropdown (logout, settings)
5. ✅ Create mobile-first responsive sidebar:
   - Collapsible on mobile (hamburger menu)
   - Fixed on desktop (sidebar + main content)

**Day 7:**
1. ✅ Create organization settings page:
   - `app/(dashboard)/settings/page.tsx`
   - Display organization name, slug, owner email
   - Allow editing shop name, address, phone
2. ✅ Create branch management page:
   - `app/(dashboard)/branches/page.tsx`
   - List all branches (at least default branch exists)
   - Add/edit branch form
3. ✅ Test multi-tenant isolation:
   - Sign up 2 separate accounts
   - Verify each sees only their own data

**Deliverables:**
- ✅ Dashboard layout with working navigation
- ✅ Organization settings page (view + edit)
- ✅ Branch management (list + add + edit)
- ✅ Multi-tenant isolation verified

**Definition of Done:**
- [ ] Dashboard layout renders on all screen sizes
- [ ] Navigation works (can switch between pages)
- [ ] User can update organization settings
- [ ] User can add/edit branches
- [ ] Multi-tenant test passes (2 orgs see separate data)
- [ ] Mobile-first: Works smoothly on 375×667px screen

---

### Sprint 1 Review Checklist

Before moving to Sprint 2, verify:

- [ ] ✅ Authentication flow complete (signup, login, logout)
- [ ] ✅ Database schema deployed with RLS
- [ ] ✅ Dashboard layout responsive (mobile + desktop)
- [ ] ✅ Organization and branch management working
- [ ] ✅ Multi-tenant isolation tested and verified
- [ ] ✅ TypeScript types generated and imported
- [ ] ✅ No console errors or warnings
- [ ] ✅ Code committed to Git with descriptive messages

**Estimated Time:** 40-50 hours (full week, 8-10 hours/day)

---

## Sprint 2: Inventory Management (Days 8-14)

**Goal:** Implement product catalog, variants, and inventory tracking.

### Day 8-9: Product Categories & Base Products

**Tasks:**

**Day 8:**
1. ✅ Create product category management:
   - `app/(dashboard)/inventory/categories/page.tsx`
   - List categories
   - Add/edit category form
   - Delete category (soft delete)
2. ✅ Add shadcn/ui components:
   ```bash
   npx shadcn@latest add table dialog alert-dialog badge
   ```
3. ✅ Create Server Actions:
   - `app/actions/categories.ts` (CRUD operations)
4. ✅ Implement category list with search/filter

**Day 9:**
1. ✅ Create product list page:
   - `app/(dashboard)/inventory/page.tsx`
   - Display products in table/grid view
   - Show product name, brand, category, variant count
   - Search by name/SKU
   - Filter by category, active status
2. ✅ Add TanStack Query hooks:
   - `lib/hooks/useProducts.ts`
   - `useProducts()` - fetch all products
   - `useProductById(id)` - fetch single product

**Deliverables:**
- ✅ Category CRUD functional
- ✅ Product list with search/filter
- ✅ TanStack Query caching working

**Definition of Done:**
- [ ] Can create/edit/delete categories
- [ ] Product list loads and displays correctly
- [ ] Search filters products by name/SKU
- [ ] Category filter works
- [ ] Loading states show spinner/skeleton
- [ ] Mobile-optimized (table scrolls horizontally if needed)

---

### Day 10-11: Product & Variant Management

**Tasks:**

**Day 10:**
1. ✅ Create "Add Product" page:
   - `app/(dashboard)/inventory/products/new/page.tsx`
   - Form fields: name, brand, description, category
2. ✅ Add shadcn/ui components:
   ```bash
   npx shadcn@latest add form select textarea
   ```
3. ✅ Implement product form with validation:
   - Use React Hook Form or native form validation
   - Required fields: name, category
4. ✅ Create Server Action:
   - `app/actions/products.ts` → `createProduct()`

**Day 11:**
1. ✅ Create variant management component:
   - `components/inventory/VariantManager.tsx`
   - Embedded in product form
   - Add/remove variants dynamically
   - Fields per variant: name, SKU, price, capital cost, initial stock
2. ✅ Update `createProduct()` Server Action:
   - Insert product
   - Insert variants in single transaction
   - Create initial inventory records (for each branch)
3. ✅ Create "Edit Product" page:
   - `app/(dashboard)/inventory/products/[id]/edit/page.tsx`
   - Pre-fill form with existing data
   - Allow editing variants (add new, edit existing)

**Deliverables:**
- ✅ Can add product with multiple variants
- ✅ Variants saved correctly with SKUs and pricing
- ✅ Initial inventory created for default branch
- ✅ Can edit existing products and variants

**Definition of Done:**
- [ ] Add product form validates required fields
- [ ] Can add 1+ variants per product
- [ ] Each variant has unique SKU (validated)
- [ ] Product creation creates inventory records
- [ ] Edit product pre-fills existing data
- [ ] Can add new variants to existing products
- [ ] All operations show success toast
- [ ] Error handling shows user-friendly messages

---

### Day 12-13: Stock Management & Adjustments

**Tasks:**

**Day 12:**
1. ✅ Create inventory view page:
   - `app/(dashboard)/inventory/stock/page.tsx`
   - Show all variants with current stock levels
   - Group by product
   - Color-coded: Green (sufficient), Yellow (low), Red (out of stock)
2. ✅ Add quick stock adjustment:
   - Inline input to increase/decrease stock
   - "Add Stock" and "Remove Stock" buttons
   - Updates `inventory` table
   - Creates `stock_movements` audit record

**Day 13:**
1. ✅ Create Postgres function for stock adjustment:
   - `supabase/migrations/002_stock_functions.sql`
   ```sql
   CREATE OR REPLACE FUNCTION adjust_stock(
     p_variant_id UUID,
     p_branch_id UUID,
     p_quantity INT,
     p_movement_type TEXT,
     p_reason TEXT
   ) RETURNS VOID AS $$
   -- Update inventory
   -- Create stock_movement record
   -- Validate: Cannot reduce below 0
   $$ LANGUAGE plpgsql;
   ```
2. ✅ Implement RPC call in Server Action:
   - `app/actions/inventory.ts` → `adjustStock()`
   ```typescript
   await supabase.rpc('adjust_stock', { ... });
   ```
3. ✅ Create stock movement history page:
   - `app/(dashboard)/inventory/history/page.tsx`
   - Show all stock movements (timestamp, user, type, quantity, reason)
   - Filter by date range, product, branch

**Deliverables:**
- ✅ Inventory view with real-time stock levels
- ✅ Stock adjustment functional
- ✅ Stock movements logged in audit table
- ✅ Cannot reduce stock below 0

**Definition of Done:**
- [ ] Inventory page displays all variants and stock
- [ ] Low stock items highlighted (threshold: <5 units)
- [ ] Can add stock (creates "restock" movement)
- [ ] Can remove stock (creates "adjustment" movement)
- [ ] Stock cannot go negative (validation)
- [ ] Stock movement history shows all changes
- [ ] Optimistic UI updates (shows immediately, syncs in background)

---

### Day 14: Low Stock Alerts & Polish

**Tasks:**

1. ✅ Create low stock alerts dashboard widget:
   - `components/dashboard/LowStockWidget.tsx`
   - Query variants with stock < 5
   - Display in dashboard home page
2. ✅ Add notification badge to Inventory nav item
3. ✅ Polish UI:
   - Add loading skeletons for tables
   - Improve mobile responsiveness
   - Add empty states ("No products yet")
4. ✅ Write unit tests for stock adjustment logic (optional but recommended)

**Deliverables:**
- ✅ Low stock alerts visible on dashboard
- ✅ Inventory UI polished and mobile-friendly

**Definition of Done:**
- [ ] Dashboard shows low stock products (if any)
- [ ] All inventory pages work on mobile (375×667px)
- [ ] Loading states implemented (skeleton screens)
- [ ] Empty states show helpful messages
- [ ] No console errors or warnings

---

### Sprint 2 Review Checklist

Before moving to Sprint 3, verify:

- [ ] ✅ Product categories management complete
- [ ] ✅ Product & variant CRUD functional
- [ ] ✅ Stock adjustment working with audit trail
- [ ] ✅ Low stock alerts display correctly
- [ ] ✅ Multi-branch inventory tracking works
- [ ] ✅ Mobile-responsive on all inventory pages
- [ ] ✅ TypeScript types up-to-date
- [ ] ✅ Code committed with clear messages

**Estimated Time:** 45-55 hours (full week)

---

## Sprint 3: Point of Sale (POS) (Days 15-21)

**Goal:** Build a fast, mobile-optimized POS interface for processing sales.

### Day 15-16: POS UI & Cart State

**Tasks:**

**Day 15:**
1. ✅ Create POS layout:
   - `app/(dashboard)/pos/page.tsx`
   - Fullscreen mode (hide sidebar on mobile)
   - Split view: Product selection (left) + Cart (right)
2. ✅ Create cart state with Zustand:
   - `lib/hooks/useCart.ts`
   ```typescript
   interface CartItem {
     variantId: string;
     productName: string;
     variantName: string;
     sku: string;
     price: number;
     quantity: number;
   }
   
   interface CartStore {
     items: CartItem[];
     addItem: (item) => void;
     removeItem: (variantId) => void;
     updateQuantity: (variantId, quantity) => void;
     clearCart: () => void;
     getTotal: () => number;
   }
   ```
3. ✅ Add shadcn/ui components:
   ```bash
   npx shadcn@latest add sheet separator scroll-area
   ```

**Day 16:**
1. ✅ Create product grid component:
   - `components/pos/ProductGrid.tsx`
   - Display all active variants (grouped by product)
   - Show: Product name, variant name, price, stock
   - Grid layout (2-3 columns on mobile, 4-6 on desktop)
   - Click to add to cart
2. ✅ Implement search/filter:
   - Search by product name, SKU
   - Filter by category
   - Real-time filtering (no submit button)
3. ✅ Create cart display component:
   - `components/pos/POSCart.tsx`
   - List all cart items
   - Show quantity steppers (+/-)
   - Display subtotal
   - "Clear Cart" button

**Deliverables:**
- ✅ POS layout with product grid and cart
- ✅ Can add items to cart
- ✅ Cart updates in real-time

**Definition of Done:**
- [ ] POS page loads quickly (<1 second)
- [ ] Product grid displays all active variants
- [ ] Clicking product adds to cart
- [ ] Cart shows correct quantities and prices
- [ ] Can update quantities with +/- buttons
- [ ] Subtotal calculates correctly
- [ ] Works smoothly on mobile (one-handed operation)

---

### Day 17-18: Checkout Flow & Transaction Processing

**Tasks:**

**Day 17:**
1. ✅ Create checkout modal:
   - `components/pos/CheckoutModal.tsx`
   - Triggered by "Checkout" button in cart
   - Display:
     - Order summary (items, quantities, prices)
     - Subtotal, Total
     - Payment method selector (Cash, GCash, Card)
     - "Confirm Sale" button
2. ✅ Add form validation:
   - Ensure cart not empty
   - Validate payment amount (if collecting payment)

**Day 18:**
1. ✅ Create Postgres function for transaction processing:
   - `supabase/migrations/003_transaction_functions.sql`
   ```sql
   CREATE OR REPLACE FUNCTION process_sale(
     p_branch_id UUID,
     p_items JSONB, -- Array of {variant_id, quantity, price}
     p_payment_method TEXT
   ) RETURNS UUID AS $$
   DECLARE
     v_transaction_id UUID;
   BEGIN
     -- Insert transaction
     -- Insert transaction_items
     -- Deduct inventory for each item
     -- Create stock_movements (type: 'sale')
     -- Calculate profit (price - capital_cost)
     -- Return transaction_id
   END;
   $$ LANGUAGE plpgsql;
   ```
2. ✅ Create Server Action:
   - `app/actions/sales.ts` → `createSale()`
   ```typescript
   export async function createSale(items: CartItem[], paymentMethod: string) {
     const supabase = createServerClient();
     const { data, error } = await supabase.rpc('process_sale', {
       p_branch_id: currentBranchId,
       p_items: JSON.stringify(items),
       p_payment_method: paymentMethod
     });
     
     if (error) throw error;
     return data; // transaction_id
   }
   ```
3. ✅ Integrate checkout with TanStack Query:
   - Use `useMutation` for optimistic updates
   - Clear cart on success
   - Show success toast with transaction ID

**Deliverables:**
- ✅ Checkout modal functional
- ✅ `process_sale()` RPC working
- ✅ Sale deducts inventory correctly
- ✅ Transaction and items saved to database

**Definition of Done:**
- [ ] Checkout modal displays correct totals
- [ ] Can select payment method (Cash, GCash, Card)
- [ ] "Confirm Sale" processes transaction
- [ ] Inventory deducted correctly for each item
- [ ] Stock movements created with type "sale"
- [ ] Profit calculated and saved
- [ ] Cart clears after successful sale
- [ ] Success message shows transaction ID
- [ ] Cannot sell more than available stock (validation)
- [ ] Transaction processing completes in <2 seconds

---

### Day 19-20: Transaction History & Receipt

**Tasks:**

**Day 19:**
1. ✅ Create transaction history page:
   - `app/(dashboard)/pos/history/page.tsx`
   - List all transactions (today, this week, all time)
   - Display: Date, Time, Total Amount, Profit, Payment Method
   - Filter by date range
   - Search by transaction ID
2. ✅ Add pagination (if >100 transactions)

**Day 20:**
1. ✅ Create transaction detail modal:
   - Click transaction to view full details
   - Show all line items (product, variant, quantity, price)
   - Display subtotal, total, profit
   - Show payment method, timestamp, user
2. ✅ Add "Print Receipt" button (optional):
   - Use `window.print()` for browser print dialog
   - Format for 80mm thermal printer (optional enhancement)
3. ✅ Create receipt template component:
   - `components/pos/Receipt.tsx`
   - Shop name, address, phone (from organization)
   - Transaction ID, date/time
   - Line items table
   - Total amount
   - "Thank you" message

**Deliverables:**
- ✅ Transaction history with search/filter
- ✅ Transaction detail view
- ✅ Printable receipt (basic)

**Definition of Done:**
- [ ] Transaction history loads all sales
- [ ] Can filter by date range
- [ ] Transaction detail shows all items
- [ ] Receipt template renders correctly
- [ ] Print receipt opens browser print dialog
- [ ] Mobile-optimized (table scrolls on small screens)

---

### Day 21: POS Optimization & Error Handling

**Tasks:**

1. ✅ Implement optimistic UI for POS:
   - Add item to cart: Instant visual feedback
   - Remove item: Instant removal (no loading state)
   - Checkout: Show "Processing..." modal, assume success
2. ✅ Add error handling:
   - Insufficient stock: Show specific error message ("Only 3 units available")
   - Network failure: Queue transaction for retry (future enhancement)
   - Show user-friendly error toasts
3. ✅ Performance optimization:
   - Lazy load product images (if any)
   - Virtualize product grid (if >100 products)
   - Debounce search input (300ms delay)
4. ✅ Add keyboard shortcuts (optional):
   - `F2`: Focus search
   - `F12`: Checkout
   - `Esc`: Clear cart

**Deliverables:**
- ✅ POS interface optimized for speed
- ✅ Comprehensive error handling
- ✅ Keyboard shortcuts (optional)

**Definition of Done:**
- [ ] POS interactions feel instant (<100ms feedback)
- [ ] Error messages are clear and actionable
- [ ] Insufficient stock prevents checkout
- [ ] Works smoothly with 100+ products
- [ ] Search input doesn't lag on typing
- [ ] No console errors or warnings

---

### Sprint 3 Review Checklist

Before moving to Sprint 4, verify:

- [ ] ✅ POS interface fully functional
- [ ] ✅ Can add items to cart and adjust quantities
- [ ] ✅ Checkout processes sale correctly
- [ ] ✅ Inventory deducted atomically
- [ ] ✅ Transaction history displays all sales
- [ ] ✅ Receipt template renders correctly
- [ ] ✅ Optimistic UI implemented
- [ ] ✅ Error handling comprehensive
- [ ] ✅ Mobile-optimized (can sell with one hand)
- [ ] ✅ Code committed with clear messages

**Estimated Time:** 50-60 hours (full week)

---

## Sprint 4: Analytics & Polish (Days 22-28)

**Goal:** Add basic analytics, polish UI, and deploy to production.

### Day 22-23: Dashboard Analytics

**Tasks:**

**Day 22:**
1. ✅ Create dashboard home page:
   - `app/(dashboard)/dashboard/page.tsx`
   - Display key metrics:
     - **Today's Sales:** Total revenue (sum of all transactions today)
     - **Today's Profit:** Total profit (sum of profit from transactions today)
     - **Transactions Count:** Number of sales today
     - **Low Stock Alerts:** Count of variants with stock <5
2. ✅ Add shadcn/ui components:
   ```bash
   npx shadcn@latest add card tabs
   ```
3. ✅ Create metric cards:
   - `components/dashboard/MetricCard.tsx`
   - Large number display (₱12,450.00)
   - Trend indicator (↑ +15% from yesterday) - optional
   - Icon (lucide-react)

**Day 23:**
1. ✅ Create recent transactions widget:
   - `components/dashboard/RecentTransactions.tsx`
   - Show last 5-10 transactions
   - Display: Time, Total, Payment Method
   - Click to view details
2. ✅ Create top-selling products widget:
   - `components/dashboard/TopProducts.tsx`
   - Query: Top 5 products by quantity sold (this week)
   - Display: Product name, Units sold, Revenue
3. ✅ Implement Incremental Static Regeneration (ISR):
   ```typescript
   // app/(dashboard)/dashboard/page.tsx
   export const revalidate = 60; // Refresh every 60 seconds
   ```

**Deliverables:**
- ✅ Dashboard with today's key metrics
- ✅ Recent transactions and top products widgets
- ✅ Auto-refreshing data (ISR)

**Definition of Done:**
- [ ] Dashboard loads in <1 second
- [ ] Metrics display correct values (verify with database)
- [ ] Recent transactions widget shows latest sales
- [ ] Top products widget displays correctly
- [ ] Low stock alerts clickable (links to inventory)
- [ ] Mobile-responsive (stacks vertically on small screens)

---

### Day 24-25: Reports & Data Export

**Tasks:**

**Day 24:**
1. ✅ Create reports page:
   - `app/(dashboard)/reports/page.tsx`
   - Date range selector (Today, This Week, This Month, Custom)
   - Generate report button
2. ✅ Create sales summary report:
   - Total Revenue
   - Total Profit
   - Total Transactions
   - Average Transaction Value
   - Breakdown by payment method
3. ✅ Create inventory report:
   - Total products
   - Total variants
   - Total inventory value (sum of stock × capital_cost)
   - Low stock items count

**Day 25:**
1. ✅ Add CSV export functionality:
   - Export transactions to CSV
   - Export products/inventory to CSV
   - Use browser download (no server-side processing)
   ```typescript
   function exportToCSV(data: any[], filename: string) {
     const csv = convertToCSV(data);
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${filename}-${new Date().toISOString()}.csv`;
     a.click();
   }
   ```
2. ✅ Polish reports UI:
   - Add loading states
   - Show empty state if no data
   - Format currency and dates

**Deliverables:**
- ✅ Reports page with date range filtering
- ✅ Sales and inventory summary reports
- ✅ CSV export functional

**Definition of Done:**
- [ ] Can generate sales report for any date range
- [ ] Report displays accurate metrics (verify manually)
- [ ] CSV export downloads correctly
- [ ] CSV file opens in Excel/Google Sheets
- [ ] Mobile-responsive (tables scroll horizontally)

---

### Day 26: UI/UX Polish

**Tasks:**

1. ✅ Implement dark mode:
   - Use Tailwind's `dark:` variants
   - Add theme toggle (optional)
   - Default to dark theme (matches UI_UX.md)
2. ✅ Add loading states everywhere:
   - Skeleton screens for lists
   - Spinners for buttons during async actions
   - Use shadcn/ui skeleton component:
     ```bash
     npx shadcn@latest add skeleton
     ```
3. ✅ Improve error handling:
   - Toast notifications for all errors
   - Install `sonner` for better toasts:
     ```bash
     npm install sonner
     ```
   - Clear error messages ("Product not found" instead of "Error 404")
4. ✅ Add empty states:
   - "No products yet. Add your first product!" (with CTA button)
   - "No transactions today. Start selling!"
   - Use lucide-react icons for visual appeal
5. ✅ Accessibility improvements:
   - Add ARIA labels to buttons
   - Ensure keyboard navigation works (Tab, Enter, Esc)
   - Test with screen reader (optional)
6. ✅ Mobile optimizations:
   - Touch targets ≥44×44px
   - Test on real device (if possible)
   - Ensure thumb-zone navigation works

**Deliverables:**
- ✅ Dark theme applied throughout app
- ✅ Loading states for all async operations
- ✅ Toast notifications for success/error
- ✅ Empty states with helpful CTAs
- ✅ Accessibility basics covered
- ✅ Mobile-optimized (tested on small screen)

**Definition of Done:**
- [ ] Dark theme looks consistent across all pages
- [ ] All buttons show loading spinner during async ops
- [ ] Toast notifications appear for all user actions
- [ ] Empty states show helpful messages
- [ ] Can navigate entire app with keyboard
- [ ] All touch targets ≥44×44px (mobile)
- [ ] No accessibility warnings in browser console

---

### Day 27: Testing & Bug Fixes

**Tasks:**

1. ✅ End-to-end testing:
   - **Scenario 1:** Sign up → Add product → Adjust stock → Make sale → View dashboard
   - **Scenario 2:** Create 2 organizations → Verify data isolation (multi-tenant test)
   - **Scenario 3:** Add product with 3 variants → Sell all 3 → Verify inventory deducted
2. ✅ Cross-browser testing:
   - Chrome (primary)
   - Safari (if on Mac)
   - Firefox (optional)
3. ✅ Mobile device testing:
   - Test on real Android/iPhone (if available)
   - Use Chrome DevTools device emulation (minimum)
4. ✅ Fix identified bugs:
   - Create GitHub issues for each bug
   - Prioritize: Critical (blocks core flow) → High → Medium → Low
   - Fix critical and high-priority bugs before deployment
5. ✅ Performance audit:
   - Run Lighthouse in Chrome DevTools
   - Target: Performance >90, Accessibility >90
   - Fix any major issues (e.g., large images, render-blocking scripts)

**Deliverables:**
- ✅ All critical bugs fixed
- ✅ Multi-tenant isolation verified
- ✅ Mobile testing complete
- ✅ Lighthouse score >90

**Definition of Done:**
- [ ] Core user flows work end-to-end (sign up → sell → view dashboard)
- [ ] Multi-tenant test passes (2 orgs see separate data)
- [ ] No critical bugs remaining
- [ ] Works on Chrome, Safari, Firefox
- [ ] Works on mobile device (real or emulated)
- [ ] Lighthouse Performance >90, Accessibility >90

---

### Day 28: Deployment & Documentation

**Tasks:**

**Morning:**
1. ✅ Create `.env.example` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
2. ✅ Update README.md with final setup instructions
3. ✅ Write deployment guide in README (Vercel section)
4. ✅ Commit all code to GitHub:
   ```bash
   git add .
   git commit -m "feat: MVP complete - ready for deployment"
   git push origin main
   ```

**Afternoon:**
1. ✅ Deploy to Vercel:
   - Import GitHub repo in Vercel Dashboard
   - Configure environment variables (Supabase keys)
   - Deploy
2. ✅ Test production deployment:
   - Sign up new account on production URL
   - Complete full user flow (add product → sell → dashboard)
   - Test on mobile device (access Vercel URL)
3. ✅ Configure custom domain (optional):
   - Add domain in Vercel settings
   - Update DNS records
4. ✅ Set up analytics:
   - Enable Vercel Analytics (free tier)
   - Monitor initial traffic

**Evening:**
1. ✅ Create launch checklist:
   - [ ] Production URL works
   - [ ] Can sign up new users
   - [ ] All core features functional
   - [ ] No console errors
   - [ ] Mobile-responsive
2. ✅ Announce MVP completion:
   - Share production URL with test users (optional)
   - Gather initial feedback

**Deliverables:**
- ✅ Application deployed to Vercel
- ✅ Production environment tested and working
- ✅ Documentation up-to-date
- ✅ Analytics enabled

**Definition of Done:**
- [ ] Application accessible at public URL
- [ ] Environment variables configured correctly
- [ ] Database migrations applied on Supabase
- [ ] Can sign up and use app on production
- [ ] Works on mobile device
- [ ] README.md has complete setup instructions
- [ ] Code pushed to GitHub
- [ ] Vercel Analytics enabled

---

### Sprint 4 Review Checklist

Before calling MVP complete, verify:

- [ ] ✅ Dashboard displays today's sales and profit
- [ ] ✅ Reports generate correctly with CSV export
- [ ] ✅ Dark theme applied throughout
- [ ] ✅ All loading states and error handling implemented
- [ ] ✅ Mobile-optimized and tested
- [ ] ✅ Deployed to Vercel and accessible
- [ ] ✅ Multi-tenant isolation working in production
- [ ] ✅ All critical bugs fixed
- [ ] ✅ Documentation complete (README, ROADMAP)
- [ ] ✅ Code committed with clear messages

**Estimated Time:** 50-60 hours (full week)

---

## Definition of Done Checklist

Use this checklist for **every feature** you build. A feature is only "done" when ALL items are checked.

### Functional Requirements
- [ ] Feature works as described in user story
- [ ] Happy path tested (expected user flow)
- [ ] Edge cases handled (empty state, error state)
- [ ] Validation prevents invalid input
- [ ] Success feedback shown (toast, redirect, etc.)
- [ ] Error feedback shown (clear message, actionable)

### Mobile-First Design
- [ ] Works on mobile view (375×667px minimum)
- [ ] Touch targets ≥44×44px
- [ ] No horizontal scrolling (unless intentional, like tables)
- [ ] Readable font sizes (≥16px for body text)
- [ ] Optimized for one-handed use (thumb zone)

### Performance
- [ ] Page loads in <2 seconds
- [ ] Interactive in <3 seconds (TTI - Time to Interactive)
- [ ] No console errors or warnings
- [ ] Images optimized (use Next.js `<Image>` component)
- [ ] Unnecessary re-renders avoided (use `React.memo` if needed)

### User Experience
- [ ] Loading state shown (spinner, skeleton, progress bar)
- [ ] Empty state shown with helpful CTA ("Add your first product")
- [ ] Error state shown with recovery action ("Retry")
- [ ] Success state shown (toast, confirmation message)
- [ ] Confirmation before destructive actions (delete, logout)

### Accessibility
- [ ] Semantic HTML used (`<button>`, `<nav>`, `<main>`)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

### Code Quality
- [ ] TypeScript types defined (no `any`)
- [ ] ESLint passes with no errors
- [ ] Code formatted consistently (Prettier)
- [ ] Reusable components extracted (if used 2+ times)
- [ ] Magic numbers replaced with constants
- [ ] Comments added for complex logic

### Security & Data Integrity
- [ ] RLS policies enforce multi-tenancy (if applicable)
- [ ] User input sanitized (prevent XSS)
- [ ] Sensitive data not exposed in client code
- [ ] Server Actions used for mutations (not client-side fetch)
- [ ] Transactions used for multi-step operations

### Testing
- [ ] Tested in Chrome (primary browser)
- [ ] Tested on mobile (real device or DevTools emulation)
- [ ] Multi-tenant test passed (if feature touches org data)
- [ ] Edge cases tested (empty cart, insufficient stock, etc.)
- [ ] Manual regression test (ensure existing features still work)

### Documentation
- [ ] Code committed to Git with descriptive message
- [ ] Complex logic documented in code comments
- [ ] API changes reflected in API_SPEC.md (if applicable)
- [ ] Breaking changes noted in commit message

---

## Testing Strategy

### Manual Testing (Primary for MVP)

**Daily Testing Routine:**
1. ✅ Run dev server: `npm run dev`
2. ✅ Open in Chrome
3. ✅ Open DevTools (F12) → Console (check for errors)
4. ✅ Test feature you just built
5. ✅ Test on mobile view (Ctrl+Shift+M → iPhone SE)
6. ✅ Fix any issues before moving to next task

**Weekly Regression Test:**
- **Every Friday:** Complete full user flow from signup to sale
- Verify all core features still work after week's changes

### Multi-Tenant Testing

**After each RLS policy change:**
1. ✅ Sign up 2 separate accounts (Org A, Org B)
2. ✅ Add data to Org A (products, sales)
3. ✅ Login to Org B
4. ✅ Verify Org B sees ZERO data from Org A
5. ✅ Add data to Org B
6. ✅ Login back to Org A
7. ✅ Verify Org A data unchanged

### Performance Testing

**Before deployment:**
1. ✅ Open Chrome DevTools → Lighthouse
2. ✅ Run audit (Desktop + Mobile)
3. ✅ Target scores:
   - Performance: >90
   - Accessibility: >90
   - Best Practices: >90
   - SEO: >80 (optional for MVP)
4. ✅ Fix critical issues (red/orange items)

### Browser Compatibility

**Minimum testing:**
- ✅ Chrome (latest) - Primary
- ✅ Safari (latest) - iPhone users
- ✅ Firefox (latest) - Optional

**Skip for MVP:**
- Internet Explorer (unsupported)
- Edge (Chromium-based, same as Chrome)

---

## Deployment Checklist

Use this checklist before deploying to production.

### Pre-Deployment
- [ ] All code committed to GitHub
- [ ] No console errors in development
- [ ] `npm run build` succeeds with no errors
- [ ] Environment variables documented in `.env.example`
- [ ] Database migrations applied on Supabase
- [ ] RLS policies enabled on all tables
- [ ] Sensitive keys not committed to Git (check `.gitignore`)

### Vercel Setup
- [ ] GitHub repo imported in Vercel
- [ ] Environment variables added:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Build settings correct (Framework: Next.js, Build Command: `npm run build`)
- [ ] Deploy to production

### Post-Deployment
- [ ] Production URL accessible
- [ ] Can sign up new account
- [ ] Can log in
- [ ] Dashboard loads correctly
- [ ] Can add product
- [ ] Can process sale
- [ ] No console errors
- [ ] Works on mobile device (test on real phone)
- [ ] Analytics enabled (Vercel Analytics)

### Rollback Plan
If deployment fails:
1. Check Vercel deployment logs for errors
2. Fix error locally
3. Commit fix
4. Redeploy (Vercel auto-deploys on push)
5. If critical: Revert to previous deployment in Vercel Dashboard

---

## Post-MVP Roadmap (Future Enhancements)

After completing the 4-week MVP, consider these enhancements (prioritize based on user feedback):

### Phase 2: Staff Management (Week 5-6)
- [ ] Staff user accounts (separate from owners)
- [ ] 4-6 digit PIN authentication for staff
- [ ] Role-based permissions (can_view_profits, can_manage_inventory)
- [ ] Staff activity tracking (who sold what)

### Phase 3: Advanced Analytics (Week 7-8)
- [ ] Sales trends chart (daily, weekly, monthly)
- [ ] Profit margin analysis
- [ ] Branch performance comparison
- [ ] Product performance ranking
- [ ] Export reports to PDF

### Phase 4: Offline-First PWA (Week 9-10)
- [ ] Service Worker for offline caching
- [ ] Queue sales for sync when online
- [ ] Offline product catalog
- [ ] Install prompt for PWA

### Phase 5: Subscription Billing (Week 11-12)
- [ ] PayMongo integration
- [ ] Subscription plans (Starter, Professional, Enterprise)
- [ ] Trial period management
- [ ] Usage limits enforcement

### Phase 6: Multi-Branch Enhancements (Week 13-14)
- [ ] Branch-to-branch inventory transfers
- [ ] Consolidated multi-branch reports
- [ ] Branch-specific staff assignments
- [ ] Branch performance dashboards

---

## Troubleshooting Guide

### Common Issues During Development

**Issue:** `Error: Invalid API key`
- **Cause:** `.env.local` missing or incorrect keys
- **Fix:** Copy keys from Supabase Dashboard → Settings → API
- **Fix:** Restart dev server after changing env vars

**Issue:** RLS policies blocking queries
- **Cause:** User's JWT missing `organization_id` claim
- **Fix:** Verify `auth.users` metadata includes organization_id
- **Fix:** Re-login after database changes

**Issue:** TypeScript errors for database types
- **Cause:** `types/database.ts` out of sync with schema
- **Fix:** Regenerate types: `npx supabase gen types typescript > types/database.ts`

**Issue:** Styles not loading
- **Cause:** Tailwind config issue or `.next` cache corruption
- **Fix:** Delete `.next` folder: `rm -rf .next` (or `rmdir /s .next` on Windows)
- **Fix:** Restart dev server

**Issue:** Transaction fails silently
- **Cause:** Postgres function error (check Supabase logs)
- **Fix:** Open Supabase Dashboard → Database → Logs
- **Fix:** Debug SQL function, fix issue, re-apply migration

**Issue:** Insufficient stock not validated
- **Cause:** `process_sale()` function missing stock check
- **Fix:** Add validation in Postgres function:
  ```sql
  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;
  ```

---

## Success Metrics

By the end of Week 4, you should have:

### Technical Metrics
- ✅ **100% Core Features Complete:** Auth, Inventory, POS, Dashboard
- ✅ **Lighthouse Score >90:** Performance and Accessibility
- ✅ **Zero Critical Bugs:** All blockers resolved
- ✅ **Multi-Tenant Tested:** 2+ organizations verified
- ✅ **Mobile-Optimized:** Works smoothly on 375×667px screen
- ✅ **Deployed to Production:** Accessible via public URL

### User Flow Metrics
- ✅ **Signup to First Sale:** <5 minutes
- ✅ **Add Product:** <2 minutes
- ✅ **Process Sale:** <30 seconds
- ✅ **View Dashboard:** <1 second load time

### Code Quality Metrics
- ✅ **TypeScript Coverage:** 100% (no `any` types)
- ✅ **ESLint Errors:** 0
- ✅ **Console Errors:** 0 (in production)
- ✅ **Git Commits:** 50+ (daily commits)

---

## Final Notes

### Time Management Tips

- **Stick to the schedule:** Don't over-engineer. MVP = Minimum Viable Product.
- **Use placeholders:** Mock data, simple UI. Polish comes in Sprint 4.
- **Skip optional features:** Keyboard shortcuts, advanced charts—save for post-MVP.
- **Daily commits:** Commit working code every day, even if incomplete.

### When You Get Stuck

1. **Read the docs:** PRD, Schema, Architecture, API Spec
2. **Check Supabase logs:** Database → Logs (for RLS/RPC errors)
3. **Console debugging:** `console.log()` liberally
4. **Simplify:** Break complex feature into smaller tasks
5. **Ask for help:** GitHub issues, Supabase Discord, Next.js forums

### Celebrate Milestones

- ✅ **End of Sprint 1:** Working auth and dashboard layout
- ✅ **End of Sprint 2:** Full inventory management
- ✅ **End of Sprint 3:** Working POS (first sale processed!)
- ✅ **End of Sprint 4:** Deployed MVP (share with friends!)

---

**You've got this! 🚀**  
_Build fast, ship early, iterate based on real user feedback._

---

**Last Updated:** February 4, 2026  
**Next Review:** After Sprint 1 completion (Day 7)
