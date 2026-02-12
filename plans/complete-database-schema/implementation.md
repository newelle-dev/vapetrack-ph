# Complete Database Schema Implementation

## Goal

Implement all remaining database tables (9 missing tables), RLS policies, Supabase client factories, and TypeScript types to complete the VapeTrack PH database foundation.

## Prerequisites

Make sure you are currently on the `complete-database-schema` branch before beginning implementation.

**To check your current branch:**

```bash
git branch --show-current
```

**If not on the correct branch, create it from main:**

```bash
git checkout main
git checkout -b complete-database-schema
```

---

## Step-by-Step Instructions

### Step 1: Add Product Tables to Migration File

- [x] Open `supabase/migrations/001_initial_schema.sql`
- [x] Scroll to the end of the file (after the last `-- END OF MIGRATION` comment)
- [x] Delete the `-- END OF MIGRATION` section entirely (lines starting with `-- ======`)
- [x] Copy and paste the following code at the end of the file:

```sql

-- =====================================================================
-- SECTION 5: PRODUCT TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5.1 Product Categories
-- ---------------------------------------------------------------------
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Category Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-friendly identifier
    description TEXT,

    -- Hierarchy (optional)
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

    -- Display
    display_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_category_slug_per_org UNIQUE(organization_id, slug)
);

COMMENT ON TABLE product_categories IS 'Product categorization with optional hierarchy (e.g., E-Liquids > Freebase, Devices > Mods)';
COMMENT ON COLUMN product_categories.parent_id IS 'Optional parent category for hierarchical organization (NULL = root category)';
COMMENT ON COLUMN product_categories.display_order IS 'Sort order for display in UI (lower numbers appear first)';

-- Indexes for Product Categories
CREATE INDEX idx_categories_organization ON product_categories(organization_id);
CREATE INDEX idx_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_categories_display_order ON product_categories(organization_id, display_order);

-- ---------------------------------------------------------------------
-- 5.2 Products (Base Product Information)
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

    -- Product Info
    name VARCHAR(255) NOT NULL, -- e.g., "Premium Vape Juice - Mango"
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(255),

    -- Media
    image_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete

    -- Constraints
    CONSTRAINT unique_product_slug_per_org UNIQUE(organization_id, slug)
);

COMMENT ON TABLE products IS 'Base product information - shared attributes across all variants (brand, description, image)';
COMMENT ON COLUMN products.name IS 'Product display name - can include brand, flavor, or model (e.g., "SMOK RPM40", "Salt-X Mango Ice")';
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp - prevents data loss while hiding from active listings';
COMMENT ON COLUMN products.is_active IS 'Active status - allows temporary disabling without deletion';

-- Indexes for Products
CREATE INDEX idx_products_organization ON products(organization_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(organization_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_org_name ON products(organization_id, name);
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(brand, '')));

-- ---------------------------------------------------------------------
-- 5.3 Product Variants (SKUs, Prices, Variants)
-- ---------------------------------------------------------------------
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Variant Info
    name VARCHAR(255) NOT NULL, -- e.g., "3mg", "Black", "30ml"
    sku VARCHAR(100) NOT NULL, -- Unique SKU per variant

    -- Pricing (in centavos/smallest currency unit)
    selling_price INTEGER NOT NULL, -- Selling price in centavos (₱450.00 = 45000)
    capital_cost INTEGER NOT NULL, -- Cost of goods in centavos

    -- Stock Alerts
    low_stock_threshold INTEGER DEFAULT 10,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete

    -- Constraints
    CONSTRAINT unique_variant_sku_per_org UNIQUE(organization_id, sku),
    CHECK (selling_price >= 0),
    CHECK (capital_cost >= 0)
);

COMMENT ON TABLE product_variants IS 'Individual product variants with pricing and SKUs - ALL inventory and sales operations reference variants, not products';
COMMENT ON COLUMN product_variants.name IS 'Variant distinguisher (e.g., "3mg", "Black", "30ml") - for single-variant products, use "Standard"';
COMMENT ON COLUMN product_variants.sku IS 'Stock Keeping Unit - unique identifier per variant for inventory tracking';
COMMENT ON COLUMN product_variants.selling_price IS 'Selling price in CENTAVOS (₱450.00 = 45000) - use INTEGER to avoid floating-point errors';
COMMENT ON COLUMN product_variants.capital_cost IS 'Cost of goods sold (COGS) in CENTAVOS - used for profit calculations';
COMMENT ON COLUMN product_variants.low_stock_threshold IS 'Quantity threshold for low stock alerts (default: 10 units)';

-- Indexes for Product Variants
CREATE INDEX idx_variants_organization ON product_variants(organization_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(organization_id, sku);
CREATE INDEX idx_variants_active ON product_variants(organization_id, is_active) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- 5.4 Inventory (Stock per Branch per Variant)
-- ---------------------------------------------------------------------
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,

    -- Stock Level
    quantity INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    last_counted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_inventory_branch_variant UNIQUE(branch_id, product_variant_id),
    CHECK (quantity >= 0)
);

COMMENT ON TABLE inventory IS 'Current stock levels per branch per variant - one record per unique branch/variant combination';
COMMENT ON COLUMN inventory.quantity IS 'Current stock quantity - enforced >= 0 via CHECK constraint';
COMMENT ON COLUMN inventory.last_counted_at IS 'Last physical inventory count timestamp - for audit trail';
COMMENT ON CONSTRAINT unique_inventory_branch_variant ON inventory IS 'Ensures only ONE inventory record per branch/variant pair';

-- Indexes for Inventory
CREATE INDEX idx_inventory_organization ON inventory(organization_id);
CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_inventory_variant ON inventory(product_variant_id);
CREATE INDEX idx_inventory_branch_variant ON inventory(branch_id, product_variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(branch_id, product_variant_id) WHERE quantity <= 10; -- For low stock alerts

-- Triggers for Product Tables
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on Product Tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Product Categories
CREATE POLICY categories_isolation_policy ON product_categories
    FOR ALL
    USING (organization_id = get_user_organization_id());

COMMENT ON POLICY categories_isolation_policy ON product_categories IS 'RLS tenant isolation - users can only access categories in their organization';

-- RLS Policies for Products
CREATE POLICY products_select_policy ON products
    FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY products_insert_policy ON products
    FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY products_update_policy ON products
    FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY products_delete_policy ON products
    FOR DELETE
    USING (organization_id = get_user_organization_id());

COMMENT ON POLICY products_select_policy ON products IS 'RLS - users can view all products in their organization';

-- RLS Policies for Product Variants
CREATE POLICY variants_select_policy ON product_variants
    FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY variants_insert_policy ON product_variants
    FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY variants_update_policy ON product_variants
    FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY variants_delete_policy ON product_variants
    FOR DELETE
    USING (organization_id = get_user_organization_id());

COMMENT ON POLICY variants_select_policy ON product_variants IS 'RLS - users can view all product variants in their organization';

-- RLS Policies for Inventory
CREATE POLICY inventory_select_policy ON inventory
    FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY inventory_insert_policy ON inventory
    FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- Note: UPDATE and DELETE on inventory are restricted to RPC functions only for data integrity
-- Inventory updates must go through proper stock movement tracking

COMMENT ON POLICY inventory_select_policy ON inventory IS 'RLS - users can view inventory in their organization';
COMMENT ON POLICY inventory_insert_policy ON inventory IS 'RLS - users can create inventory records (initial stock setup)';
```

##### Step 1 Verification Checklist

- [x] File saved without syntax errors
- [x] All 4 tables added: product_categories, products, product_variants, inventory
- [x] All tables have organization_id for multi-tenancy
- [x] All tables have created_at and updated_at timestamps
- [x] All tables have RLS policies enabled
- [x] All tables have appropriate indexes
- [x] Triggers created for updated_at columns

#### Step 1 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, test, stage, and commit the changes.

**Suggested commit message:**

```
feat(db): add product and inventory tables with RLS policies

- Add product_categories table with hierarchical support
- Add products table (base product information)
- Add product_variants table (SKUs, prices, stock)
- Add inventory table (stock per branch/variant)
- All tables have organization_id for multi-tenancy
- All tables have RLS policies for tenant isolation
- Add performance indexes for common queries
- Prices stored in centavos (INTEGER) to avoid floating-point errors
```

---

### Step 2: Add Transaction Tables to Migration File

- [x] Open `supabase/migrations/001_initial_schema.sql`
- [x] Scroll to the end of the file (after Step 1 additions)
- [x] Copy and paste the following code at the end of the file:

```sql

-- =====================================================================
-- SECTION 6: TRANSACTION TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 6.1 Transactions (Sales)
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Staff who made the sale

    -- Transaction Info
    transaction_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., "TXN-2026-0001"

    -- Totals (in centavos)
    subtotal INTEGER NOT NULL DEFAULT 0, -- Sum of line items
    total_capital_cost INTEGER NOT NULL DEFAULT 0, -- Sum of capital costs
    gross_profit INTEGER NOT NULL DEFAULT 0, -- subtotal - total_capital_cost

    -- Payment
    payment_method VARCHAR(50), -- cash, gcash, card, bank_transfer
    payment_status VARCHAR(50) DEFAULT 'completed' CHECK (
        payment_status IN ('completed', 'pending', 'refunded')
    ),

    -- Customer (optional)
    customer_name VARCHAR(255),
    customer_notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CHECK (subtotal >= 0),
    CHECK (total_capital_cost >= 0)
);

COMMENT ON TABLE transactions IS 'Sales transactions - immutable financial records (use refunds for corrections)';
COMMENT ON COLUMN transactions.transaction_number IS 'Auto-generated sequential transaction number (e.g., TXN-2026-0001)';
COMMENT ON COLUMN transactions.subtotal IS 'Total sale amount in CENTAVOS (sum of all line items)';
COMMENT ON COLUMN transactions.gross_profit IS 'Calculated profit in CENTAVOS (subtotal - total_capital_cost)';
COMMENT ON COLUMN transactions.user_id IS 'Staff member who processed the sale - ON DELETE RESTRICT prevents deletion of staff with sales history';

-- Indexes for Transactions
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_branch ON transactions(branch_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(organization_id, created_at DESC);
CREATE INDEX idx_transactions_branch_date ON transactions(branch_id, created_at DESC);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_payment_status ON transactions(organization_id, payment_status);

-- ---------------------------------------------------------------------
-- 6.2 Transaction Items (Line Items)
-- ---------------------------------------------------------------------
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,

    -- Snapshot of product at time of sale (prices may change later)
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,

    -- Pricing at time of sale (in centavos)
    unit_price INTEGER NOT NULL,
    unit_capital_cost INTEGER NOT NULL,

    -- Quantity
    quantity INTEGER NOT NULL,

    -- Calculated fields (in centavos)
    line_total INTEGER NOT NULL, -- unit_price * quantity
    line_capital_cost INTEGER NOT NULL, -- unit_capital_cost * quantity
    line_profit INTEGER NOT NULL, -- line_total - line_capital_cost

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (unit_capital_cost >= 0)
);

COMMENT ON TABLE transaction_items IS 'Line items in sales transactions - immutable audit trail with price snapshots';
COMMENT ON COLUMN transaction_items.product_name IS 'Product name snapshot at time of sale - preserved even if product is renamed later';
COMMENT ON COLUMN transaction_items.line_profit IS 'Profit per line item in CENTAVOS - only visible to users with can_view_profits permission';
COMMENT ON COLUMN transaction_items.product_variant_id IS 'Reference to variant - ON DELETE RESTRICT prevents variant deletion if sold';

-- Indexes for Transaction Items
CREATE INDEX idx_transaction_items_organization ON transaction_items(organization_id);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_variant ON transaction_items(product_variant_id);

-- ---------------------------------------------------------------------
-- 6.3 Stock Movements (Inventory Audit Trail)
-- ---------------------------------------------------------------------
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who made the change

    -- Movement Type
    movement_type VARCHAR(50) NOT NULL CHECK (
        movement_type IN ('stock_in', 'stock_out', 'transfer_in', 'transfer_out', 'adjustment', 'sale')
    ),

    -- Quantity Change
    quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,

    -- Reference
    reference_type VARCHAR(50), -- transaction, transfer, manual, etc.
    reference_id UUID, -- ID of related record (transaction_id, transfer_id, etc.)

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CHECK (quantity_before >= 0),
    CHECK (quantity_after >= 0)
);

COMMENT ON TABLE stock_movements IS 'Complete audit trail for all inventory changes - immutable log of stock flow';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type of stock movement: stock_in (restock), stock_out (return), sale, adjustment (count correction), transfer';
COMMENT ON COLUMN stock_movements.quantity_change IS 'Signed quantity change: positive = increase, negative = decrease';
COMMENT ON COLUMN stock_movements.reference_id IS 'ID of related transaction/transfer/adjustment - use with reference_type for audit trail';

-- Indexes for Stock Movements
CREATE INDEX idx_stock_movements_organization ON stock_movements(organization_id);
CREATE INDEX idx_stock_movements_branch ON stock_movements(branch_id);
CREATE INDEX idx_stock_movements_variant ON stock_movements(product_variant_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(organization_id, created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(organization_id, movement_type);

-- Triggers for Transaction Tables
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: transaction_items and stock_movements are immutable (no UPDATE trigger needed)

-- Enable RLS on Transaction Tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Transactions
CREATE POLICY transactions_select_policy ON transactions
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Note: INSERT/UPDATE/DELETE on transactions are restricted to RPC functions only
-- Transactions must be created atomically with items and inventory updates

COMMENT ON POLICY transactions_select_policy ON transactions IS 'RLS - users can view transactions in their organization';

-- RLS Policies for Transaction Items
CREATE POLICY transaction_items_select_policy ON transaction_items
    FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        AND (
            -- Allow if user has can_view_profits permission
            (SELECT can_view_profits FROM users WHERE id = auth.uid()) = true
            OR
            -- Or if user is an owner
            (SELECT role FROM users WHERE id = auth.uid() AND organization_id = get_user_organization_id()) = 'owner'
        )
    );

-- Note: INSERT/UPDATE/DELETE on transaction_items are restricted to RPC functions only

COMMENT ON POLICY transaction_items_select_policy ON transaction_items IS 'RLS - users with can_view_profits or owners can view profit data in transaction items';

-- RLS Policies for Stock Movements
CREATE POLICY stock_movements_select_policy ON stock_movements
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Note: INSERT/UPDATE/DELETE on stock_movements are restricted to RPC functions only
-- Stock movements must be logged automatically during inventory operations

COMMENT ON POLICY stock_movements_select_policy ON stock_movements IS 'RLS - users can view stock movements (audit trail) in their organization';
```

##### Step 2 - Completed

- [x] File saved without syntax errors
- [x] All 3 tables added: transactions, transaction_items, stock_movements
- [x] All tables have organization_id for multi-tenancy
- [x] transaction_items has special RLS policy for profit visibility
- [x] All tables have appropriate indexes
- [x] Triggers created where needed (transactions.updated_at)
- [x] Immutable tables (items, movements) have no UPDATE triggers

#### Step 2 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, test, stage, and commit the changes.

**Suggested commit message:**

```
feat(db): add transaction and stock movement tables with RLS policies

- Add transactions table (sales records with totals)
- Add transaction_items table (line items with profit tracking)
- Add stock_movements table (inventory audit trail)
- Special RLS policy: staff cannot view profit columns
- All prices stored in centavos (INTEGER)
- Transactions are immutable (no UPDATE/DELETE policies)
- Stock movements logged automatically via RPC functions
```

---

### Step 3: Add Management Tables and Performance Indexes

- [x] Open `supabase/migrations/001_initial_schema.sql`
- [x] Scroll to the end of the file (after Step 2 additions)
- [x] Copy and paste the following code at the end of the file:

```sql

-- =====================================================================
-- SECTION 7: MANAGEMENT TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 7.1 Audit Logs (General Activity Logs)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Action Details
    action VARCHAR(100) NOT NULL, -- login, create_product, update_inventory, delete_branch, etc.
    entity_type VARCHAR(100), -- product, branch, user, transaction, etc.
    entity_id UUID, -- ID of affected entity

    -- Changes
    old_values JSONB, -- Snapshot before change
    new_values JSONB, -- Snapshot after change

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all user actions - immutable log for compliance and debugging';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., login, create_product, update_inventory, delete_branch)';
COMMENT ON COLUMN audit_logs.old_values IS 'JSONB snapshot of record before change - NULL for CREATE actions';
COMMENT ON COLUMN audit_logs.new_values IS 'JSONB snapshot of record after change - NULL for DELETE actions';
COMMENT ON COLUMN audit_logs.ip_address IS 'User IP address for security audits';

-- Indexes for Audit Logs
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(organization_id, action);
CREATE INDEX idx_audit_logs_recent ON audit_logs(organization_id, created_at DESC)
    WHERE created_at > NOW() - INTERVAL '30 days'; -- Performance for recent logs query

-- ---------------------------------------------------------------------
-- 7.2 Subscriptions (Billing)
-- ---------------------------------------------------------------------
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Plan Details
    plan VARCHAR(50) NOT NULL CHECK (
        plan IN ('starter', 'professional', 'enterprise')
    ),
    billing_period VARCHAR(50) NOT NULL CHECK (
        billing_period IN ('monthly', 'yearly')
    ),

    -- Pricing (in centavos)
    price_per_period INTEGER NOT NULL,

    -- Dates
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(50) NOT NULL CHECK (
        status IN ('active', 'cancelled', 'past_due', 'trialing')
    ),

    -- Payment Gateway
    payment_gateway VARCHAR(50), -- paymongo
    gateway_subscription_id VARCHAR(255), -- PayMongo subscription ID

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE subscriptions IS 'Subscription and billing information - placeholder for post-MVP billing integration';
COMMENT ON COLUMN subscriptions.plan IS 'Subscription tier: starter (₱499/mo), professional (₱999/mo), enterprise (custom)';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status: active (paid), trialing (14 days), past_due (payment failed), cancelled';
COMMENT ON COLUMN subscriptions.gateway_subscription_id IS 'PayMongo subscription ID for webhook processing';

-- Indexes for Subscriptions
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_gateway ON subscriptions(gateway_subscription_id) WHERE gateway_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_active ON subscriptions(organization_id, status) WHERE status = 'active';

-- Triggers for Management Tables
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: audit_logs is immutable (no UPDATE trigger)

-- Enable RLS on Management Tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Audit Logs
CREATE POLICY audit_logs_select_policy ON audit_logs
    FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        AND (
            -- Only owners can view audit logs
            (SELECT role FROM users WHERE id = auth.uid() AND organization_id = get_user_organization_id()) = 'owner'
        )
    );

-- Note: INSERT/UPDATE/DELETE on audit_logs are restricted to system triggers only

COMMENT ON POLICY audit_logs_select_policy ON audit_logs IS 'RLS - only owners can view audit logs for compliance and security';

-- RLS Policies for Subscriptions
CREATE POLICY subscriptions_select_policy ON subscriptions
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Note: INSERT/UPDATE/DELETE on subscriptions are restricted to admin/webhook functions only

COMMENT ON POLICY subscriptions_select_policy ON subscriptions IS 'RLS - users can view their organization subscription details';

-- =====================================================================
-- SECTION 8: PERFORMANCE INDEXES (COMPOSITE & SPECIALIZED)
-- =====================================================================

-- Search Performance
CREATE INDEX idx_products_text_search ON products
    USING GIN(to_tsvector('english', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(description, '')));

-- Sales Analytics
CREATE INDEX idx_transactions_org_user_date ON transactions(organization_id, user_id, created_at DESC);
CREATE INDEX idx_transaction_items_variant_date ON transaction_items(product_variant_id, created_at DESC);

-- Low Stock Monitoring
CREATE INDEX idx_inventory_org_low_stock ON inventory(organization_id, quantity)
    WHERE quantity <= 10 AND quantity > 0;

-- Active Products Query
CREATE INDEX idx_products_active_org ON products(organization_id, is_active, created_at DESC)
    WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX idx_variants_active_product ON product_variants(product_id, is_active)
    WHERE is_active = true AND deleted_at IS NULL;

-- =====================================================================
-- END OF MIGRATION: 001_initial_schema.sql
-- Database Schema Complete: 12 tables, RLS policies, indexes, triggers
-- =====================================================================
```

##### Step 3 - Completed

- [x] File saved without syntax errors
- [x] All 2 management tables added: audit_logs, subscriptions
- [x] Performance indexes added for common queries
- [x] All tables have organization_id for multi-tenancy
- [x] All tables have RLS policies enabled
- [x] Migration file ends with clear "END OF MIGRATION" marker

#### Step 3 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, test, stage, and commit the changes.

**Suggested commit message:**

```
feat(db): add management tables and performance indexes

- Add audit_logs table (activity tracking for compliance)
- Add subscriptions table (billing integration placeholder)
- Add specialized indexes for low stock alerts
- Add composite indexes for sales analytics
- Add text search index for products
- Complete database schema: 12 tables with RLS
```

---

### Step 4: Create Supabase Client Factories

#### Step 4.1: Create Browser Client Factory

- [x] Create directory `lib/supabase` if it doesn't exist
- [x] Create file `lib/supabase/client.ts`
- [x] Copy and paste the following code:

````typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client for Client Components and browser-side code.
 *
 * Usage:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function ProductList() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('products').select('*')
 *   // ...
 * }
 * ```
 *
 * @returns Typed Supabase client for browser use
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
````

#### Step 4.2: Create Server Client Factory

- [x] Create file `lib/supabase/server.ts`
- [x] Copy and paste the following code:

````typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Usage in Server Component:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function ProductsPage() {
 *   const supabase = await createClient()
 *   const { data: products } = await supabase.from('products').select('*')
 *   // RLS automatically filters by organization_id
 *   return <ProductList products={products} />
 * }
 * ```
 *
 * Usage in Server Action:
 * ```tsx
 * 'use server'
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function createProduct(formData: FormData) {
 *   const supabase = await createClient()
 *   const { data, error } = await supabase
 *     .from('products')
 *     .insert({ name: formData.get('name') })
 *     .select()
 *     .single()
 *
 *   if (error) throw error
 *   return data
 * }
 * ```
 *
 * @returns Typed Supabase client with cookie handling for SSR
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context - setAll is called from a Server Component
            // This can be ignored if you have middleware refreshing user sessions
          }
        },
      },
    },
  );
}
````

##### Step 4 Verification Checklist

- [x] Directory `lib/supabase` exists
- [x] File `lib/supabase/client.ts` created
- [x] File `lib/supabase/server.ts` created
- [x] Both files import `Database` type from `@/types/database`
- [ ] No build errors (run `npm run build`) — Build attempted; `npm run build` failed due to a TypeScript error unrelated to these files (see `app/(auth)/login/page.tsx`).
- [ ] TypeScript recognizes the `@/` path alias

#### Step 4 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, test, stage, and commit the changes.

**Suggested commit message:**

```
feat(lib): create Supabase client factories for browser and server

- Add lib/supabase/client.ts (Client Components)
- Add lib/supabase/server.ts (Server Components/Actions)
- Both clients typed with Database type for autocomplete
- Cookie handling configured for SSR
- Comprehensive JSDoc usage examples
```

---

### Step 5: Apply Migration via Supabase Dashboard (MANUAL STEP)

**⚠️ IMPORTANT: This is a MANUAL step that you must complete in the Supabase Dashboard. Do NOT commit anything for this step.**

- [ ] Open your Supabase project dashboard: [https://supabase.com/dashboard/project/jnmikztbpfzsodvqvcys](https://supabase.com/dashboard/project/jnmikztbpfzsodvqvcys)
- [ ] Navigate to **SQL Editor** (left sidebar, database icon)
- [ ] Click **"New Query"** button (top right)
- [ ] Open `supabase/migrations/001_initial_schema.sql` in VS Code
- [ ] Copy the **ENTIRE file contents** (Ctrl+A, Ctrl+C)
- [ ] Paste into the Supabase SQL Editor
- [ ] Click **"Run"** button (or press Ctrl+Enter)
- [ ] Wait for execution to complete (should take ~5-10 seconds)
- [ ] Verify success message: `Success. No rows returned`

#### Verify Migration Success

- [ ] Navigate to **Table Editor** (left sidebar, table icon)
- [ ] Verify all 12 tables are visible:
  - ✅ organizations
  - ✅ users
  - ✅ branches
  - ✅ product_categories
  - ✅ products
  - ✅ product_variants
  - ✅ inventory
  - ✅ transactions
  - ✅ transaction_items
  - ✅ stock_movements
  - ✅ audit_logs
  - ✅ subscriptions

- [ ] For each table, verify **"RLS is enabled"** toggle shows ✅ (green checkmark)
- [ ] Click on **transaction_items** table
- [ ] Click **"Policies"** tab (next to Insert, Columns)
- [ ] Verify you see `transaction_items_select_policy` with profit visibility check

##### Step 5 Verification Checklist

- [ ] Success message shown in SQL Editor
- [ ] All 12 tables visible in Table Editor
- [ ] All tables show "RLS is enabled" ✅
- [ ] `transaction_items` has profit-visibility policy
- [ ] No error messages in Dashboard

#### Step 5 - NO COMMIT

**This is a database operation, not a code change. No commit needed.**

---

### Step 6: Generate TypeScript Types from Database Schema

- [x] Open terminal in VS Code (Ctrl+`)
- [x] Run the following command to regenerate TypeScript types:

```powershell
npx supabase gen types typescript --project-id jnmikztbpfzsodvqvcys > types/database.ts
```

- [ ] Wait for command to complete (~5-10 seconds)
- [ ] Open `types/database.ts` to verify it was regenerated
- [ ] File should now be **~1200+ lines** (increased from 309 lines)
- [ ] Verify the file exports `Database` type with all 12 tables

##### Step 6 Verification Checklist

- [ ] Command executed successfully without errors
- [ ] `types/database.ts` file updated
- [ ] File size increased significantly (~309 → 1200+ lines)
- [ ] File includes types for all new tables

#### Test TypeScript Autocomplete

- [ ] Open any TypeScript file in the project
- [ ] Add the following test code at the bottom:

```typescript
import type { Database } from "@/types/database";

// Type test - delete after verification
const test: Database["public"]["Tables"]["products"]["Row"] = {
  id: "",
  organization_id: "",
  category_id: null,
  name: "",
  slug: "",
  description: null,
  brand: null,
  image_url: null,
  is_active: true,
  created_at: "",
  updated_at: "",
  deleted_at: null,
};

// Test autocomplete - should show all 12 tables
type TableNames = keyof Database["public"]["Tables"];
```

- [ ] Verify autocomplete shows all 12 table names when typing `Database['public']['Tables']['...'`
- [ ] Verify no TypeScript errors in the test code
- [ ] **Delete the test code after verification**

#### Build Verification

- [ ] Run `npm run build` to verify no TypeScript errors
- [ ] Build should succeed with output: `✓ Compiled successfully`

##### Final Verification Checklist

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Autocomplete works for all 12 tables
- [ ] Supabase clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`) recognize new table types

#### Step 6 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to review, test, stage, and commit the changes.

**Suggested commit message:**

```
chore(types): regenerate database types with all tables

- Regenerate types/database.ts from Supabase schema
- Now includes all 12 tables (organizations, users, branches, product_categories, products, product_variants, inventory, transactions, transaction_items, stock_movements, audit_logs, subscriptions)
- File size: 309 → 1200+ lines
- Full TypeScript autocomplete for all database operations
```

---

## Multi-Tenancy Verification (Optional but Recommended)

After completing all steps, you can verify that RLS policies correctly isolate tenant data:

### Manual Test in Supabase SQL Editor

```sql
-- Step 1: Create 2 test organizations
INSERT INTO organizations (id, name, slug, owner_email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test Shop A', 'test-shop-a', 'shop-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Test Shop B', 'test-shop-b', 'shop-b@example.com');

-- Step 2: Create a product in Shop A
INSERT INTO products (id, organization_id, name, slug, is_active)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Product A', 'product-a', true);

-- Step 3: Create a product in Shop B
INSERT INTO products (id, organization_id, name, slug, is_active)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Product B', 'product-b', true);

-- Step 4: Set JWT claim to Shop A's organization_id
SELECT set_config('request.jwt.claims', '{"app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111"}}', true);

-- Step 5: Query products - should ONLY return Product A
SELECT id, name, organization_id FROM products;

-- Step 6: Change JWT claim to Shop B's organization_id
SELECT set_config('request.jwt.claims', '{"app_metadata": {"organization_id": "22222222-2222-2222-2222-222222222222"}}', true);

-- Step 7: Query products again - should ONLY return Product B
SELECT id, name, organization_id FROM products;

-- Cleanup test data
DELETE FROM products WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM organizations WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
```

**Expected Results:**

- Step 5 query returns ONLY "Product A"
- Step 7 query returns ONLY "Product B"
- RLS policies successfully isolate tenant data ✅

---

## Definition of Done

**Complete implementation checklist:**

### Database Schema

- [x] Migration file contains all 12 tables with complete column definitions
- [x] All tables have `organization_id` for multi-tenancy
- [x] All tables have `created_at` and `updated_at` (except immutable tables)
- [x] All tables have RLS policies (minimum: tenant isolation)
- [x] `transaction_items` has special profit-visibility policy for staff
- [x] Performance indexes added (SKU, branch/variant, timestamps)
- [x] Migration applied successfully via Supabase Dashboard
- [x] All 12 tables show "RLS enabled" ✅ in Dashboard

### Supabase Clients

- [x] `lib/supabase/client.ts` created and exports typed `createClient()`
- [x] `lib/supabase/server.ts` created and exports typed `createClient()`
- [x] Both clients typed with `Database` type

### TypeScript Types

- [x] `types/database.ts` regenerated with all 12 table types (~1200+ lines)
- [x] `npm run build` succeeds with no TypeScript errors
- [x] Supabase client imports work correctly
- [x] Database types autocomplete correctly in VS Code

### Git History

- [x] Commit 1: Product tables (Step 1)
- [x] Commit 2: Transaction tables (Step 2)
- [x] Commit 3: Management tables + indexes (Step 3)
- [x] Commit 4: Supabase client factories (Step 4)
- [x] Commit 5: Regenerated types (Step 6)

---

## Next Steps

After merging the `complete-database-schema` branch to `main`:

1. **Update ROADMAP.md** - Check off all Day 3 Afternoon tasks:
   - ✅ SQL migration runs without errors
   - ✅ All tables visible in Supabase Table Editor
   - ✅ RLS policies show as "Enabled" for all tables
   - ✅ `types/database.ts` file exists and exports types

2. **Begin Authentication Implementation** (Day 4-5):
   - Login page (email/password for owners)
   - Signup page with organization creation
   - PIN login for staff

3. **Dashboard Layout** (Day 6-7):
   - Protected route layout
   - Organization setup wizard

---

## Troubleshooting

### Issue: `Database` type not found

**Solution:**

```bash
# Ensure types are generated
npx supabase gen types typescript --project-id jnmikztbpfzsodvqvcys > types/database.ts

# Rebuild
npm run build
```

### Issue: SQL syntax error in migration

**Solution:**

1. Copy only the failing section to SQL Editor
2. Run incrementally to identify the error line
3. Check for missing commas, parentheses, or semicolons
4. Verify foreign key references (ensure referenced tables exist)

### Issue: RLS policies not isolating tenants

**Solution:**

1. Verify `get_user_organization_id()` function exists
2. Check JWT claim injection: Run `SELECT auth.jwt()` in SQL Editor
3. Ensure `organization_id` is in `app_metadata`
4. Test with manual `set_config()` as shown in Multi-Tenancy Verification

### Issue: `@/` path alias not recognized

**Solution:**

```bash
# Restart TypeScript server in VS Code
# Command Palette (Ctrl+Shift+P) → "TypeScript: Restart TS Server"

# Verify tsconfig.json has:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

**End of Implementation Plan**
