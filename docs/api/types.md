# TypeScript Type Definitions

**Last Updated:** February 4, 2026

## Database Tables

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
