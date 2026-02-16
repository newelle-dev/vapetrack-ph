# API Usage Examples

**Last Updated:** February 4, 2026

## 1. Fetch Products with Inventory

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

## 2. Search Products by Name or SKU

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

## 3. Get Low Stock Alerts

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

## 4. Fetch Daily Sales Report

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

## 5. Fetch Transaction with Items

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

## 6. Create a New Product with Variant

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

## 7. Adjust Inventory (Stock In)

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

## 8. Real-time Subscription (Inventory Updates)

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
