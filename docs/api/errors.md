# Error Handling Standards

**Last Updated:** February 4, 2026

## Standard Error Codes

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

## Error Response Format

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

## Client-Side Error Handling

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

## Validation Before API Calls

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
