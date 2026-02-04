# Database Schema Documentation
## VapeTrack PH - Supabase (PostgreSQL) Schema

**Version:** 1.0  
**Last Updated:** February 4, 2026  
**Database:** Supabase (PostgreSQL)  
**Architecture:** Multi-tenant SaaS

---

## 📋 Table of Contents
- [Conceptual Model](#conceptual-model)
- [Entity Relationship Overview](#entity-relationship-overview)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [SQL Schema](#sql-schema)
- [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
- [Indexes](#indexes)
- [Sample Queries](#sample-queries)

---

## Conceptual Model

### Product Variants Strategy

**Problem:** Vape products often come in multiple variations:
- **Juice flavors:** Same brand with different nicotine levels (3mg, 6mg, 12mg)
- **Device colors:** Same vape device in different colors (black, silver, gold)
- **Package sizes:** Same product in different quantities (30ml, 60ml, 100ml)

**Solution:** Two-table approach with `products` and `product_variants`

#### Why Separate Tables?

1. **Data Normalization:** Shared attributes (brand, category, description) stored once in `products`
2. **Independent Pricing:** Each variant can have its own price and capital cost
3. **Individual SKUs:** Each variant gets a unique SKU for tracking
4. **Granular Inventory:** Stock tracked per variant, not per base product
5. **Sales Accuracy:** Transactions reference specific variants, ensuring accurate profit calculations

#### Example Structure

```
Product: "Premium Vape Juice - Mango"
├── Variant 1: "3mg" (SKU: PVJ-MANGO-3MG, ₱450, Stock: 10)
├── Variant 2: "6mg" (SKU: PVJ-MANGO-6MG, ₱450, Stock: 5)
└── Variant 3: "12mg" (SKU: PVJ-MANGO-12MG, ₱500, Stock: 8)
```

#### Single-Variant Products

For products without variants (e.g., "Cotton Bacon"):
- Create ONE variant with a simple name like "Standard" or matching the product name
- This maintains consistency: **all sales and inventory operations reference variants**

---

## Entity Relationship Overview

### Core Entities

```
organizations (Tenants/Shops)
    │
    ├──> users (Shop Owners & Staff)
    │
    ├──> branches (Physical locations)
    │
    ├──> product_categories
    │       │
    │       └──> products (Base product info)
    │               │
    │               └──> product_variants (SKUs, prices, variants)
    │                       │
    │                       └──> inventory (Stock per branch per variant)
    │                       │
    │                       └──> transaction_items
    │
    ├──> transactions (Sales)
    │       │
    │       └──> transaction_items (Line items)
    │
    ├──> stock_movements (Inventory audit trail)
    │
    ├──> audit_logs (General activity logs)
    │
    └──> subscriptions (Billing)
```

### Key Relationships

- **One-to-Many:** Organization → Branches
- **One-to-Many:** Organization → Users
- **One-to-Many:** Product → Product Variants
- **One-to-Many:** Transaction → Transaction Items
- **Composite Unique:** Inventory per (Branch + Product Variant)

---

## Multi-Tenant Architecture

### Data Isolation Strategy

Every data table includes `organization_id` to ensure strict tenant isolation:

✅ **Enforced via Row Level Security (RLS):**
- Users can only access data where `organization_id` matches their organization
- Database-level security (not application-level)
- Prevents accidental cross-tenant data leakage

✅ **Composite Indexes:**
- All queries filtered by `organization_id` first
- Indexes: `(organization_id, created_at)`, `(organization_id, branch_id)`, etc.

✅ **Foreign Key Constraints:**
- All relationships validated within the same organization
- Prevents orphaned records

---

## SQL Schema

### 1. Organizations (Tenants)

```sql
-- Core tenant/shop entity
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    owner_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    
    -- Subscription
    subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended, cancelled
    subscription_plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);
```

---

### 2. Users (Shop Owners & Staff)

```sql
-- User accounts (both owners and staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255), -- NULL for staff using PIN only
    password_hash VARCHAR(255), -- NULL for PIN-only staff
    pin VARCHAR(6), -- 4-6 digit PIN for staff
    
    -- Profile
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'owner', 'staff'
    
    -- Permissions
    can_view_profits BOOLEAN DEFAULT false, -- Only owners see profit data
    can_manage_inventory BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_auth_method CHECK (
        (email IS NOT NULL AND password_hash IS NOT NULL) OR 
        (pin IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_pin ON users(organization_id, pin); -- For quick PIN login
CREATE UNIQUE INDEX idx_users_email_unique ON users(email) WHERE email IS NOT NULL;
```

---

### 3. Branches

```sql
-- Physical shop locations
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Branch Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-friendly, unique within org
    address TEXT,
    phone VARCHAR(50),
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_branches_organization ON branches(organization_id);
CREATE INDEX idx_branches_active ON branches(organization_id, is_active);
```

---

### 4. Product Categories

```sql
-- Optional product categorization
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Category Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Hierarchy (optional)
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_categories_organization ON product_categories(organization_id);
CREATE INDEX idx_categories_parent ON product_categories(parent_id);
```

---

### 5. Products (Base Product)

```sql
-- Base product information (brand, description)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Constraints
    UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_products_organization ON products(organization_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(organization_id, is_active);
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(brand, '')));
```

---

### 6. Product Variants (SKUs, Prices, Variants)

```sql
-- Individual product variants with pricing and SKUs
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Constraints
    UNIQUE(organization_id, sku),
    CHECK (selling_price >= 0),
    CHECK (capital_cost >= 0)
);

-- Indexes
CREATE INDEX idx_variants_organization ON product_variants(organization_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(organization_id, sku);
CREATE INDEX idx_variants_active ON product_variants(organization_id, is_active);
```

---

### 7. Inventory (Stock per Branch per Variant)

```sql
-- Current stock levels per branch per variant
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    
    -- Stock Level
    quantity INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    last_counted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(branch_id, product_variant_id),
    CHECK (quantity >= 0)
);

-- Indexes
CREATE INDEX idx_inventory_organization ON inventory(organization_id);
CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_inventory_variant ON inventory(product_variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(branch_id, product_variant_id) WHERE quantity <= 10; -- For alerts
```

---

### 8. Transactions (Sales)

```sql
-- Sales transactions
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
    payment_status VARCHAR(50) DEFAULT 'completed', -- completed, pending, refunded
    
    -- Customer (optional)
    customer_name VARCHAR(255),
    customer_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (subtotal >= 0),
    CHECK (total_capital_cost >= 0)
);

-- Indexes
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_branch ON transactions(branch_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(organization_id, created_at DESC);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
```

---

### 9. Transaction Items (Line Items)

```sql
-- Individual items in a transaction
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (unit_capital_cost >= 0)
);

-- Indexes
CREATE INDEX idx_transaction_items_organization ON transaction_items(organization_id);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_variant ON transaction_items(product_variant_id);
```

---

### 10. Stock Movements (Inventory Audit Trail)

```sql
-- Audit trail for all inventory changes
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who made the change
    
    -- Movement Type
    movement_type VARCHAR(50) NOT NULL, -- stock_in, stock_out, transfer_in, transfer_out, adjustment, sale
    
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (quantity_before >= 0),
    CHECK (quantity_after >= 0)
);

-- Indexes
CREATE INDEX idx_stock_movements_organization ON stock_movements(organization_id);
CREATE INDEX idx_stock_movements_branch ON stock_movements(branch_id);
CREATE INDEX idx_stock_movements_variant ON stock_movements(product_variant_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(organization_id, created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
```

---

### 11. Audit Logs (General Activity Logs)

```sql
-- Comprehensive audit trail for all user actions
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(organization_id, action);
```

---

### 12. Subscriptions (Billing)

```sql
-- Subscription and billing information
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Plan Details
    plan VARCHAR(50) NOT NULL, -- starter, professional, enterprise
    billing_period VARCHAR(50) NOT NULL, -- monthly, yearly
    
    -- Pricing (in centavos)
    price_per_period INTEGER NOT NULL,
    
    -- Dates
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) NOT NULL, -- active, cancelled, past_due, trialing
    
    -- Payment Gateway
    payment_gateway VARCHAR(50), -- paymongo
    gateway_subscription_id VARCHAR(255), -- PayMongo subscription ID
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_gateway ON subscriptions(gateway_subscription_id);
```

---

## Row Level Security (RLS) Policies

Enable RLS and create policies to enforce tenant isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization_id
-- This assumes Supabase Auth stores organization_id in user metadata
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations: Users can only see their own organization
CREATE POLICY org_isolation_policy ON organizations
    FOR ALL
    USING (id = get_user_organization_id());

-- Users: Users can only see users in their organization
CREATE POLICY users_isolation_policy ON users
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Branches: Users can only see branches in their organization
CREATE POLICY branches_isolation_policy ON branches
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Product Categories: Users can only see categories in their organization
CREATE POLICY categories_isolation_policy ON product_categories
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Products: Users can only see products in their organization
CREATE POLICY products_isolation_policy ON products
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Product Variants: Users can only see variants in their organization
CREATE POLICY variants_isolation_policy ON product_variants
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Inventory: Users can only see inventory in their organization
CREATE POLICY inventory_isolation_policy ON inventory
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Transactions: Users can only see transactions in their organization
CREATE POLICY transactions_isolation_policy ON transactions
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Transaction Items: Users can only see items in their organization
CREATE POLICY transaction_items_isolation_policy ON transaction_items
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Stock Movements: Users can only see movements in their organization
CREATE POLICY stock_movements_isolation_policy ON stock_movements
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Audit Logs: Users can only see logs in their organization
CREATE POLICY audit_logs_isolation_policy ON audit_logs
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Subscriptions: Users can only see subscriptions in their organization
CREATE POLICY subscriptions_isolation_policy ON subscriptions
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Additional policy: Staff cannot view profit-related data
CREATE POLICY staff_no_profits_policy ON transaction_items
    FOR SELECT
    USING (
        organization_id = get_user_organization_id() 
        AND (
            (SELECT can_view_profits FROM users WHERE id = auth.uid()) = true
            OR auth.uid() IN (SELECT id FROM users WHERE role = 'owner' AND organization_id = get_user_organization_id())
        )
    );
```

---

## Indexes

### Performance Optimization Indexes

```sql
-- Composite indexes for common queries

-- Products search by organization
CREATE INDEX idx_products_org_name ON products(organization_id, name);

-- Inventory lookup by branch
CREATE INDEX idx_inventory_branch_variant ON inventory(branch_id, product_variant_id);

-- Transactions by date range
CREATE INDEX idx_transactions_org_date_range ON transactions(organization_id, created_at DESC);

-- Sales analytics by staff
CREATE INDEX idx_transactions_org_user_date ON transactions(organization_id, user_id, created_at DESC);

-- Low stock alerts
CREATE INDEX idx_inventory_low_stock_alert ON inventory(organization_id, quantity) 
    WHERE quantity <= 10;

-- Recent activity logs
CREATE INDEX idx_audit_logs_recent ON audit_logs(organization_id, created_at DESC) 
    WHERE created_at > NOW() - INTERVAL '30 days';

-- Active subscriptions
CREATE INDEX idx_subscriptions_active ON subscriptions(organization_id, status) 
    WHERE status = 'active';
```

---

## Sample Queries

### 1. Get All Products with Variants for a Branch

```sql
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.brand,
    pv.id AS variant_id,
    pv.name AS variant_name,
    pv.sku,
    pv.selling_price,
    pv.capital_cost,
    COALESCE(i.quantity, 0) AS stock_quantity
FROM products p
INNER JOIN product_variants pv ON pv.product_id = p.id
LEFT JOIN inventory i ON i.product_variant_id = pv.id AND i.branch_id = $1
WHERE p.organization_id = $2
    AND p.is_active = true
    AND pv.is_active = true
ORDER BY p.name, pv.name;
```

### 2. Record a Sale (Transaction)

```sql
-- Step 1: Insert transaction
INSERT INTO transactions (
    organization_id, branch_id, user_id, transaction_number,
    subtotal, total_capital_cost, gross_profit, payment_method
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING id;

-- Step 2: Insert transaction items
INSERT INTO transaction_items (
    organization_id, transaction_id, product_variant_id,
    product_name, variant_name, sku,
    unit_price, unit_capital_cost, quantity,
    line_total, line_capital_cost, line_profit
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
);

-- Step 3: Update inventory
UPDATE inventory
SET quantity = quantity - $1,
    updated_at = NOW()
WHERE branch_id = $2
    AND product_variant_id = $3;

-- Step 4: Log stock movement
INSERT INTO stock_movements (
    organization_id, branch_id, product_variant_id, user_id,
    movement_type, quantity_change, quantity_before, quantity_after,
    reference_type, reference_id
) VALUES (
    $1, $2, $3, $4, 'sale', -$5, $6, $7, 'transaction', $8
);
```

### 3. Daily Sales Report

```sql
SELECT 
    DATE(t.created_at) AS sale_date,
    COUNT(t.id) AS total_transactions,
    SUM(t.subtotal) AS total_revenue,
    SUM(t.total_capital_cost) AS total_cost,
    SUM(t.gross_profit) AS total_profit,
    ROUND((SUM(t.gross_profit)::DECIMAL / NULLIF(SUM(t.subtotal), 0)) * 100, 2) AS profit_margin_pct
FROM transactions t
WHERE t.organization_id = $1
    AND t.created_at >= DATE_TRUNC('day', NOW() - INTERVAL '30 days')
GROUP BY DATE(t.created_at)
ORDER BY sale_date DESC;
```

### 4. Top-Selling Products (Last 30 Days)

```sql
SELECT 
    p.name AS product_name,
    pv.name AS variant_name,
    pv.sku,
    SUM(ti.quantity) AS total_quantity_sold,
    SUM(ti.line_total) AS total_revenue,
    SUM(ti.line_profit) AS total_profit
FROM transaction_items ti
INNER JOIN product_variants pv ON pv.id = ti.product_variant_id
INNER JOIN products p ON p.id = pv.product_id
INNER JOIN transactions t ON t.id = ti.transaction_id
WHERE ti.organization_id = $1
    AND t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, pv.id, pv.name, pv.sku
ORDER BY total_quantity_sold DESC
LIMIT 10;
```

### 5. Low Stock Alert

```sql
SELECT 
    p.name AS product_name,
    pv.name AS variant_name,
    pv.sku,
    b.name AS branch_name,
    i.quantity AS current_stock,
    pv.low_stock_threshold
FROM inventory i
INNER JOIN product_variants pv ON pv.id = i.product_variant_id
INNER JOIN products p ON p.id = pv.product_id
INNER JOIN branches b ON b.id = i.branch_id
WHERE i.organization_id = $1
    AND i.quantity <= pv.low_stock_threshold
    AND pv.is_active = true
ORDER BY i.quantity ASC;
```

### 6. Staff Performance Report

```sql
SELECT 
    u.full_name AS staff_name,
    COUNT(t.id) AS total_transactions,
    SUM(t.subtotal) AS total_sales,
    SUM(t.gross_profit) AS total_profit,
    AVG(t.subtotal) AS average_transaction_value
FROM users u
INNER JOIN transactions t ON t.user_id = u.id
WHERE u.organization_id = $1
    AND u.role = 'staff'
    AND t.created_at >= DATE_TRUNC('month', NOW())
GROUP BY u.id, u.full_name
ORDER BY total_sales DESC;
```

---

## Database Triggers

### Auto-update timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-generate transaction numbers

```sql
-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the next number for this organization and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 'TXN-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM transactions
    WHERE organization_id = NEW.organization_id
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NEW.created_at);
    
    -- Format: TXN-YYYY-NNNN
    NEW.transaction_number := 'TXN-' || EXTRACT(YEAR FROM NEW.created_at) || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_transaction_number_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.transaction_number IS NULL)
    EXECUTE FUNCTION generate_transaction_number();
```

---

## ERD Description

```
┌─────────────────┐
│  organizations  │ (Tenants/Shops)
│  - id (PK)      │
│  - name         │
│  - slug         │
│  - owner_email  │
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│     users       │                    │    branches     │
│  - id (PK)      │                    │  - id (PK)      │
│  - org_id (FK)  │                    │  - org_id (FK)  │
│  - email        │                    │  - name         │
│  - pin          │                    │  - address      │
│  - role         │                    └────────┬────────┘
└────────┬────────┘                             │
         │                                      │
         │         ┌─────────────────┐          │
         │         │product_categories│         │
         │         │  - id (PK)      │          │
         │         │  - org_id (FK)  │          │
         │         │  - name         │          │
         │         └────────┬────────┘          │
         │                  │                   │
         │         ┌────────▼────────┐          │
         │         │    products     │          │
         │         │  - id (PK)      │          │
         │         │  - org_id (FK)  │          │
         │         │  - category_id  │          │
         │         │  - name         │          │
         │         │  - brand        │          │
         │         └────────┬────────┘          │
         │                  │                   │
         │         ┌────────▼────────┐          │
         │         │product_variants │◄─────────┤
         │         │  - id (PK)      │          │
         │         │  - org_id (FK)  │          │
         │         │  - product_id   │          │
         │         │  - name         │          │
         │         │  - sku          │          │
         │         │  - selling_price│          │
         │         │  - capital_cost │          │
         │         └────────┬────────┘          │
         │                  │                   │
         │         ┌────────▼────────┐          │
         │         │   inventory     │◄─────────┘
         │         │  - id (PK)      │
         │         │  - org_id (FK)  │
         │         │  - branch_id    │
         │         │  - variant_id   │
         │         │  - quantity     │
         │         └────────┬────────┘
         │                  │
         │                  │
         ▼                  │
┌─────────────────┐         │
│  transactions   │         │
│  - id (PK)      │         │
│  - org_id (FK)  │         │
│  - branch_id    │         │
│  - user_id (FK) │◄────────┤
│  - subtotal     │         │
│  - gross_profit │         │
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│transaction_items│         │
│  - id (PK)      │         │
│  - org_id (FK)  │         │
│  - txn_id (FK)  │         │
│  - variant_id   │◄────────┘
│  - quantity     │
│  - line_profit  │
└─────────────────┘

Additional Tables:
- stock_movements: Audit trail for inventory changes
- audit_logs: General activity logging
- subscriptions: Billing and subscription management
```

---

## Data Migration Considerations

### Initial Setup Checklist

1. ✅ Create organization
2. ✅ Create owner user
3. ✅ Create default branch
4. ✅ Create product categories (optional)
5. ✅ Import products and variants
6. ✅ Set initial inventory levels
7. ✅ Create staff accounts
8. ✅ Configure subscription

### Sample Data Flow for First Sale

```
1. Staff logs in with PIN → Select branch
2. Add products to cart → Select variants
3. Submit transaction:
   a. Create transaction record
   b. Create transaction_items records
   c. Update inventory quantities (decrement)
   d. Log stock_movements for each item
   e. Log audit_log entry for the transaction
4. Transaction complete → Display receipt
```

---

## Security Best Practices

1. **Always use RLS policies** - Never bypass with service role keys in application code
2. **Validate organization_id** - Every query must filter by organization_id
3. **Encrypt sensitive data** - Hash passwords, encrypt PINs
4. **Audit all changes** - Log to audit_logs table
5. **Use parameterized queries** - Prevent SQL injection
6. **Implement rate limiting** - Prevent brute force attacks on PIN login
7. **Regular backups** - Automated daily backups with point-in-time recovery

---

## Future Schema Enhancements

### Phase 2
- `customers` table for customer database
- `loyalty_programs` table for rewards
- `purchase_orders` table for supplier orders
- `suppliers` table for supplier management

### Phase 3
- `transfers` table for stock transfers between branches
- `price_history` table for tracking price changes
- `promotions` table for discounts and sales
- `reports_cache` table for pre-computed analytics

---

**Document Version:** 1.0  
**Last Updated:** February 4, 2026  
**Schema Owner:** VapeTrack PH Database Team
