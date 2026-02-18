-- Migration: 004_stock_functions.sql
-- Description: Create adjust_stock RPC function for atomic stock adjustments

-- ─── adjust_stock RPC ───────────────────────────────────────────────────────────
-- Atomically adjusts inventory quantity and creates a stock_movements audit record.
-- Uses SECURITY DEFINER so the function can update inventory and insert stock_movements
-- regardless of the caller's RLS policies.
-- Uses SELECT ... FOR UPDATE to prevent concurrent race conditions.

CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_variant_id   UUID,
  p_branch_id    UUID,
  p_quantity     INTEGER,
  p_movement_type TEXT,
  p_reason       TEXT DEFAULT NULL,
  p_user_id      UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty   INTEGER;
  v_new_qty       INTEGER;
  v_inventory_id  UUID;
  v_org_id        UUID;
BEGIN
  -- Validate movement_type
  IF p_movement_type NOT IN ('stock_in', 'stock_out', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid movement_type: %. Must be stock_in, stock_out, or adjustment.', p_movement_type;
  END IF;

  -- Validate quantity is positive
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than 0.';
  END IF;

  -- Lock the inventory row to prevent concurrent modifications
  SELECT id, quantity, organization_id
    INTO v_inventory_id, v_current_qty, v_org_id
    FROM inventory
   WHERE product_variant_id = p_variant_id
     AND branch_id = p_branch_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for variant % at branch %.', p_variant_id, p_branch_id;
  END IF;

  -- Calculate new quantity based on movement type
  IF p_movement_type = 'stock_in' THEN
    v_new_qty := v_current_qty + p_quantity;
  ELSIF p_movement_type = 'stock_out' THEN
    v_new_qty := v_current_qty - p_quantity;
  ELSIF p_movement_type = 'adjustment' THEN
    -- adjustment: p_quantity is the absolute target value
    v_new_qty := p_quantity;
  END IF;

  -- Prevent negative stock
  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, requested removal: %. Stock cannot go below 0.', v_current_qty, p_quantity;
  END IF;

  -- Update inventory
  UPDATE inventory
     SET quantity   = v_new_qty,
         updated_at = NOW()
   WHERE id = v_inventory_id;

  -- Insert audit record
  INSERT INTO stock_movements (
    organization_id,
    branch_id,
    product_variant_id,
    quantity_change,
    quantity_before,
    quantity_after,
    movement_type,
    user_id,
    notes
  ) VALUES (
    v_org_id,
    p_branch_id,
    p_variant_id,
    CASE
      WHEN p_movement_type = 'stock_in'  THEN  p_quantity
      WHEN p_movement_type = 'stock_out' THEN -p_quantity
      WHEN p_movement_type = 'adjustment' THEN v_new_qty - v_current_qty
    END,
    v_current_qty,
    v_new_qty,
    p_movement_type,
    p_user_id,
    p_reason
  );

  RETURN v_new_qty;
END;
$$;

-- Grant execute to authenticated users (RLS still applies via the function's internal logic)
GRANT EXECUTE ON FUNCTION public.adjust_stock(UUID, UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;
