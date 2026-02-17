# Implementation Roadmap

## VapeTrack PH - 4-Week MVP Development Plan

**Version:** 1.0  
**Last Updated:** February 16, 2026  
**Developer:** Solo Full-Stack Developer  
**Timeline:** 4-6 Weeks to MVP  
**Methodology:** Agile Sprints (1-week cycles)

---

## 📊 Implementation Status

**Overall Progress: 40% Complete** (Foundation Completed)

| Sprint                             | Status           | Completion |
| ---------------------------------- | ---------------- | ---------- |
| **Sprint 1: Foundation**           | ✅ **COMPLETED** | 100%       |
| **Sprint 2: Inventory Management** | 🔄 In Progress   | 30%        |
| **Sprint 3: Point of Sale (POS)**  | ⏸️ Not Started   | 0%         |
| **Sprint 4: Analytics & Polish**   | ⏸️ Not Started   | 0%         |

### ✅ What's Implemented

- **Database Schema** - All 12 tables with complete RLS policies
- **Authentication System** - Email/password signup, login, logout with multi-tenant isolation
- **Dashboard Layout** - Responsive mobile-first UI with bottom navigation and sidebar
- **Organization Management** - Settings page for editing shop details
- **Branch Management** - Full CRUD operations for managing physical locations
- **Multi-Tenancy** - RLS-based tenant isolation tested and verified
- **E2E Testing** - Route protection, multi-tenant isolation, responsive navigation

### 🔴 What's Next (Sprint 2 - Current Focus)

- Product category management
- Product & variant CRUD operations
- Inventory tracking and stock adjustments
- Low stock alerts

### ⚠️ Deferred to Post-MVP

- Staff PIN authentication
- Password reset flow
- Email verification
- PayMongo billing integration

---

## 📋 Table of Contents

- [Overview](#overview)
- [Design System & UI/UX Requirements](#design-system--uiux-requirements)
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
- ⏸️ Add products with variants (flavors, nicotine levels)
- ⏸️ Manage inventory across one or more branches
- ⏸️ Process sales through a mobile-optimized POS interface
- ⏸️ View daily sales and profit analytics

### MVP Scope

**What's IN:**

- ✅ Multi-tenant authentication (email/password for owners)
- ⏸️ Product & variant management
- ⏸️ Inventory tracking (per branch, per variant)
- ⏸️ Basic POS (cart, checkout, profit calculation)
- ⏸️ Simple dashboard (today's sales, low stock alerts)

**What's OUT (Post-MVP):**

- Staff PIN authentication (owner-only for MVP)
- Multi-branch comparison reports
- Advanced analytics (charts, trends)
- Email notifications
- Subscription billing integration
- Offline-first PWA capabilities

### Success Criteria

By end of Week 4, you must be able to:

1. ✅ Sign up as a shop owner and create organization
2. ⏸️ Add 10 products with variants
3. ⏸️ Adjust stock levels (add/remove inventory)
4. ⏸️ Process a complete sale (select items, checkout, confirm)
5. ⏸️ View today's sales summary on dashboard
6. ⏸️ Deploy to Vercel and access from mobile phone

---

## Design System & UI/UX Requirements

**IMPORTANT:** All implementation must follow the comprehensive UI/UX guidelines in [ui_ux.md](ui_ux.md). Review this document before starting any frontend work.

### Key Design Principles

1. **Mobile-First, Touch-Optimized**
   - Reference device: iPhone (375×812px) to Android (393×851px)
   - All touch targets ≥ 44×44px (WCAG compliance)
   - Thumb-zone optimization for one-handed operation
   - Bottom navigation on mobile, sidebar on desktop (1024px+)

2. **Dark Mode as Default**
   - App background: `#0f172a` (Slate 950)
   - Card background: `#1e293b` (Slate 800)
   - Elevated surfaces: `#334155` (Slate 700)
   - Primary brand: `#22c55e` (Green 500)
   - Text contrast: WCAG AAA (7:1+ ratio)

3. **Speed-First Design**
   - First Contentful Paint (FCP) < 1.5s
   - Largest Contentful Paint (LCP) < 2.0s
   - Time to Interactive (TTI) < 3.0s
   - Complete POS sale in <30 seconds
   - Optimistic UI: Instant feedback, sync in background

4. **Component Specifications**
   - **Buttons:** 56px height (primary), 48px (secondary), rounded 8px
   - **Inputs:** 48px height, 16px padding, focus ring 3px primary green
   - **Cards:** 12px border radius, surface-card background, shadow-md
   - **Bottom Navigation:** 60px height, 5 tabs (owner), active state primary color
   - **Floating Action Button:** 64px diameter, green gradient, shadow-primary
   - **Toasts:** Slide-up 300ms, auto-dismiss 2-4s, border-left color coding

5. **Typography (Inter Font)**
   - Headings: 18-32px, semibold/bold
   - Body: 14-16px (minimum), normal weight
   - Prices/Numbers: 18-24px, bold, primary green
   - Labels: 12-14px, medium weight, gray

6. **Spacing (8px base)**
   - Card padding: 16px (--space-4)
   - Section gaps: 24px (--space-6)
   - Page edges: 16px (--space-4)
   - Bottom nav clearance: 60px + 16px = 76px

7. **Accessibility (WCAG 2.1 Level AA)**
   - Semantic HTML (h1, h2, h3 hierarchy)
   - ARIA labels on icon-only buttons
   - Alt text on all images
   - Keyboard navigation: Tab, Enter, Esc
   - Focus states: 3px outline, primary green

8. **Performance Budgets**
   - Initial bundle: < 200KB gzipped
   - Product images: WebP format, lazy load, < 200KB each
   - Font loading: Subset Inter (Latin only), preload
   - Code splitting: Route-based splitting for dashboard, POS, inventory

### Quick Reference

- **Design System:** See [ui_ux.md](ui_ux.md) → Design System (colors, typography, spacing, shadows)
- **Wireframes:** See [ui_ux.md](ui_ux.md) → Wireframe Descriptions (POS, Dashboard, Forms)
- **Interaction Patterns:** See [ui_ux.md](ui_ux.md) → Interaction Patterns (swipe, loading, errors)
- **Component Library:** Use shadcn/ui components, customize with design tokens

---

## Sprint 1: Foundation (Days 1-7)

**Goal:** Set up project infrastructure, design system, and implement authentication flow.

### Day 1: Project Initialization

**Tasks:**

1. [x] Install Node.js 20.x, VS Code, Git
2. [x] Create Supabase project (free tier)
3. [x] Clone starter repo: `npx create-next-app@latest vapetrack-ph --typescript --tailwind --app`
4. [x] Install dependencies:
   ```bash
   npm install @supabase/supabase-js @tanstack/react-query zustand lucide-react
   npm install -D @types/node
   ```
5. [x] Configure `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
6. [x] Set up `.env.local` with Supabase keys
7. [x] Create folder structure (see [README.md](/README.md) → Project Structure)

**Deliverables:**

- [x] Dev server runs: `npm run dev`
- [x] Tailwind CSS working (test with a colored `<div>`)
- [x] No console errors

**Definition of Done:**

- [x] All dependencies installed successfully
- [x] Dev server starts without errors
- [x] Tailwind styles render correctly
- [x] `.env.local` configured with Supabase credentials

---

### Day 2-3: Database Schema & RLS Setup

**Tasks:**

**Day 2 Morning:**

1. [x] Read [SCHEMA.md](SCHEMA.md) thoroughly
2. [x] Create migration file: `supabase/migrations/001_initial_schema.sql`
3. [x] Implement core tables:
   - `organizations` (shop/tenant)
   - `users` (shop owners)
   - `branches` (physical locations)

**Day 2 Afternoon:**

1. [x] Create product tables:
   - `product_categories`
   - `products`
   - `product_variants`
   - `inventory` (stock per branch/variant)

**Day 3 Morning:**

1. [x] Create transaction tables:
   - `transactions` (sales)
   - `transaction_items` (line items)
   - `stock_movements` (audit trail)

**Day 3 Afternoon:**

1. [x] Apply migration via Supabase Dashboard (SQL Editor)
2. [x] Create RLS policies for multi-tenancy (see [SCHEMA.md](SCHEMA.md) → RLS Policies)
3. [x] Generate TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id <ref> > types/database.ts
   ```

**Deliverables:**

- [x] All tables created in Supabase
- [x] RLS policies active on all tables
- [x] TypeScript types generated

**Definition of Done:**

- [x] SQL migration runs without errors
- [x] All tables visible in Supabase Table Editor
- [x] RLS policies show as "Enabled" for all tables
- [x] `types/database.ts` file exists and exports types

---

### Day 4-5: Authentication Implementation

**Tasks:**

**Day 4:**

1. [x] Create Supabase client factories:
   - `lib/supabase/client.ts` (browser client)
   - `lib/supabase/server.ts` (server-side client)
2. [x] Create authentication pages:
   - `app/(auth)/login/page.tsx`
   - `app/(auth)/signup/page.tsx`
3. [x] Add shadcn/ui components:
   ```bash
   npx shadcn@latest add button input label card
   ```
4. [x] Build login form (email + password)
5. [x] Build signup form (email + password + shop name)

**Day 5:**

1. [x] Create Server Actions:
   - `app/actions/auth.ts` (login, signup, logout)
2. [x] Implement signup flow:
   - Create user in `auth.users` (Supabase Auth)
   - Create organization record
   - Create user record in `users` table
   - Create default branch
3. [x] Implement login flow:
   - Validate credentials
   - Set session cookie
   - Redirect to dashboard
4. [x] Create auth middleware:
   - `middleware.ts` (protect dashboard routes)

**Deliverables:**

- [x] Signup creates organization + user + default branch
- [x] Login redirects to dashboard
- [x] Protected routes redirect to login if not authenticated

**Definition of Done:**

- [x] Can sign up new user (creates org + user + branch)
- [x] Can log in with valid credentials
- [x] Protected pages redirect to login when not authenticated
- [x] Session persists across page reloads
- [x] Works on mobile view (375×667px)

---

### Day 6-7: Dashboard Layout & Organization Setup

**Tasks:**

**Day 6:**

1. [x] Create dashboard layout:
   - `app/(dashboard)/layout.tsx` (bottom navigation for mobile)
   - `components/layouts/DashboardLayout.tsx`
2. [x] Add navigation items (mobile-first):
   - Bottom Navigation (60px height): Dashboard, POS, Inventory, Reports, Settings
   - Each nav item: 48×48px touch target, active state with primary color
   - Badge support for notifications (20px, red background)
3. [x] Add shadcn/ui components:
   ```bash
   npx shadcn@latest add navigation-menu avatar dropdown-menu sheet
   ```
4. [x] Implement user dropdown:
   - Hamburger menu (44×44px touch target)
   - Profile, Logout options
   - Drawer slides from left on mobile
5. [x] Create mobile-first responsive layout:
   - Mobile (default): Bottom navigation, hamburger menu
   - Tablet (768px+): Side-by-side layouts
   - Desktop (1024px+): Sidebar navigation replaces bottom nav
   - Max width container: 1200px on desktop

**Day 7:**

1. [x] Create organization settings page:
   - `app/(dashboard)/settings/page.tsx`
   - Display organization name, slug, owner email
   - Allow editing shop name, address, phone
2. [x] Create branch management page:
   - `app/(dashboard)/branches/page.tsx`
   - List all branches (at least default branch exists)
   - Add/edit branch form
3. [x] Test multi-tenant isolation:
   - Sign up 2 separate accounts
   - Verify each sees only their own data

**Deliverables:**

- [x] Dashboard layout with working navigation
- [x] Organization settings page (view + edit)
- [x] Branch management (list + add + edit)
- [x] Multi-tenant isolation verified

**Definition of Done:**

- [x] Dashboard layout renders on all screen sizes (375px mobile to 1280px+ desktop)
- [x] Bottom navigation works on mobile (tap switches between pages)
- [x] All touch targets ≥ 44×44px (WCAG compliance)
- [x] Dark mode styling applied (surface-app: #0f172a, surface-card: #1e293b)
- [x] User can update organization settings (form validation with inline errors)
- [x] User can add/edit branches
- [x] Multi-tenant test passes (2 orgs see separate data)
- [x] Mobile-first: Works smoothly on 375×812px (iPhone reference size)
- [x] Thumb zone optimization: Primary actions within natural thumb reach
- [x] Loading states implemented (skeleton screens)
- [x] Toast notifications show success/error feedback

---

### Sprint 1 Review Checklist

Before moving to Sprint 2, verify:

- [x] Authentication flow complete (signup, login, logout)
- [x] Database schema deployed with RLS
- [x] Dashboard layout responsive (mobile + desktop)
- [x] Organization and branch management working
- [x] Multi-tenant isolation tested and verified
- [x] TypeScript types generated and imported
- [x] No console errors or warnings
- [x] Code committed to Git with descriptive messages

**Estimated Time:** 40-50 hours (full week, 8-10 hours/day)

**✅ STATUS: COMPLETED** (February 16, 2026)

---

## Sprint 2: Inventory Management (Days 8-14)

**Goal:** Implement product catalog, variants, and inventory tracking.

### Day 8-9: Product Categories & Base Products

**Tasks:**

**Day 8:**

1. [x] Create product category management:
   - `app/(dashboard)/inventory/categories/page.tsx`
   - List categories
   - Add/edit category form
   - Delete category (soft delete)
   
3. [x] Create Server Actions:
   - `app/actions/categories.ts` (CRUD operations)
4. [x] Implement category list with search/filter

**Day 9:**

1. [x] Create product list page:
   - `app/(dashboard)/inventory/page.tsx`
   - Display products in table/grid view
   - Show product name, brand, category, variant count
   - Search by name/SKU
   - Filter by category, active status
2. [x] Add TanStack Query hooks:
   - `lib/hooks/useProducts.ts`
   - `useProducts()` - fetch all products
   - `useProductById(id)` - fetch single product

**Deliverables:**

- [x] Category CRUD functional
- [x] Product list with search/filter
- [x] TanStack Query caching working

**Definition of Done:**

- [x] Can create/edit/delete categories
- [x] Product list loads and displays correctly
- [x] Search filters products by name/SKU
- [x] Category filter works
- [x] Loading states show spinner/skeleton
- [x] Mobile-optimized (table scrolls horizontally if needed)

---

### Day 10-11: Product & Variant Management

**Tasks:**

**Day 10:**

1. [ ] Create "Add Product" page:
   - `app/(dashboard)/inventory/products/new/page.tsx`
   - Form fields: name, brand, description, category
2. [ ] Add shadcn/ui components:
   ```bash
   npx shadcn@latest add form select textarea
   ```
3. [ ] Implement product form with validation:
   - Use React Hook Form or native form validation
   - Required fields: name, category
4. [ ] Create Server Action:
   - `app/actions/products.ts` → `createProduct()`

**Day 11:**

1. [ ] Create variant management component:
   - `components/inventory/VariantManager.tsx`
   - Embedded in product form
   - Add/remove variants dynamically
   - Fields per variant: name, SKU, price, capital cost, initial stock
2. [ ] Update `createProduct()` Server Action:
   - Insert product
   - Insert variants in single transaction
   - Create initial inventory records (for each branch)
3. [ ] Create "Edit Product" page:
   - `app/(dashboard)/inventory/products/[id]/edit/page.tsx`
   - Pre-fill form with existing data
   - Allow editing variants (add new, edit existing)

**Deliverables:**

- [ ] Can add product with multiple variants
- [ ] Variants saved correctly with SKUs and pricing
- [ ] Initial inventory created for default branch
- [ ] Can edit existing products and variants

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

1. [ ] Create inventory view page:
   - `app/(dashboard)/inventory/stock/page.tsx`
   - Show all variants with current stock levels
   - Group by product
   - Color-coded: Green (sufficient), Yellow (low), Red (out of stock)
2. [ ] Add quick stock adjustment:
   - Inline input to increase/decrease stock
   - "Add Stock" and "Remove Stock" buttons
   - Updates `inventory` table
   - Creates `stock_movements` audit record

**Day 13:**

1. [ ] Create Postgres function for stock adjustment:
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
2. [ ] Implement RPC call in Server Action:
   - `app/actions/inventory.ts` → `adjustStock()`
   ```typescript
   await supabase.rpc('adjust_stock', { ... });
   ```
3. [ ] Create stock movement history page:
   - `app/(dashboard)/inventory/history/page.tsx`
   - Show all stock movements (timestamp, user, type, quantity, reason)
   - Filter by date range, product, branch

**Deliverables:**

- [ ] Inventory view with real-time stock levels
- [ ] Stock adjustment functional
- [ ] Stock movements logged in audit table
- [ ] Cannot reduce stock below 0

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

1. [ ] Create low stock alerts dashboard widget:
   - `components/dashboard/LowStockWidget.tsx`
   - Query variants with stock < 5
   - Display in dashboard home page
2. [ ] Add notification badge to Inventory nav item
3. [ ] Polish UI:
   - Add loading skeletons for tables
   - Improve mobile responsiveness
   - Add empty states ("No products yet")
4. [ ] Write unit tests for stock adjustment logic (optional but recommended)

**Deliverables:**

- [ ] Low stock alerts visible on dashboard
- [ ] Inventory UI polished and mobile-friendly

**Definition of Done:**

- [ ] Dashboard shows low stock products (if any)
- [ ] All inventory pages work on mobile (375×667px)
- [ ] Loading states implemented (skeleton screens)
- [ ] Empty states show helpful messages
- [ ] No console errors or warnings

---

### Sprint 2 Review Checklist

Before moving to Sprint 3, verify:

- [ ] [ ] Product categories management complete
- [ ] [ ] Product & variant CRUD functional
- [ ] [ ] Stock adjustment working with audit trail
- [ ] [ ] Low stock alerts display correctly
- [ ] [ ] Multi-branch inventory tracking works
- [ ] [ ] Mobile-responsive on all inventory pages
- [ ] [ ] TypeScript types up-to-date
- [ ] [ ] Code committed with clear messages

**Estimated Time:** 45-55 hours (full week)

---

## Sprint 3: Point of Sale (POS) (Days 15-21)

**Goal:** Build a fast, mobile-optimized POS interface for processing sales.

### Day 15-16: POS UI & Cart State

**Tasks:**

**Day 15:**

1. [ ] Create POS layout (mobile-first):
   - `app/(dashboard)/pos/page.tsx`
   - Mobile: Full-screen product grid + floating cart button
   - Tablet/Desktop: Split view (products left, cart right)
   - Header: 60px height, cart badge, search icon
   - Floating checkout button: Full-width minus 32px, 64px height, green gradient
2. [ ] Create cart state with Zustand:
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

3. [ ] Add shadcn/ui components:
   ```bash
   npx shadcn@latest add sheet separator scroll-area
   ```

**Day 16:**

1. [ ] Create product grid component:
   - `components/pos/ProductGrid.tsx`
   - 2-column grid on mobile (164×200px cards), 3-col on tablet, 4-col on desktop
   - Product card: Image (164×120px, lazy load), Name (14px, 2-line truncate), Price (18px bold, primary green)
   - Low stock badge: Yellow background, 12px text, "LOW" label
   - Active state: Scale 0.98 on tap, haptic feedback
2. [ ] Implement search/filter:
   - Search bar: 56px height, magnifying glass icon, "Search products..." placeholder
   - Category chips: Horizontal scroll, 36px height, filled/outlined states
   - Real-time filtering: Debounced 200ms, no submit button
   - Focus state: Expand to full width, show recent searches
3. [ ] Create cart display component:
   - `components/pos/POSCart.tsx`
   - Line items: Product name + variant, quantity stepper (48×48px buttons), price
   - Swipe left to delete: Show red delete button
   - Subtotal: 18px bold, prominent display
   - "Clear Cart" button: Outlined, 48px height
   - `components/pos/POSCart.tsx`
   - List all cart items
   - Show quantity steppers (+/-)
   - Display subtotal
   - "Clear Cart" button

**Deliverables:**

- [ ] POS layout with product grid and cart
- [ ] Can add items to cart
- [ ] Cart updates in real-time

**Definition of Done:**

- [ ] POS page loads quickly (First Contentful Paint < 1.5s)
- [ ] Product grid displays all active variants (2-col on mobile)
- [ ] Product images lazy load (WebP format preferred)
- [ ] Tapping product opens variant selector OR adds to cart (if no variants)
- [ ] Cart badge shows item count with pulse animation on add
- [ ] Cart shows correct quantities and prices
- [ ] Quantity stepper: 48×48px buttons, tactile feedback
- [ ] Can swipe left on cart item to delete
- [ ] Subtotal calculates correctly in real-time
- [ ] Floating checkout button: Fixed bottom, primary green gradient, 64px height
- [ ] Works smoothly on mobile (one-handed operation, thumb-zone optimized)
- [ ] All touch targets ≥ 44×44px
- [ ] Optimistic UI: Instant feedback, syncs in background

---

### Day 17-18: Checkout Flow & Transaction Processing

**Tasks:**

**Day 17:**

1. [ ] Create checkout bottom sheet:
   - `components/pos/CheckoutModal.tsx`
   - Slides up from bottom (iOS-style modal), rounded corners (16px top)
   - Drag handle: 40×4px, centered
   - Semi-transparent backdrop (black, 40% opacity, blur)
   - Swipe down to dismiss OR tap outside OR tap close button
2. [ ] Add payment method selector:
   - Large buttons: Cash, GCash, Card (96×80px each)
   - Icons: 💵, 📱, 💳 (emoji + label)
   - Single-choice selection, primary fill on active
   - Remember last-used payment method
3. [ ] Add form validation:
   - Ensure cart not empty (disable checkout button)
   - Payment method required (highlight if not selected)
   - Customer name (optional, 48px text input)

**Day 18:**

1. [ ] Create Postgres function for transaction processing:
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
2. [ ] Create Server Action:
   - `app/actions/sales.ts` → `createSale()`

   ```typescript
   export async function createSale(items: CartItem[], paymentMethod: string) {
     const supabase = createServerClient();
     const { data, error } = await supabase.rpc("process_sale", {
       p_branch_id: currentBranchId,
       p_items: JSON.stringify(items),
       p_payment_method: paymentMethod,
     });

     if (error) throw error;
     return data; // transaction_id
   }
   ```

3. [ ] Integrate checkout with TanStack Query:
   - Use `useMutation` for optimistic updates
   - Clear cart on success
   - Show success toast with transaction ID

**Deliverables:**

- [ ] Checkout modal functional
- [ ] `process_sale()` RPC working
- [ ] Sale deducts inventory correctly
- [ ] Transaction and items saved to database

**Definition of Done:**

- [ ] Checkout bottom sheet slides up smoothly (300ms transition)
- [ ] Displays correct totals (subtotal, 18px bold)
- [ ] Payment method buttons: 96×80px, visual feedback on tap
- [ ] Last-used payment method pre-selected
- [ ] "Complete Sale" button: Full-width, 64px height, green gradient, disabled if invalid
- [ ] Loading state: Spinner animation during API call, disable button
- [ ] Success: Green checkmark animation + haptic feedback + toast
- [ ] "Confirm Sale" processes transaction atomically
- [ ] Inventory deducted correctly for each item (RPC function)
- [ ] Stock movements created with type "sale"
- [ ] Profit calculated and saved
- [ ] Cart clears after successful sale
- [ ] Toast notification: "Sale completed! Transaction #12345" (2s auto-dismiss)
- [ ] Cannot sell more than available stock (validation with specific error: "Only 3 units available")
- [ ] Transaction processing completes in <2 seconds
- [ ] Error handling: Red toast with retry button on failure
- [ ] Optimistic UI: Assume success, rollback on error

---

### Day 19-20: Transaction History & Receipt

**Tasks:**

**Day 19:**

1. [ ] Create transaction history page:
   - `app/(dashboard)/pos/history/page.tsx`
   - List all transactions (today, this week, all time)
   - Display: Date, Time, Total Amount, Profit, Payment Method
   - Filter by date range
   - Search by transaction ID
2. [ ] Add pagination (if >100 transactions)

**Day 20:**

1. [ ] Create transaction detail modal:
   - Click transaction to view full details
   - Show all line items (product, variant, quantity, price)
   - Display subtotal, total, profit
   - Show payment method, timestamp, user
2. [ ] Add "Print Receipt" button (optional):
   - Use `window.print()` for browser print dialog
   - Format for 80mm thermal printer (optional enhancement)
3. [ ] Create receipt template component:
   - `components/pos/Receipt.tsx`
   - Shop name, address, phone (from organization)
   - Transaction ID, date/time
   - Line items table
   - Total amount
   - "Thank you" message

**Deliverables:**

- [ ] Transaction history with search/filter
- [ ] Transaction detail view
- [ ] Printable receipt (basic)

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

1. [ ] Implement optimistic UI for POS:
   - Add item to cart: Instant visual feedback
   - Remove item: Instant removal (no loading state)
   - Checkout: Show "Processing..." modal, assume success
2. [ ] Add error handling:
   - Insufficient stock: Show specific error message ("Only 3 units available")
   - Network failure: Queue transaction for retry (future enhancement)
   - Show user-friendly error toasts
3. [ ] Performance optimization:
   - Lazy load product images (if any)
   - Virtualize product grid (if >100 products)
   - Debounce search input (300ms delay)
4. [ ] Add keyboard shortcuts (optional):
   - `F2`: Focus search
   - `F12`: Checkout
   - `Esc`: Clear cart

**Deliverables:**

- [ ] POS interface optimized for speed
- [ ] Comprehensive error handling
- [ ] Keyboard shortcuts (optional)

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

- [ ] [ ] POS interface fully functional
- [ ] [ ] Can add items to cart and adjust quantities
- [ ] [ ] Checkout processes sale correctly
- [ ] [ ] Inventory deducted atomically
- [ ] [ ] Transaction history displays all sales
- [ ] [ ] Receipt template renders correctly
- [ ] [ ] Optimistic UI implemented
- [ ] [ ] Error handling comprehensive
- [ ] [ ] Mobile-optimized (can sell with one hand)
- [ ] [ ] Code committed with clear messages

**Estimated Time:** 50-60 hours (full week)

---

## Sprint 4: Analytics & Polish (Days 22-28)

**Goal:** Add basic analytics, polish UI, and deploy to production.

### Day 22-23: Dashboard Analytics

**Tasks:**

**Day 22:**

1. [ ] Create dashboard home page:
   - `app/(dashboard)/dashboard/page.tsx`
2. [ ] Add shadcn/ui components:
   ```bash
   npx shadcn@latest add card badge alert tabs
   ```
3. [ ] Add personalized greeting:
   - "Good morning, Juan! ☀️" (18px, dynamic based on time)
   - Branch selector: Pill button, dropdown icon, filters all dashboard data
4. [ ] Create metric cards:
   - `components/dashboard/MetricCard.tsx`
   - Sales hero card: 120px height, green gradient background, white text
     - Revenue: 32px bold
     - Trend indicator: 📈 +15% vs yesterday (14px)
     - Profit: 16px, owners only
   - Quick stats grid: 2 columns on mobile, 100px height each
     - Number: 24px bold, primary color
     - Label: 12px, gray, uppercase
   - Icons from lucide-react (ShoppingCart, TrendingUp, DollarSign)

**Day 23:**

1. [ ] Create low stock alerts widget:
   - `components/dashboard/LowStockWidget.tsx`
   - Header: ⚠️ icon + "LOW STOCK ALERTS" + item count badge (yellow accent)
   - List: Max 3 items shown, bullet + product name + stock count (red text)
   - Each item tappable → Navigate to product detail
   - "View All Low Stock →" link to full inventory list
2. [ ] Create recent transactions widget:
   - `components/dashboard/RecentTransactions.tsx`
   - List: Icon (💰) + staff name + amount + relative time ("2m ago")
   - Max 3 items, "View All Activity →" expands
   - Click to view transaction details
3. [ ] Create top-selling products widget:
   - `components/dashboard/TopProducts.tsx`
   - Numbered list (1, 2, 3), max 3 shown
   - Display: Rank (bold, primary) + Product name + Units sold (gray)
   - "View Full Report →" link
4. [ ] Implement Incremental Static Regeneration (ISR):
   ```typescript
   // app/(dashboard)/dashboard/page.tsx
   export const revalidate = 60; // Refresh every 60 seconds
   ```

**Deliverables:**

- [ ] Dashboard with today's key metrics
- [ ] Recent transactions and top products widgets
- [ ] Auto-refreshing data (ISR)

**Definition of Done:**

- [ ] Dashboard loads in <1 second (First Contentful Paint < 1.5s)
- [ ] Personalized greeting displays with time-based emoji (☀️/🌙)
- [ ] Branch selector works (tap → modal with branch list, large touch targets)
- [ ] Sales hero card: Green gradient, revenue (32px), profit (owners only), trend indicator
- [ ] Quick stats grid: 2 columns on mobile, correct calculations
- [ ] Metrics display correct values (verify with database queries)
- [ ] Low stock alerts: Yellow accent, max 3 items, tappable → product detail
- [ ] Recent transactions: Icon + text + time, max 3 items
- [ ] Top products: Numbered list, max 3 items
- [ ] All "View All" links work and navigate correctly
- [ ] Mobile-responsive: Stacks vertically on 375px screen, 16px padding
- [ ] Skeleton screens show during loading (gradient animation)
- [ ] Empty states: Helpful messages with CTAs ("No sales yet. Make your first sale!")
- [ ] ISR configured: Auto-refresh every 60 seconds
- [ ] Pull to refresh works (mobile gesture)

---

### Day 24-25: Reports & Data Export

**Tasks:**

**Day 24:**

1. [ ] Create reports page:
   - `app/(dashboard)/reports/page.tsx`
   - Date range selector (Today, This Week, This Month, Custom)
   - Generate report button
2. [ ] Create sales summary report:
   - Total Revenue
   - Total Profit
   - Total Transactions
   - Average Transaction Value
   - Breakdown by payment method
3. [ ] Create inventory report:
   - Total products
   - Total variants
   - Total inventory value (sum of stock × capital_cost)
   - Low stock items count

**Day 25:**

1. [ ] Add CSV export functionality:
   - Export transactions to CSV
   - Export products/inventory to CSV
   - Use browser download (no server-side processing)
   ```typescript
   function exportToCSV(data: any[], filename: string) {
     const csv = convertToCSV(data);
     const blob = new Blob([csv], { type: "text/csv" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `${filename}-${new Date().toISOString()}.csv`;
     a.click();
   }
   ```
2. [ ] Polish reports UI:
   - Add loading states
   - Show empty state if no data
   - Format currency and dates

**Deliverables:**

- [ ] Reports page with date range filtering
- [ ] Sales and inventory summary reports
- [ ] CSV export functional

**Definition of Done:**

- [ ] Can generate sales report for any date range
- [ ] Report displays accurate metrics (verify manually)
- [ ] CSV export downloads correctly
- [ ] CSV file opens in Excel/Google Sheets
- [ ] Mobile-responsive (tables scroll horizontally)

---

### Day 26: UI/UX Polish

**Tasks:**

1. [ ] Finalize dark mode styling:
   - Verify all components use design system colors:
     - App background: #0f172a (Slate 950)
     - Card background: #1e293b (Slate 800)
     - Elevated surfaces: #334155 (Slate 700)
     - Primary green: #22c55e (Green 500)
   - Test contrast ratios: WCAG AAA (7:1+ for text)
   - Default to dark theme (no light mode toggle in MVP)
2. [ ] Add loading states everywhere:
   - Skeleton screens for lists (gradient animation, 1.5s duration)
   - Button loading: Spinner replaces text, 24px size
   - Page loading: Full-screen skeleton with logo
   - Infinite scroll: Spinner at bottom (if >100 items)
   - Use shadcn/ui skeleton component:
     ```bash
     npx shadcn@latest add skeleton
     ```
3. [ ] Improve error handling:
   - Toast notifications for all errors (slide-up animation, 300ms)
   - Toast types: Success (green border), Error (red border), Warning (yellow border)
   - Error toasts: 4s duration, "Retry" button if network error
   - Form validation: Inline errors below field, red border, clear messaging
   - Clear error messages: User-friendly text ("Product not found" not "Error 404")
   - Network errors: "Connection lost. Retrying..." with retry button
   - Install `sonner` for better toasts:
     ```bash
     npm install sonner
     ```
4. [ ] Add empty states:
   - All lists: Icon (64px gray) + Title (18px) + Description (14px) + CTA button
   - Examples:
     - "No products yet. Add your first product!" → [+ Add Product] button
     - "No sales today. Start selling!" → [Open POS] button
     - "Cart is empty. Add items to get started."
   - Use lucide-react icons: Package, ShoppingCart, Inbox, AlertCircle
5. [ ] Accessibility improvements (WCAG 2.1 Level AA):
   - Add ARIA labels to all icon-only buttons
   - Semantic HTML: Proper heading hierarchy (h1, h2, h3)
   - Alt text for all images (product images, logos)
   - Focus states: 3px outline, primary green color, visible on keyboard nav
   - Focus order: Logical tab order (top→bottom, left→right)
   - Keyboard navigation: All actions accessible via keyboard
   - Screen reader testing: Test with NVDA/VoiceOver (optional)
   - Skip to main content link (for keyboard users)
6. [ ] Mobile optimizations:
   - Verify all touch targets ≥ 44×44px (WCAG requirement)
   - Test on real device: iPhone/Android (375×812px reference)
   - Thumb-zone navigation: Bottom nav, floating buttons, one-handed use
   - Swipe gestures: Left to delete, down to dismiss, pull to refresh
   - Haptic feedback: Add to cart, checkout, delete (where supported)
   - Image optimization: WebP format, lazy loading, responsive srcset

**Deliverables:**

- [ ] Dark theme applied throughout app
- [ ] Loading states for all async operations
- [ ] Toast notifications for success/error
- [ ] Empty states with helpful CTAs
- [ ] Accessibility basics covered
- [ ] Mobile-optimized (tested on small screen)

**Definition of Done:**

- [ ] Dark theme consistent: All pages use design system colors (#0f172a app, #1e293b cards)
- [ ] Contrast ratios verified: WCAG AAA (7:1+) for all text
- [ ] All buttons show loading spinner during async ops (24px spinner, centered)
- [ ] Toast notifications: Success/error/warning for all user actions, auto-dismiss 2-4s
- [ ] Empty states: Icon + title + description + CTA on all empty lists
- [ ] Keyboard navigation: Full app navigable, visible focus states (3px green outline)
- [ ] Screen reader: All buttons/images have proper labels/alt text
- [ ] All touch targets ≥ 44×44px verified on 375px screen
- [ ] Mobile gestures work: Swipe to delete, pull to refresh, swipe down to dismiss
- [ ] Haptic feedback: Tactile confirmation on key actions (where supported)
- [ ] No accessibility warnings in browser console (axe DevTools)
- [ ] Image optimization: WebP format, lazy loading, responsive images
- [ ] Animations respect `prefers-reduced-motion` (optional)

---

### Day 27: Testing & Bug Fixes

**Tasks:**

1. [ ] End-to-end testing:
   - **Scenario 1:** Sign up → Add product → Adjust stock → Make sale → View dashboard
   - **Scenario 2:** Multi-tenant isolation (2 orgs see separate data)
   - **Scenario 3:** Add product with 3 variants → Sell all 3 → Verify inventory deducted
   - **Scenario 4:** POS speed test (add item → checkout in <30 seconds)
   - **Scenario 5:** Mobile one-handed use (navigate entire app with thumb)
2. [ ] Cross-browser testing:
   - Chrome (primary, latest version)
   - Safari (iOS, mobile browser)
   - Firefox (optional, but recommended)
   - Edge (optional)
3. [ ] Mobile device testing:
   - Test on real Android/iPhone (if available, 5.5"-6.7" screens)
   - Use Chrome DevTools device emulation: iPhone 12 Pro (390×844px), Pixel 5 (393×851px)
   - Test gestures: Swipe, long-press, pull-to-refresh
   - Verify touch targets: All ≥ 44×44px
   - Test in portrait AND landscape orientations
4. [ ] Fix identified bugs:
   - Create GitHub issues for each bug (use labels: critical, high, medium, low)
   - Prioritize: Critical (blocks core flows), High (UX issues), Medium/Low (polish)
   - Fix critical and high-priority bugs before deployment
5. [ ] Performance audit (Lighthouse in Chrome DevTools):
   - Target scores: Performance >90, Accessibility >90, Best Practices >90
   - Metrics:
     - First Contentful Paint (FCP) < 1.5s (critical < 2.5s)
     - Largest Contentful Paint (LCP) < 2.0s (critical < 3.0s)
     - Time to Interactive (TTI) < 3.0s (critical < 4.5s)
     - Cumulative Layout Shift (CLS) < 0.1 (critical < 0.25)
     - First Input Delay (FID) < 100ms (critical < 300ms)
   - Test conditions: 3G Fast network (Chrome DevTools throttling)
   - Fix issues: Optimize images (WebP, compress), lazy load, code splitting, remove render-blocking scripts
   - Bundle size: Target < 200KB gzipped for initial load

**Deliverables:**

- [ ] All critical bugs fixed
- [ ] Multi-tenant isolation verified
- [ ] Mobile testing complete
- [ ] Lighthouse score >90

**Definition of Done:**

- [ ] Core user flows work end-to-end (sign up → sell → view dashboard)
- [ ] POS speed test passes: Complete sale in <30 seconds
- [ ] Multi-tenant test passes (2 orgs see separate data, no leakage)
- [ ] No critical bugs remaining (high-priority bugs documented for post-MVP)
- [ ] Cross-browser: Works on Chrome, Safari (iOS), Firefox
- [ ] Mobile device: Works on real device OR emulated (375×812px minimum)
- [ ] All touch targets verified ≥ 44×44px
- [ ] Mobile gestures functional (swipe, long-press, pull-to-refresh)
- [ ] Lighthouse scores:
  - Performance >90 (FCP <1.5s, LCP <2.0s, TTI <3.0s)
  - Accessibility >90 (WCAG AA compliance)
  - Best Practices >90
- [ ] Bundle size < 200KB gzipped for initial load
- [ ] Images optimized: WebP format, lazy loading, compressed
- [ ] No console errors or warnings in production build

---

### Day 28: Deployment & Documentation

**Tasks:**

**Morning:**

1. [ ] Create `.env.example` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
2. [ ] Update README.md with final setup instructions
3. [ ] Write deployment guide in README (Vercel section)
4. [ ] Commit all code to GitHub:
   ```bash
   git add .
   git commit -m "feat: MVP complete - ready for deployment"
   git push origin main
   ```

**Afternoon:**

1. [ ] Deploy to Vercel:
   - Import GitHub repo in Vercel Dashboard
   - Configure environment variables (Supabase keys)
   - Deploy
2. [ ] Test production deployment:
   - Sign up new account on production URL
   - Complete full user flow (add product → sell → dashboard)
   - Test on mobile device (access Vercel URL)
3. [ ] Configure custom domain (optional):
   - Add domain in Vercel settings
   - Update DNS records
4. [ ] Set up analytics:
   - Enable Vercel Analytics (free tier)
   - Monitor initial traffic

**Evening:**

1. [ ] Create launch checklist:
   - [ ] Production URL works
   - [ ] Can sign up new users
   - [ ] All core features functional
   - [ ] No console errors
   - [ ] Mobile-responsive
2. [ ] Announce MVP completion:
   - Share production URL with test users (optional)
   - Gather initial feedback

**Deliverables:**

- [ ] Application deployed to Vercel
- [ ] Production environment tested and working
- [ ] Documentation up-to-date
- [ ] Analytics enabled

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

- [ ] [ ] Dashboard displays today's sales and profit
- [ ] [ ] Reports generate correctly with CSV export
- [ ] [ ] Dark theme applied throughout
- [ ] [ ] All loading states and error handling implemented
- [ ] [ ] Mobile-optimized and tested
- [ ] [ ] Deployed to Vercel and accessible
- [ ] [ ] Multi-tenant isolation working in production
- [ ] [ ] All critical bugs fixed
- [ ] [ ] Documentation complete (README, ROADMAP)
- [ ] [ ] Code committed with clear messages

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

1. [ ] Run dev server: `npm run dev`
2. [ ] Open in Chrome
3. [ ] Open DevTools (F12) → Console (check for errors)
4. [ ] Test feature you just built
5. [ ] Test on mobile view (Ctrl+Shift+M → iPhone SE)
6. [ ] Fix any issues before moving to next task

**Weekly Regression Test:**

- **Every Friday:** Complete full user flow from signup to sale
- Verify all core features still work after week's changes

### Multi-Tenant Testing

**After each RLS policy change:**

1. [ ] Sign up 2 separate accounts (Org A, Org B)
2. [ ] Add data to Org A (products, sales)
3. [ ] Login to Org B
4. [ ] Verify Org B sees ZERO data from Org A
5. [ ] Add data to Org B
6. [ ] Login back to Org A
7. [ ] Verify Org A data unchanged

### Performance Testing

**Before deployment:**

1. [ ] Open Chrome DevTools → Lighthouse
2. [ ] Run audit (Desktop + Mobile)
3. [ ] Target scores:
   - Performance: >90
   - Accessibility: >90
   - Best Practices: >90
   - SEO: >80 (optional for MVP)
4. [ ] Fix critical issues (red/orange items)

### Browser Compatibility

**Minimum testing:**

- [ ] Chrome (latest) - Primary
- [ ] Safari (latest) - iPhone users
- [ ] Firefox (latest) - Optional

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

- [ ] **100% Core Features Complete:** Auth, Inventory, POS, Dashboard
- [ ] **Lighthouse Score >90:** Performance and Accessibility
- [ ] **Zero Critical Bugs:** All blockers resolved
- [ ] **Multi-Tenant Tested:** 2+ organizations verified
- [ ] **Mobile-Optimized:** Works smoothly on 375×667px screen
- [ ] **Deployed to Production:** Accessible via public URL

### User Flow Metrics

- [ ] **Signup to First Sale:** <5 minutes
- [ ] **Add Product:** <2 minutes
- [ ] **Process Sale:** <30 seconds
- [ ] **View Dashboard:** <1 second load time

### Code Quality Metrics

- [ ] **TypeScript Coverage:** 100% (no `any` types)
- [ ] **ESLint Errors:** 0
- [ ] **Console Errors:** 0 (in production)
- [ ] **Git Commits:** 50+ (daily commits)

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

- [ ] **End of Sprint 1:** Working auth and dashboard layout
- [ ] **End of Sprint 2:** Full inventory management
- [ ] **End of Sprint 3:** Working POS (first sale processed!)
- [ ] **End of Sprint 4:** Deployed MVP (share with friends!)

---

**You've got this! 🚀**  
_Build fast, ship early, iterate based on real user feedback._

---

**Last Updated:** February 4, 2026  
**Next Review:** After Sprint 1 completion (Day 7)
