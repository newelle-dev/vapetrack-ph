# API Specification
## VapeTrack PH - Backend API Documentation

**Version:** 1.0  
**Last Updated:** February 4, 2026  
**Backend:** Supabase (PostgreSQL) with Row Level Security  
**Interaction Model:** Direct client-to-database queries + Postgres Functions (RPCs)  
**Author:** Backend Development Team

---

## 📋 Table of Contents
- [Overview](#overview)
- [TypeScript Type Definitions](#typescript-type-definitions)
- [Database Functions (RPCs)](#database-functions-rpcs)
- [Row Level Security (RLS) Policy Matrix](#row-level-security-rls-policy-matrix)
- [Error Handling Standards](#error-handling-standards)
- [API Usage Examples](#api-usage-examples)

---

## Overview

### Architecture Philosophy

VapeTrack PH uses a **database-centric architecture** where:

1. **Simple Reads:** Direct queries via Supabase JS Client
2. **Complex Writes:** Postgres Functions (RPCs) for atomic operations
3. **Security:** Row Level Security (RLS) enforces multi-tenancy at database layer
4. **Type Safety:** Auto-generated TypeScript types from Supabase schema

### Why This Approach?

✅ **Atomic Transactions:** Critical operations (sales, inventory) cannot be split across multiple client calls  
✅ **Data Integrity:** Inventory deductions are validated and rolled back if insufficient stock  
✅ **Performance:** Database functions run closer to data (no network round trips)  
✅ **Security:** RLS ensures users can only access their organization's data  
✅ **Simplicity:** No separate API server to maintain

---

## TypeScript Type Definitions

### Database Tables

```typescript
// ============================================
// CORE ENTITIES
// ============================================

/**
 * Organization (Tenant/Shop)
 * Represents a single vape shop or multi-branch business
 */
export interface Organization {
  id: string; // UUID
  name: string;
  slug: string; // URL-friendly identifier (unique)
  owner_email: string;
  phone: string | null;
  address: string | null;
  
  // Subscription
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  trial_ends_at: string | null; // ISO 8601 timestamp
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  deleted_at: string | null; // Soft delete
}

/**
 * User (Shop Owner or Staff)
 * Represents authenticated users with role-based permissions
 */
export interface User {
  id: string; // UUID
  organization_id: string; // UUID
  
  // Authentication
  email: string | null; // NULL for PIN-only staff
  password_hash: string | null; // Excluded from client queries
  pin: string | null; // 4-6 digit PIN
  
  // Profile
  full_name: string;
  role: 'owner' | 'staff';
  
  // Permissions
  can_view_profits: boolean;
  can_manage_inventory: boolean;
  can_view_reports: boolean;
  
  // Status
  is_active: boolean;
  last_login_at: string | null; // ISO 8601 timestamp
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Branch (Physical Location)
 * Represents a physical shop location
 */
export interface Branch {
  id: string; // UUID
  organization_id: string; // UUID
  
  // Branch Info
  name: string;
  slug: string; // Unique within organization
  address: string | null;
  phone: string | null;
  
  // Settings
  is_active: boolean;
  is_default: boolean;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// ============================================
// PRODUCTS & INVENTORY
// ============================================

/**
 * Product Category
 * Optional hierarchical categorization for products
 */
export interface ProductCategory {
  id: string; // UUID
  organization_id: string; // UUID
  
  // Category Info
  name: string;
  slug: string; // Unique within organization
  description: string | null;
  
  // Hierarchy
  parent_id: string | null; // UUID - for nested categories
  
  // Display
  display_order: number;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Product (Base Product Information)
 * Represents the "master" product (e.g., "Premium Vape Juice - Mango")
 */
export interface Product {
  id: string; // UUID
  organization_id: string; // UUID
  category_id: string | null; // UUID
  
  // Product Info
  name: string;
  slug: string; // Unique within organization
  description: string | null;
  brand: string | null;
  
  // Media
  image_url: string | null;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  deleted_at: string | null; // Soft delete
}

/**
 * Product Variant (SKU with Pricing)
 * Represents individual sellable items (e.g., "3mg", "6mg", "12mg")
 */
export interface ProductVariant {
  id: string; // UUID
  organization_id: string; // UUID
  product_id: string; // UUID
  
  // Variant Info
  name: string; // e.g., "3mg", "Black", "30ml"
  sku: string; // Unique SKU (e.g., "PVJ-MANGO-3MG")
  
  // Pricing (in centavos/smallest currency unit)
  selling_price: number; // e.g., 45000 = ₱450.00
  capital_cost: number; // e.g., 35000 = ₱350.00
  
  // Stock Alerts
  low_stock_threshold: number;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  deleted_at: string | null; // Soft delete
}

/**
 * Inventory (Stock Levels)
 * Tracks current stock quantity per branch per variant
 */
export interface Inventory {
  id: string; // UUID
  organization_id: string; // UUID
  branch_id: string; // UUID
  product_variant_id: string; // UUID
  
  // Stock Level
  quantity: number;
  
  // Metadata
  last_counted_at: string | null; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// ============================================
// TRANSACTIONS (SALES)
// ============================================

/**
 * Transaction (Sale)
 * Represents a completed sale with payment
 */
export interface Transaction {
  id: string; // UUID
  organization_id: string; // UUID
  branch_id: string; // UUID
  user_id: string; // UUID - Staff who made the sale
  
  // Transaction Info
  transaction_number: string; // e.g., "TXN-2026-0001"
  
  // Totals (in centavos)
  subtotal: number;
  total_capital_cost: number;
  gross_profit: number;
  
  // Payment
  payment_method: 'cash' | 'gcash' | 'card' | 'bank_transfer';
  payment_status: 'completed' | 'pending' | 'refunded';
  
  // Customer (optional)
  customer_name: string | null;
  customer_notes: string | null;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Transaction Item (Line Item)
 * Individual product sold within a transaction
 */
export interface TransactionItem {
  id: string; // UUID
  organization_id: string; // UUID
  transaction_id: string; // UUID
  product_variant_id: string; // UUID
  
  // Snapshot of product at time of sale
  product_name: string;
  variant_name: string;
  sku: string;
  
  // Pricing at time of sale (in centavos)
  unit_price: number;
  unit_capital_cost: number;
  
  // Quantity
  quantity: number;
  
  // Calculated fields (in centavos)
  line_total: number; // unit_price * quantity
  line_capital_cost: number; // unit_capital_cost * quantity
  line_profit: number; // line_total - line_capital_cost
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
}

// ============================================
// AUDIT & TRACKING
// ============================================

/**
 * Stock Movement (Inventory Audit Trail)
 * Tracks all inventory changes for accountability
 */
export interface StockMovement {
  id: string; // UUID
  organization_id: string; // UUID
  branch_id: string; // UUID
  product_variant_id: string; // UUID
  user_id: string | null; // UUID - Who made the change
  
  // Movement Type
  movement_type: 'stock_in' | 'stock_out' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'sale';
  
  // Quantity Change
  quantity_change: number; // Positive = increase, Negative = decrease
  quantity_before: number;
  quantity_after: number;
  
  // Reference
  reference_type: string | null; // 'transaction', 'transfer', 'manual'
  reference_id: string | null; // UUID of related record
  
  // Notes
  notes: string | null;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
}

/**
 * Audit Log (General Activity Log)
 * Comprehensive audit trail for all user actions
 */
export interface AuditLog {
  id: string; // UUID
  organization_id: string; // UUID
  user_id: string | null; // UUID
  
  // Action Details
  action: string; // e.g., 'login', 'create_product', 'update_inventory'
  entity_type: string | null; // e.g., 'product', 'branch', 'transaction'
  entity_id: string | null; // UUID of affected entity
  
  // Changes
  old_values: Record<string, any> | null; // JSONB
  new_values: Record<string, any> | null; // JSONB
  
  // Context
  ip_address: string | null;
  user_agent: string | null;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
}

/**
 * Subscription (Billing)
 * Tracks subscription status and payment information
 */
export interface Subscription {
  id: string; // UUID
  organization_id: string; // UUID
  
  // Plan Details
  plan: 'starter' | 'professional' | 'enterprise';
  billing_period: 'monthly' | 'yearly';
  
  // Pricing (in centavos)
  price_per_period: number;
  
  // Dates
  started_at: string; // ISO 8601 timestamp
  current_period_start: string; // ISO 8601 timestamp
  current_period_end: string; // ISO 8601 timestamp
  cancelled_at: string | null; // ISO 8601 timestamp
  
  // Status
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  
  // Payment Gateway
  payment_gateway: string | null; // 'paymongo'
  gateway_subscription_id: string | null;
  
  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// ============================================
// COMPOSITE TYPES (FOR QUERIES)
// ============================================

/**
 * Product with Variants and Inventory
 * Used for product listing and inventory management
 */
export interface ProductWithVariants extends Product {
  category?: ProductCategory | null;
  variants: Array<ProductVariant & {
    inventory?: Inventory[];
  }>;
}

/**
 * Transaction with Items
 * Used for transaction display and receipt generation
 */
export interface TransactionWithItems extends Transaction {
  items: TransactionItem[];
  branch?: Branch;
  user?: Pick<User, 'id' | 'full_name' | 'role'>;
}

/**
 * Cart Item (Client-Side Only)
 * Represents items in the shopping cart before checkout
 */
export interface CartItem {
  variant_id: string; // UUID
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: number;
  unit_price: number; // in centavos
  unit_capital_cost: number; // in centavos
  line_total: number; // quantity * unit_price
  available_stock: number; // Current inventory quantity
}

// ============================================
// INPUT TYPES (FOR MUTATIONS)
// ============================================

/**
 * Input for creating/updating a product
 */
export interface ProductInput {
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  category_id?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

/**
 * Input for creating/updating a product variant
 */
export interface ProductVariantInput {
  product_id: string;
  name: string;
  sku: string;
  selling_price: number; // in centavos
  capital_cost: number; // in centavos
  low_stock_threshold?: number;
  is_active?: boolean;
}

/**
 * Input for inventory adjustment
 */
export interface InventoryAdjustmentInput {
  branch_id: string;
  product_variant_id: string;
  quantity_change: number; // Positive or negative
  movement_type: 'stock_in' | 'stock_out' | 'adjustment';
  notes?: string;
}

/**
 * Input for processing a transaction (sale)
 */
export interface ProcessTransactionInput {
  branch_id: string;
  payment_method: 'cash' | 'gcash' | 'card' | 'bank_transfer';
  customer_name?: string | null;
  customer_notes?: string | null;
  items: Array<{
    variant_id: string; // UUID
    quantity: number;
    unit_price: number; // in centavos (snapshot at time of sale)
    unit_capital_cost: number; // in centavos
  }>;
}
```

---

## Database Functions (RPCs)

### Critical RPC: `process_transaction`

This function **MUST** be used for all sales to ensure atomic inventory deduction and prevent overselling.

#### Function Signature

```sql
CREATE OR REPLACE FUNCTION process_transaction(
  p_organization_id UUID,
  p_branch_id UUID,
  p_user_id UUID,
  p_payment_method VARCHAR(50),
  p_customer_name VARCHAR(255) DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_items JSONB -- Array of {variant_id, quantity, unit_price, unit_capital_cost}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_transaction_number VARCHAR(50);
  v_subtotal INTEGER := 0;
  v_total_capital_cost INTEGER := 0;
  v_gross_profit INTEGER := 0;
  v_item JSONB;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_unit_price INTEGER;
  v_unit_capital_cost INTEGER;
  v_line_total INTEGER;
  v_line_capital_cost INTEGER;
  v_line_profit INTEGER;
  v_current_stock INTEGER;
  v_product_name VARCHAR(255);
  v_variant_name VARCHAR(255);
  v_sku VARCHAR(100);
BEGIN
  -- Validate organization access (RLS should handle this, but double-check)
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_user_id 
    AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not belong to organization';
  END IF;

  -- Validate branch belongs to organization
  IF NOT EXISTS (
    SELECT 1 FROM branches 
    WHERE id = p_branch_id 
    AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'INVALID_BRANCH: Branch does not belong to organization';
  END IF;

  -- Start transaction block
  BEGIN
    -- Generate transaction number (e.g., TXN-2026-0001)
    SELECT 'TXN-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
           LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO v_transaction_number
    FROM transactions
    WHERE organization_id = p_organization_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

    -- Calculate totals
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_variant_id := (v_item->>'variant_id')::UUID;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_unit_price := (v_item->>'unit_price')::INTEGER;
      v_unit_capital_cost := (v_item->>'unit_capital_cost')::INTEGER;
      
      v_line_total := v_unit_price * v_quantity;
      v_line_capital_cost := v_unit_capital_cost * v_quantity;
      v_line_profit := v_line_total - v_line_capital_cost;
      
      v_subtotal := v_subtotal + v_line_total;
      v_total_capital_cost := v_total_capital_cost + v_line_capital_cost;
      v_gross_profit := v_gross_profit + v_line_profit;
    END LOOP;

    -- Create transaction record
    INSERT INTO transactions (
      organization_id,
      branch_id,
      user_id,
      transaction_number,
      subtotal,
      total_capital_cost,
      gross_profit,
      payment_method,
      payment_status,
      customer_name,
      customer_notes
    ) VALUES (
      p_organization_id,
      p_branch_id,
      p_user_id,
      v_transaction_number,
      v_subtotal,
      v_total_capital_cost,
      v_gross_profit,
      p_payment_method,
      'completed',
      p_customer_name,
      p_customer_notes
    ) RETURNING id INTO v_transaction_id;

    -- Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_variant_id := (v_item->>'variant_id')::UUID;
      v_quantity := (v_item->>'quantity')::INTEGER;
      v_unit_price := (v_item->>'unit_price')::INTEGER;
      v_unit_capital_cost := (v_item->>'unit_capital_cost')::INTEGER;
      
      v_line_total := v_unit_price * v_quantity;
      v_line_capital_cost := v_unit_capital_cost * v_quantity;
      v_line_profit := v_line_total - v_line_capital_cost;

      -- Get product details (for snapshot)
      SELECT p.name, pv.name, pv.sku
      INTO v_product_name, v_variant_name, v_sku
      FROM product_variants pv
      INNER JOIN products p ON p.id = pv.product_id
      WHERE pv.id = v_variant_id
        AND pv.organization_id = p_organization_id;

      -- Check if product variant exists
      IF v_product_name IS NULL THEN
        RAISE EXCEPTION 'INVALID_VARIANT: Variant % does not exist', v_variant_id;
      END IF;

      -- Check current stock
      SELECT quantity INTO v_current_stock
      FROM inventory
      WHERE branch_id = p_branch_id
        AND product_variant_id = v_variant_id
        AND organization_id = p_organization_id
      FOR UPDATE; -- Lock row to prevent race conditions

      -- Validate sufficient stock
      IF v_current_stock IS NULL OR v_current_stock < v_quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: % (%): Available=%s, Requested=%s',
          v_product_name, v_variant_name, 
          COALESCE(v_current_stock, 0), v_quantity;
      END IF;

      -- Insert transaction item
      INSERT INTO transaction_items (
        organization_id,
        transaction_id,
        product_variant_id,
        product_name,
        variant_name,
        sku,
        unit_price,
        unit_capital_cost,
        quantity,
        line_total,
        line_capital_cost,
        line_profit
      ) VALUES (
        p_organization_id,
        v_transaction_id,
        v_variant_id,
        v_product_name,
        v_variant_name,
        v_sku,
        v_unit_price,
        v_unit_capital_cost,
        v_quantity,
        v_line_total,
        v_line_capital_cost,
        v_line_profit
      );

      -- Deduct inventory
      UPDATE inventory
      SET quantity = quantity - v_quantity,
          updated_at = NOW()
      WHERE branch_id = p_branch_id
        AND product_variant_id = v_variant_id
        AND organization_id = p_organization_id;

      -- Log stock movement
      INSERT INTO stock_movements (
        organization_id,
        branch_id,
        product_variant_id,
        user_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        p_organization_id,
        p_branch_id,
        v_variant_id,
        p_user_id,
        'sale',
        -v_quantity,
        v_current_stock,
        v_current_stock - v_quantity,
        'transaction',
        v_transaction_id,
        'Sale: ' || v_transaction_number
      );
    END LOOP;

    -- Log audit trail
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      p_organization_id,
      p_user_id,
      'create_transaction',
      'transaction',
      v_transaction_id,
      jsonb_build_object(
        'transaction_id', v_transaction_id,
        'transaction_number', v_transaction_number,
        'subtotal', v_subtotal,
        'payment_method', p_payment_method
      )
    );

    -- Return success response
    RETURN jsonb_build_object(
      'success', true,
      'transaction_id', v_transaction_id,
      'transaction_number', v_transaction_number,
      'subtotal', v_subtotal,
      'total_capital_cost', v_total_capital_cost,
      'gross_profit', v_gross_profit
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback is automatic in PL/pgSQL
      -- Return error details
      RETURN jsonb_build_object(
        'success', false,
        'error_code', SQLSTATE,
        'error_message', SQLERRM
      );
  END;
END;
$$;
```

#### TypeScript Usage

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Process a sale
const { data, error } = await supabase.rpc('process_transaction', {
  p_organization_id: '123e4567-e89b-12d3-a456-426614174000',
  p_branch_id: '123e4567-e89b-12d3-a456-426614174001',
  p_user_id: '123e4567-e89b-12d3-a456-426614174002',
  p_payment_method: 'cash',
  p_customer_name: 'Juan Dela Cruz',
  p_customer_notes: null,
  p_items: [
    {
      variant_id: '123e4567-e89b-12d3-a456-426614174003',
      quantity: 2,
      unit_price: 45000, // ₱450.00
      unit_capital_cost: 35000 // ₱350.00
    },
    {
      variant_id: '123e4567-e89b-12d3-a456-426614174004',
      quantity: 1,
      unit_price: 120000, // ₱1,200.00
      unit_capital_cost: 95000 // ₱950.00
    }
  ]
});

if (error) {
  console.error('Transaction failed:', error);
} else if (!data.success) {
  console.error('Transaction error:', data.error_message);
  // Handle specific error codes (INSUFFICIENT_STOCK, etc.)
} else {
  console.log('Transaction successful:', data.transaction_number);
  // Navigate to success screen
}
```

---

### Additional RPCs

#### `adjust_inventory`

For manual stock adjustments (stock in, stock out, physical count corrections).

```sql
CREATE OR REPLACE FUNCTION adjust_inventory(
  p_organization_id UUID,
  p_branch_id UUID,
  p_user_id UUID,
  p_product_variant_id UUID,
  p_quantity_change INTEGER, -- Positive = increase, Negative = decrease
  p_movement_type VARCHAR(50), -- 'stock_in', 'stock_out', 'adjustment'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_inventory_id UUID;
BEGIN
  -- Get current inventory (with row lock)
  SELECT id, quantity INTO v_inventory_id, v_current_quantity
  FROM inventory
  WHERE organization_id = p_organization_id
    AND branch_id = p_branch_id
    AND product_variant_id = p_product_variant_id
  FOR UPDATE;

  -- If no inventory record exists, create one
  IF v_inventory_id IS NULL THEN
    v_current_quantity := 0;
    INSERT INTO inventory (
      organization_id,
      branch_id,
      product_variant_id,
      quantity
    ) VALUES (
      p_organization_id,
      p_branch_id,
      p_product_variant_id,
      GREATEST(p_quantity_change, 0) -- Cannot go negative
    ) RETURNING id INTO v_inventory_id;
    v_new_quantity := GREATEST(p_quantity_change, 0);
  ELSE
    -- Update existing inventory
    v_new_quantity := GREATEST(v_current_quantity + p_quantity_change, 0);
    UPDATE inventory
    SET quantity = v_new_quantity,
        updated_at = NOW()
    WHERE id = v_inventory_id;
  END IF;

  -- Log stock movement
  INSERT INTO stock_movements (
    organization_id,
    branch_id,
    product_variant_id,
    user_id,
    movement_type,
    quantity_change,
    quantity_before,
    quantity_after,
    reference_type,
    notes
  ) VALUES (
    p_organization_id,
    p_branch_id,
    p_product_variant_id,
    p_user_id,
    p_movement_type,
    p_quantity_change,
    v_current_quantity,
    v_new_quantity,
    'manual',
    p_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'quantity_before', v_current_quantity,
    'quantity_after', v_new_quantity
  );
END;
$$;
```

---

## Row Level Security (RLS) Policy Matrix

All tables use **organization-based isolation** enforced at the database level.

| Table | Operation | Policy Rule | Notes |
|-------|-----------|-------------|-------|
| **organizations** | SELECT | `id = get_user_organization_id()` | Users can only see their own org |
| | INSERT | `false` | Only via signup flow |
| | UPDATE | `id = get_user_organization_id()` | Owners can update org settings |
| | DELETE | `false` | Soft delete only |
| **users** | SELECT | `organization_id = get_user_organization_id()` | See users in same org |
| | INSERT | `organization_id = get_user_organization_id()` | Owners can add staff |
| | UPDATE | `organization_id = get_user_organization_id() AND (auth.uid() = id OR role = 'owner')` | Users can update themselves; owners can update all |
| | DELETE | `organization_id = get_user_organization_id() AND role = 'owner'` | Only owners can delete users |
| **branches** | SELECT | `organization_id = get_user_organization_id()` | See branches in same org |
| | INSERT | `organization_id = get_user_organization_id() AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'` | Only owners can create branches |
| | UPDATE | `organization_id = get_user_organization_id() AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'` | Only owners can update branches |
| | DELETE | `false` | Soft delete only |
| **product_categories** | SELECT | `organization_id = get_user_organization_id()` | See categories in same org |
| | INSERT | `organization_id = get_user_organization_id()` | All users can create categories |
| | UPDATE | `organization_id = get_user_organization_id()` | All users can update categories |
| | DELETE | `organization_id = get_user_organization_id()` | All users can delete categories |
| **products** | SELECT | `organization_id = get_user_organization_id()` | See products in same org |
| | INSERT | `organization_id = get_user_organization_id()` | All users can create products |
| | UPDATE | `organization_id = get_user_organization_id()` | All users can update products |
| | DELETE | `false` | Soft delete only |
| **product_variants** | SELECT | `organization_id = get_user_organization_id()` | See variants in same org |
| | INSERT | `organization_id = get_user_organization_id()` | All users can create variants |
| | UPDATE | `organization_id = get_user_organization_id()` | All users can update variants |
| | DELETE | `false` | Soft delete only |
| **inventory** | SELECT | `organization_id = get_user_organization_id()` | See inventory in same org |
| | INSERT | `organization_id = get_user_organization_id()` | Inventory created via RPC |
| | UPDATE | `false` | Updates only via RPCs |
| | DELETE | `false` | No direct deletes |
| **transactions** | SELECT | `organization_id = get_user_organization_id()` | See transactions in same org |
| | INSERT | `false` | Only via `process_transaction` RPC |
| | UPDATE | `false` | No updates after creation |
| | DELETE | `false` | No deletes (audit trail) |
| **transaction_items** | SELECT | `organization_id = get_user_organization_id()` | See items in same org |
| | | `AND ((SELECT can_view_profits FROM users WHERE id = auth.uid()) = true OR (SELECT role FROM users WHERE id = auth.uid()) = 'owner')` | **Profit columns hidden from staff** |
| | INSERT | `false` | Only via `process_transaction` RPC |
| | UPDATE | `false` | No updates after creation |
| | DELETE | `false` | No deletes (audit trail) |
| **stock_movements** | SELECT | `organization_id = get_user_organization_id()` | See movements in same org |
| | INSERT | `false` | Only via RPCs |
| | UPDATE | `false` | Immutable audit trail |
| | DELETE | `false` | Immutable audit trail |
| **audit_logs** | SELECT | `organization_id = get_user_organization_id() AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'` | **Only owners can view audit logs** |
| | INSERT | `false` | System-generated only |
| | UPDATE | `false` | Immutable |
| | DELETE | `false` | Immutable |
| **subscriptions** | SELECT | `organization_id = get_user_organization_id()` | See subscriptions in same org |
| | INSERT | `false` | System/webhook only |
| | UPDATE | `false` | System/webhook only |
| | DELETE | `false` | No deletes |

### Helper Functions for RLS

```sql
-- Get current user's organization ID from JWT metadata
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is an owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = 'owner'
      AND organization_id = get_user_organization_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Error Handling Standards

### Standard Error Codes

All API calls (RPCs and direct queries) should handle these standardized error codes:

| Error Code | Description | HTTP Equivalent | User Message |
|------------|-------------|-----------------|--------------|
| **INSUFFICIENT_STOCK** | Requested quantity exceeds available stock | 400 Bad Request | "Not enough stock available. Available: X, Requested: Y" |
| **INVALID_VARIANT** | Product variant does not exist | 404 Not Found | "Product not found" |
| **INVALID_BRANCH** | Branch does not exist or doesn't belong to org | 404 Not Found | "Branch not found" |
| **UNAUTHORIZED** | User not authorized for this operation | 401 Unauthorized | "You don't have permission to perform this action" |
| **SHOP_SUSPENDED** | Organization subscription is suspended | 403 Forbidden | "Your account is suspended. Please contact support." |
| **TRIAL_EXPIRED** | Trial period has ended | 403 Forbidden | "Your trial has expired. Please subscribe to continue." |
| **NETWORK_TIMEOUT** | Request timed out | 408 Request Timeout | "Request timed out. Please try again." |
| **DATABASE_ERROR** | Generic database error | 500 Internal Server Error | "Something went wrong. Please try again." |
| **DUPLICATE_SKU** | SKU already exists in organization | 409 Conflict | "This SKU already exists in your inventory" |
| **NEGATIVE_QUANTITY** | Cannot set inventory to negative value | 400 Bad Request | "Quantity cannot be negative" |
| **INVALID_PRICE** | Price must be greater than zero | 400 Bad Request | "Price must be greater than zero" |
| **TRANSACTION_FAILED** | Transaction rollback occurred | 500 Internal Server Error | "Sale failed. No changes were made." |
| **CONCURRENT_UPDATE** | Another user modified the same record | 409 Conflict | "This record was modified by another user. Please refresh." |

### Error Response Format

All RPCs return errors in a consistent JSONB format:

```typescript
{
  success: false,
  error_code: "INSUFFICIENT_STOCK",
  error_message: "Premium Vape Juice - Mango (3mg): Available=5, Requested=10",
  error_details?: {
    variant_id: "123e4567-e89b-12d3-a456-426614174003",
    available_quantity: 5,
    requested_quantity: 10
  }
}
```

### Client-Side Error Handling

```typescript
// Example: Handling errors from process_transaction
const { data, error } = await supabase.rpc('process_transaction', params);

if (error) {
  // Network or database error
  console.error('RPC Error:', error);
  showToast('Network error. Please check your connection.', 'error');
  return;
}

if (!data.success) {
  // Business logic error
  const errorCode = data.error_code || 'UNKNOWN';
  
  switch (errorCode) {
    case 'INSUFFICIENT_STOCK':
      showToast(data.error_message, 'warning');
      // Optionally: Highlight out-of-stock items in cart
      break;
    
    case 'SHOP_SUSPENDED':
      showToast('Your account is suspended. Please contact support.', 'error');
      // Redirect to billing page
      router.push('/billing');
      break;
    
    case 'UNAUTHORIZED':
      showToast('You are not authorized to perform this action.', 'error');
      // Redirect to login
      router.push('/login');
      break;
    
    default:
      showToast('Something went wrong. Please try again.', 'error');
      console.error('Transaction error:', data.error_message);
  }
  
  return;
}

// Success
console.log('Transaction successful:', data.transaction_number);
router.push(`/transactions/${data.transaction_id}`);
```

### Validation Before API Calls

**IMPORTANT:** Always validate on the client side before calling RPCs to provide instant feedback:

```typescript
// Example: Validate cart before checkout
function validateCart(cartItems: CartItem[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const item of cartItems) {
    // Check stock availability
    if (item.quantity > item.available_stock) {
      errors.push(`${item.product_name} (${item.variant_name}): Only ${item.available_stock} available`);
    }
    
    // Check quantity is positive
    if (item.quantity <= 0) {
      errors.push(`${item.product_name} (${item.variant_name}): Quantity must be greater than 0`);
    }
    
    // Check price is positive
    if (item.unit_price <= 0) {
      errors.push(`${item.product_name} (${item.variant_name}): Invalid price`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Before checkout
const validation = validateCart(cartItems);
if (!validation.valid) {
  showToast(validation.errors.join('\n'), 'error');
  return;
}

// Proceed with transaction
await processTransaction(cartItems);
```

---

## API Usage Examples

### 1. Fetch Products with Inventory

```typescript
// Get all products with variants and current stock for a branch
const { data: products, error } = await supabase
  .from('products')
  .select(`
    *,
    category:product_categories(*),
    variants:product_variants(
      *,
      inventory(
        quantity,
        branch_id
      )
    )
  `)
  .eq('is_active', true)
  .eq('variants.is_active', true)
  .eq('variants.inventory.branch_id', branchId)
  .order('name');

if (error) {
  console.error('Error fetching products:', error);
} else {
  console.log('Products:', products);
}
```

### 2. Search Products by Name or SKU

```typescript
const searchTerm = 'mango';

const { data: results, error } = await supabase
  .from('product_variants')
  .select(`
    *,
    product:products(*)
  `)
  .or(`sku.ilike.%${searchTerm}%,product.name.ilike.%${searchTerm}%`)
  .eq('is_active', true)
  .limit(20);
```

### 3. Get Low Stock Alerts

```typescript
const { data: lowStockItems, error } = await supabase
  .from('inventory')
  .select(`
    *,
    variant:product_variants(
      *,
      product:products(*)
    )
  `)
  .eq('branch_id', branchId)
  .filter('quantity', 'lte', 10) // Low stock threshold
  .order('quantity', { ascending: true });
```

### 4. Fetch Daily Sales Report

```typescript
const { data: dailySales, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('branch_id', branchId)
  .gte('created_at', new Date().toISOString().split('T')[0]) // Today
  .order('created_at', { ascending: false });

// Calculate totals
const totals = dailySales?.reduce((acc, txn) => ({
  revenue: acc.revenue + txn.subtotal,
  cost: acc.cost + txn.total_capital_cost,
  profit: acc.profit + txn.gross_profit,
  transactions: acc.transactions + 1
}), { revenue: 0, cost: 0, profit: 0, transactions: 0 });
```

### 5. Fetch Transaction with Items

```typescript
const { data: transaction, error } = await supabase
  .from('transactions')
  .select(`
    *,
    items:transaction_items(*),
    branch:branches(*),
    user:users(id, full_name, role)
  `)
  .eq('id', transactionId)
  .single();
```

### 6. Create a New Product with Variant

```typescript
// Step 1: Create product
const { data: product, error: productError } = await supabase
  .from('products')
  .insert({
    name: 'Premium Vape Juice - Strawberry',
    slug: 'premium-vape-juice-strawberry',
    brand: 'VapePro',
    category_id: categoryId,
    is_active: true
  })
  .select()
  .single();

if (productError) {
  console.error('Error creating product:', productError);
  return;
}

// Step 2: Create variant
const { data: variant, error: variantError } = await supabase
  .from('product_variants')
  .insert({
    product_id: product.id,
    name: '3mg',
    sku: 'PVJ-STRAWBERRY-3MG',
    selling_price: 45000, // ₱450.00
    capital_cost: 35000, // ₱350.00
    low_stock_threshold: 10,
    is_active: true
  })
  .select()
  .single();

if (variantError) {
  console.error('Error creating variant:', variantError);
} else {
  console.log('Product created successfully:', variant);
}
```

### 7. Adjust Inventory (Stock In)

```typescript
const { data, error } = await supabase.rpc('adjust_inventory', {
  p_organization_id: organizationId,
  p_branch_id: branchId,
  p_user_id: userId,
  p_product_variant_id: variantId,
  p_quantity_change: 50, // Add 50 units
  p_movement_type: 'stock_in',
  p_notes: 'New stock from supplier'
});

if (error || !data.success) {
  console.error('Error adjusting inventory:', error || data.error_message);
} else {
  console.log('Inventory adjusted:', data);
  showToast(`Stock updated: ${data.quantity_before} → ${data.quantity_after}`, 'success');
}
```

### 8. Real-time Subscription (Inventory Updates)

```typescript
// Subscribe to inventory changes for a specific branch
const inventoryChannel = supabase
  .channel('inventory-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'inventory',
      filter: `branch_id=eq.${branchId}`
    },
    (payload) => {
      console.log('Inventory updated:', payload.new);
      // Update UI in real-time
      updateInventoryUI(payload.new);
    }
  )
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(inventoryChannel);
};
```

---

## Summary

This API specification provides:

1. ✅ **Type-safe interfaces** matching the exact database schema
2. ✅ **Critical RPC functions** for atomic transactions
3. ✅ **Comprehensive RLS policies** for multi-tenant security
4. ✅ **Standardized error handling** with clear error codes
5. ✅ **Real-world usage examples** for common operations

### Key Takeaways

- **Use RPCs for critical operations:** Never deduct inventory from the client side
- **Validate before submitting:** Check stock availability and prices client-side first
- **Handle errors gracefully:** Provide clear user feedback for all error scenarios
- **Trust RLS:** Database-level security prevents cross-tenant data access
- **Store prices in centavos:** Avoid floating-point arithmetic errors

---

**Document Version:** 1.0  
**Last Updated:** February 4, 2026  
**Maintained By:** VapeTrack PH Backend Team
