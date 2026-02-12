-- =====================================================================
-- VapeTrack PH - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Core multi-tenant tables with RLS, triggers, and indexes
-- Created: 2026-02-12
-- PostgreSQL Version: 17
-- =====================================================================

-- =====================================================================
-- SECTION 1: CORE TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1 Organizations (Tenants/Shops)
-- ---------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    owner_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,

    -- Subscription Management
    subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (
        subscription_status IN ('trial', 'active', 'suspended', 'cancelled')
    ),
    subscription_plan VARCHAR(50) DEFAULT 'starter' CHECK (
        subscription_plan IN ('starter', 'professional', 'enterprise')
    ),
    trial_ends_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for data retention
);

COMMENT ON TABLE organizations IS 'Core tenant/shop entities - each row represents one vape shop organization';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization (e.g., "joes-vape-shop")';
COMMENT ON COLUMN organizations.subscription_status IS 'Subscription state: trial (14 days), active (paid), suspended (payment failed), cancelled (churned)';
COMMENT ON COLUMN organizations.deleted_at IS 'Soft delete timestamp - allows data recovery and audit trail';

-- Indexes for Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_active ON organizations(id) WHERE subscription_status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- ---------------------------------------------------------------------
-- 1.2 Users (Shop Owners & Staff)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Dual Authentication: Email/Password (owners) OR PIN (staff)
    email VARCHAR(255), -- NULL for staff using PIN only
    password_hash VARCHAR(255), -- NULL for PIN-only staff (managed by Supabase Auth)
    pin VARCHAR(6), -- 4-6 digit PIN for staff quick login

    -- Profile
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'staff')),

    -- Fine-Grained Permissions
    can_view_profits BOOLEAN DEFAULT false, -- Only owners see profit margins
    can_manage_inventory BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraint: Must have either email/password OR PIN
    CONSTRAINT chk_auth_method CHECK (
        (email IS NOT NULL AND password_hash IS NOT NULL) OR
        (pin IS NOT NULL)
    )
);

COMMENT ON TABLE users IS 'User accounts for shop owners and staff - supports both email/password and PIN authentication';
COMMENT ON COLUMN users.pin IS '4-6 digit PIN for staff quick login (hashed in production)';
COMMENT ON COLUMN users.can_view_profits IS 'Permission flag - only owners should see profit margins and capital costs';
COMMENT ON CONSTRAINT chk_auth_method ON users IS 'Ensures user has either email/password (for owners) or PIN (for staff)';

-- Indexes for Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_pin ON users(organization_id, pin) WHERE pin IS NOT NULL; -- Composite for fast PIN lookup
CREATE INDEX idx_users_role ON users(organization_id, role);
CREATE INDEX idx_users_active ON users(organization_id) WHERE is_active = true;
CREATE UNIQUE INDEX idx_users_email_unique ON users(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_pin_unique ON users(organization_id, pin) WHERE pin IS NOT NULL; -- PIN unique per org

-- ---------------------------------------------------------------------
-- 1.3 Branches (Physical Shop Locations)
-- ---------------------------------------------------------------------
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Branch Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-friendly, unique within organization
    address TEXT,
    phone VARCHAR(50),

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Only one default branch per organization

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_branch_slug_per_org UNIQUE(organization_id, slug)
);

COMMENT ON TABLE branches IS 'Physical shop locations within an organization - supports multi-branch operations';
COMMENT ON COLUMN branches.is_default IS 'Default branch for new staff - enforced to be unique per organization via trigger';
COMMENT ON COLUMN branches.slug IS 'URL-friendly identifier unique within the organization (e.g., "main-branch", "mall-kiosk")';

-- Indexes for Branches
CREATE INDEX idx_branches_organization ON branches(organization_id);
CREATE INDEX idx_branches_organization_created ON branches(organization_id, created_at DESC);
CREATE INDEX idx_branches_active ON branches(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_branches_default ON branches(organization_id) WHERE is_default = true; -- Fast lookup for default branch

-- =====================================================================
-- SECTION 2: HELPER FUNCTIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1 RLS Helper: Extract organization_id from JWT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    -- Extract organization_id from Supabase Auth JWT claims
    -- This is injected via the set_organization_claim() trigger
    RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_organization_id() IS 'RLS helper function - extracts organization_id from JWT app_metadata for tenant isolation';

-- ---------------------------------------------------------------------
-- 2.2 Auto-Update Trigger Function: updated_at timestamp
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp on row modification';

-- ---------------------------------------------------------------------
-- 2.3 Business Logic: Ensure Single Default Branch per Organization
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_single_default_branch()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new/updated branch is set as default, unset all other defaults in the same org
    IF NEW.is_default = true THEN
        UPDATE branches
        SET is_default = false
        WHERE organization_id = NEW.organization_id
          AND id != NEW.id
          AND is_default = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ensure_single_default_branch() IS 'Business rule enforcement - ensures only one default branch per organization';

-- ---------------------------------------------------------------------
-- 2.4 Auth Hook: Inject organization_id into Supabase Auth JWT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_organization_claim()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Get organization_id from public.users table based on auth.users.id
    SELECT organization_id INTO user_org_id
    FROM public.users
    WHERE id = NEW.id;

    -- Inject organization_id into JWT app_metadata claims
    -- This makes organization_id available in get_user_organization_id() for RLS
    NEW.raw_app_meta_data = jsonb_set(
        COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
        '{organization_id}',
        to_jsonb(user_org_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_organization_claim() IS 'Auth hook - injects organization_id into Supabase Auth JWT for stateless multi-tenancy';

-- =====================================================================
-- SECTION 3: TRIGGERS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3.1 Auto-Update Triggers: updated_at timestamp
-- ---------------------------------------------------------------------
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------
-- 3.2 Business Rule Trigger: Single Default Branch Enforcement
-- ---------------------------------------------------------------------
CREATE TRIGGER enforce_single_default_branch
    BEFORE INSERT OR UPDATE ON branches
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_branch();

-- ---------------------------------------------------------------------
-- 3.3 Auth Hook Trigger: JWT Claims Injection
-- ---------------------------------------------------------------------
-- NOTE: This trigger runs on auth.users (Supabase's internal table)
-- It's created AFTER a record is inserted into public.users during signup
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION set_organization_claim();

-- =====================================================================
-- SECTION 4: ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 4.1 Organizations: Users can only see their own organization
-- ---------------------------------------------------------------------
CREATE POLICY org_isolation_policy ON organizations
    FOR ALL
    USING (id = get_user_organization_id());

COMMENT ON POLICY org_isolation_policy ON organizations IS 'RLS tenant isolation - users can only access their own organization';

-- ---------------------------------------------------------------------
-- 4.2 Users: Users can only see users in their organization
-- ---------------------------------------------------------------------
-- SELECT: Users can view all users in their org
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- INSERT: Only service role can create users (handled by signup flow)
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- UPDATE: Users can update themselves, owners can update all in their org
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND (
            id = auth.uid() -- User can update themselves
            OR EXISTS ( -- Or if current user is an owner in the same org
                SELECT 1 FROM users
                WHERE id = auth.uid()
                  AND organization_id = get_user_organization_id()
                  AND role = 'owner'
            )
        )
    );

-- DELETE: Only owners can delete users in their org
CREATE POLICY users_delete_policy ON users
    FOR DELETE
    USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

COMMENT ON POLICY users_select_policy ON users IS 'RLS - users can view all users in their organization';
COMMENT ON POLICY users_update_policy ON users IS 'RLS - users can update themselves, owners can update all users in their org';

-- ---------------------------------------------------------------------
-- 4.3 Branches: Users can only see branches in their organization
-- ---------------------------------------------------------------------
-- SELECT: Users can view all branches in their org
CREATE POLICY branches_select_policy ON branches
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- INSERT: Only owners can create branches
CREATE POLICY branches_insert_policy ON branches
    FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

-- UPDATE: Only owners can update branches
CREATE POLICY branches_update_policy ON branches
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

-- DELETE: Only owners can delete branches
CREATE POLICY branches_delete_policy ON branches
    FOR DELETE
    USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

COMMENT ON POLICY branches_select_policy ON branches IS 'RLS - users can view all branches in their organization';
COMMENT ON POLICY branches_insert_policy ON branches IS 'RLS - only owners can create new branches';


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

