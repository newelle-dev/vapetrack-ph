# Database Functions (RPCs)

**Last Updated:** February 4, 2026

## Critical RPC: `process_transaction`

This function **MUST** be used for all sales to ensure atomic inventory deduction and prevent overselling.

### Function Signature

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

### TypeScript Usage

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

## `adjust_inventory`

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
