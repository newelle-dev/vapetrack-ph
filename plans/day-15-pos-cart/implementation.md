# Day 15: POS UI & Cart State

## Goal
Replace the hardcoded prototype POS page with a production-ready POS interface that uses a Zustand cart store, fetches real product/variant data from the database (filtered by selected branch), and implements a responsive layout with a split-view for tablet/desktop while keeping the mobile-first bottom-sheet cart experience.

## Prerequisites
Make sure that the user is currently on the `feat/day-15-pos-cart-zustand` branch before beginning implementation.
If not, move them to the correct branch. If the branch does not exist, create it from main.

---

### Step-by-Step Instructions

#### Step 1: Install Missing shadcn/ui Components

- [x] Run the following command to install `separator` and `scroll-area`:

```bash
npx shadcn@latest add separator scroll-area
```

- [x] Verify that `components/ui/separator.tsx` and `components/ui/scroll-area.tsx` now exist.

##### Step 1 Verification Checklist
- [x] `components/ui/separator.tsx` exists
- [x] `components/ui/scroll-area.tsx` exists
- [x] No build errors (`npm run dev` terminal is clean)

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 2: Create Zustand Cart Store

- [ ] Create new file `lib/hooks/useCart.ts`
- [ ] Copy and paste code below into `lib/hooks/useCart.ts`:

```typescript
'use client'

import { create } from 'zustand'

export interface CartItem {
  variantId: string
  productName: string
  variantName: string
  sku: string
  price: number       // selling_price
  capitalCost: number  // for profit calculation (owner-only display)
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getProfit: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }],
      }
    })
  },

  removeItem: (variantId) => {
    set((state) => ({
      items: state.items.filter((i) => i.variantId !== variantId),
    }))
  },

  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(variantId)
      return
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.variantId === variantId ? { ...i, quantity } : i
      ),
    }))
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  getProfit: () => {
    return get().items.reduce(
      (sum, item) => sum + (item.price - item.capitalCost) * item.quantity,
      0
    )
  },
}))
```

##### Step 2 Verification Checklist
- [ ] `lib/hooks/useCart.ts` exists and exports `useCartStore` and `CartItem`
- [ ] No build errors
- [ ] No TypeScript errors in the file

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 3: Create POS Products Query Hook + Branches Hook

- [ ] Create new file `lib/hooks/usePosProducts.ts`
- [ ] Copy and paste code below into `lib/hooks/usePosProducts.ts`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface PosVariant {
  id: string
  name: string
  sku: string
  sellingPrice: number
  capitalCost: number
  stock: number
}

export interface PosProduct {
  id: string
  name: string
  brand: string | null
  categoryName: string | null
  categoryId: string | null
  variants: PosVariant[]
}

export interface PosProductFilters {
  branchId: string
  search?: string
  categoryId?: string
}

export function usePosProducts(filters: PosProductFilters) {
  const supabase = createClient()

  return useQuery<PosProduct[]>({
    queryKey: ['pos-products', filters.branchId, filters.search, filters.categoryId],
    enabled: !!filters.branchId,
    queryFn: async () => {
      // 1. Fetch active products with category name
      let productQuery = supabase
        .from('products')
        .select(`
          id,
          name,
          brand,
          category_id,
          product_categories!left(name)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name')

      if (filters.categoryId) {
        productQuery = productQuery.eq('category_id', filters.categoryId)
      }

      const { data: products, error: productError } = await productQuery

      if (productError) throw productError
      if (!products || products.length === 0) return []

      const productIds = products.map((p) => p.id)

      // 2. Fetch active variants for those products
      const { data: variants, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, name, sku, selling_price, capital_cost')
        .in('product_id', productIds)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name')

      if (variantError) throw variantError

      const variantIds = (variants || []).map((v) => v.id)

      // 3. Fetch inventory for the selected branch
      let inventoryMap = new Map<string, number>()
      if (variantIds.length > 0) {
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('product_variant_id, quantity')
          .eq('branch_id', filters.branchId)
          .in('product_variant_id', variantIds)

        if (inventoryError) throw inventoryError

        for (const inv of inventory || []) {
          inventoryMap.set(inv.product_variant_id, inv.quantity)
        }
      }

      // 4. Combine: product -> variants[] with stock from inventory
      const variantsByProduct = new Map<string, PosVariant[]>()
      for (const v of variants || []) {
        const posVariant: PosVariant = {
          id: v.id,
          name: v.name,
          sku: v.sku,
          sellingPrice: v.selling_price,
          capitalCost: v.capital_cost,
          stock: inventoryMap.get(v.id) ?? 0,
        }
        const existing = variantsByProduct.get(v.product_id) || []
        existing.push(posVariant)
        variantsByProduct.set(v.product_id, existing)
      }

      const result: PosProduct[] = products
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          categoryName: p.product_categories?.name || null,
          categoryId: p.category_id,
          variants: variantsByProduct.get(p.id) || [],
        }))
        // Only show products that have at least one active variant
        .filter((p) => p.variants.length > 0)

      // 5. Apply client-side search
      if (filters.search) {
        const term = filters.search.toLowerCase()
        return result.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.brand && p.brand.toLowerCase().includes(term)) ||
            p.variants.some(
              (v) =>
                v.name.toLowerCase().includes(term) ||
                v.sku.toLowerCase().includes(term)
            )
        )
      }

      return result
    },
  })
}
```

- [ ] Create new file `lib/hooks/useBranches.ts`
- [ ] Copy and paste code below into `lib/hooks/useBranches.ts`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types'

export function useBranches() {
  const supabase = createClient()

  return useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, is_default')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name')

      if (error) throw error
      return data || []
    },
  })
}
```

##### Step 3 Verification Checklist
- [ ] `lib/hooks/usePosProducts.ts` exists and exports `usePosProducts`, `PosProduct`, `PosVariant`, `PosProductFilters`
- [ ] `lib/hooks/useBranches.ts` exists and exports `useBranches`
- [ ] No build errors
- [ ] No TypeScript errors

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4: Refactor POS Components & Page

This is the main refactor step. We will update all POS components to use real data and Zustand, and create the new `PosCartSidebar` for desktop.

- [ ] Replace the entire contents of `components/pos/product-card.tsx` with the code below:

```tsx
'use client'

import { Plus, AlertCircle } from 'lucide-react'
import type { PosProduct } from '@/lib/hooks/usePosProducts'

interface ProductCardProps {
  product: PosProduct
  onTap: () => void
}

export default function ProductCard({ product, onTap }: ProductCardProps) {
  const variants = product.variants

  // Price display: single price or range
  const prices = variants.map((v) => v.sellingPrice)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceDisplay =
    minPrice === maxPrice
      ? `₱${minPrice.toLocaleString()}`
      : `₱${minPrice.toLocaleString()} – ₱${maxPrice.toLocaleString()}`

  // Stock: show lowest across variants
  const stocks = variants.map((v) => v.stock)
  const minStock = Math.min(...stocks)
  const totalStock = stocks.reduce((a, b) => a + b, 0)
  const isLowStock = minStock <= 5 && minStock > 0
  const isSoldOut = totalStock === 0

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]">
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-secondary/40 flex items-center justify-center text-4xl overflow-hidden border-b border-border/30">
        {/* Emoji placeholder - products don't have images yet */}
        <span className="text-3xl">📦</span>

        {/* Stock Badge */}
        <div
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-sm ${
            isLowStock
              ? 'bg-[hsl(var(--warning))]/90 text-[#0f0f0f]'
              : isSoldOut
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/80 text-primary-foreground'
          }`}
        >
          {isSoldOut ? '⚠ Out' : `${minStock}x`}
        </div>

        {/* Low Stock Alert Icon */}
        {isLowStock && !isSoldOut && (
          <div className="absolute bottom-3 left-3">
            <AlertCircle className="w-4 h-4 text-[hsl(var(--warning))] animate-pulse" />
          </div>
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground">Sold Out</span>
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-3 flex flex-col gap-2.5">
        {/* Product Name */}
        <div>
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 text-pretty leading-tight">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {product.categoryName || product.brand || 'Uncategorized'}
          </p>
        </div>

        {/* Price Display */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex-1">
            <p className="text-lg font-bold text-primary">{priceDisplay}</p>
            {variants.length > 1 && (
              <p className="text-xs text-muted-foreground">{variants.length} variants</p>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={onTap}
          disabled={isSoldOut}
          className={`w-full rounded-lg py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 touch-target ${
            isSoldOut
              ? 'bg-muted/40 text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md hover:shadow-lg'
          }`}
        >
          <Plus className="w-5 h-5" />
          {variants.length > 1 ? 'Select Variant' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] Replace the entire contents of `components/pos/variant-selector.tsx` with the code below:

```tsx
'use client'

import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import type { PosProduct, PosVariant } from '@/lib/hooks/usePosProducts'
import { useCartStore } from '@/lib/hooks/useCart'

interface VariantSelectorProps {
  product: PosProduct
  onClose: () => void
}

export default function VariantSelector({ product, onClose }: VariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<PosVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = () => {
    if (!selectedVariant) return

    // Add item `quantity` times (addItem increments by 1 each call)
    // Or we can add once and update quantity directly
    addItem({
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      sku: selectedVariant.sku,
      price: selectedVariant.sellingPrice,
      capitalCost: selectedVariant.capitalCost,
    })

    // If quantity > 1, update to exact quantity
    if (quantity > 1) {
      // Get current quantity from store (it's 1 after addItem if new, or incremented)
      // For simplicity, we use updateQuantity to set absolute value
      const currentItems = useCartStore.getState().items
      const existing = currentItems.find((i) => i.variantId === selectedVariant.id)
      if (existing) {
        useCartStore.getState().updateQuantity(selectedVariant.id, existing.quantity + quantity - 1)
      }
    }

    onClose()
  }

  const maxQuantity = selectedVariant?.stock ?? 0
  const subtotal = selectedVariant ? selectedVariant.sellingPrice * quantity : 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="bg-card rounded-t-[20px] border-t border-border/50 max-h-[85vh] overflow-y-auto">
        <div className="p-4 space-y-4 pb-8">
          {/* Header with Close */}
          <div className="flex items-center justify-between sticky top-0 bg-card pt-2">
            <h2 className="text-lg font-bold text-foreground">Select Options</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Info Card */}
          <div className="flex gap-3 bg-secondary/40 rounded-xl p-3 border border-border/30">
            <div className="w-16 h-16 bg-secondary rounded-xl shrink-0 flex items-center justify-center text-3xl">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground leading-tight">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.categoryName || product.brand || 'Uncategorized'}
              </p>
              {selectedVariant && (
                <p className="text-base font-bold text-primary mt-1">
                  ₱{selectedVariant.sellingPrice.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Variant Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Variant
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {product.variants.map((variant) => {
                const isOutOfStock = variant.stock <= 0
                return (
                  <button
                    key={variant.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        setSelectedVariant(variant)
                        setQuantity(1)
                      }
                    }}
                    disabled={isOutOfStock}
                    className={`py-2.5 px-3 rounded-xl border-2 transition-all text-xs font-semibold touch-target ${
                      isOutOfStock
                        ? 'border-border/30 bg-muted/20 text-muted-foreground cursor-not-allowed opacity-50'
                        : selectedVariant?.id === variant.id
                        ? 'border-primary bg-primary/15 text-primary shadow-md shadow-primary/20'
                        : 'border-border/60 bg-secondary/40 text-foreground hover:border-border/80'
                    }`}
                  >
                    <div>{variant.name}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">
                      ₱{variant.sellingPrice.toLocaleString()} · {variant.stock}x
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity Stepper */}
          {selectedVariant && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 bg-secondary/60 hover:bg-secondary rounded-lg transition-colors touch-target"
                >
                  <Minus className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex-1 text-center bg-secondary/40 rounded-lg py-3 border border-border/30">
                  <p className="text-2xl font-bold text-primary">{quantity}</p>
                </div>
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                  className={`p-3 rounded-lg transition-colors touch-target ${
                    quantity >= maxQuantity
                      ? 'bg-muted/30 cursor-not-allowed'
                      : 'bg-secondary/60 hover:bg-secondary'
                  }`}
                >
                  <Plus className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Subtotal Preview */}
          {selectedVariant && (
            <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Subtotal</span>
                <span className="text-xl font-bold text-primary">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Stock: {selectedVariant.stock} available
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl font-semibold transition-colors touch-target text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              className={`px-4 py-3 rounded-xl font-semibold transition-all touch-target text-sm ${
                selectedVariant
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] Replace the entire contents of `components/pos/cart-sheet.tsx` with the code below:

```tsx
'use client'

import { useState } from 'react'
import { X, Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/hooks/useCart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface CartSheetProps {
  onClose: () => void
  showProfit: boolean
}

function CartSheet({ onClose, showProfit }: CartSheetProps) {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)
  const getTotal = useCartStore((s) => s.getTotal)
  const getItemCount = useCartStore((s) => s.getItemCount)
  const getProfit = useCartStore((s) => s.getProfit)

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('cash')
  const [customerName, setCustomerName] = useState('')

  const subtotal = getTotal()
  const totalProfit = getProfit()
  const itemCount = getItemCount()

  const handleCompleteSale = () => {
    console.log('[POS] Sale completed:', {
      items,
      subtotal,
      profit: totalProfit,
      paymentMethod,
      customerName,
    })
    clearCart()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Checkout Sheet */}
      <div className="bg-card rounded-t-[20px] border-t border-border/50 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">Cart</h2>
            <p className="text-xs text-muted-foreground">{itemCount} items</p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-accent hover:text-accent/80 font-medium px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-4 py-3">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div>
                <p className="text-lg text-muted-foreground font-medium">Cart is empty</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Tap a product to add it</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const itemProfit = (item.price - item.capitalCost) * item.quantity
                return (
                  <div
                    key={item.variantId}
                    className="flex gap-3 bg-secondary/30 rounded-xl p-3 border border-border/30 hover:border-border/50 transition-colors"
                  >
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-base font-bold text-primary">
                          ₱{item.price.toLocaleString()}
                        </p>
                        {showProfit && itemProfit > 0 && (
                          <p className="text-xs text-[hsl(var(--success))] font-medium">
                            +₱{itemProfit.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-1.5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors touch-target"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-8 text-center">
                        <p className="font-bold text-sm text-foreground">{item.quantity}</p>
                      </div>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-1.5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors touch-target"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="p-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors touch-target ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Sticky Footer */}
        {items.length > 0 && (
          <div className="border-t border-border/50 bg-card px-4 py-3 space-y-3">
            {/* Optional Customer Name */}
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary rounded-xl border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
            />

            {/* Totals Card */}
            <div className="bg-linear-to-br from-primary/15 to-primary/5 rounded-xl p-3 border border-primary/20 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>
              {showProfit && totalProfit > 0 && (
                <>
                  <Separator className="bg-border/30" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profit</span>
                    <span className="text-[hsl(var(--success))] font-semibold">
                      ₱{totalProfit.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-1">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Payment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Cash', emoji: '💵' },
                  { id: 'gcash', label: 'GCash', emoji: '📱' },
                  { id: 'card', label: 'Card', emoji: '💳' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as 'cash' | 'gcash' | 'card')}
                    className={`py-2.5 px-3 rounded-xl border-2 transition-all text-xs font-semibold touch-target flex flex-col items-center gap-1 ${
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/15 text-primary shadow-md shadow-primary/20'
                        : 'border-border/60 bg-secondary/40 text-foreground hover:border-border/80'
                    }`}
                  >
                    <span className="text-lg">{method.emoji}</span>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              className="w-full bg-primary text-primary-foreground rounded-xl py-4 font-bold text-base touch-target hover:bg-primary/90 active:scale-95 shadow-lg hover:shadow-xl transition-all"
            >
              Complete Sale
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartSheet
```

- [ ] Create new file `components/pos/pos-cart-sidebar.tsx`
- [ ] Copy and paste code below into `components/pos/pos-cart-sidebar.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/hooks/useCart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface PosCartSidebarProps {
  showProfit: boolean
}

export default function PosCartSidebar({ showProfit }: PosCartSidebarProps) {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)
  const getTotal = useCartStore((s) => s.getTotal)
  const getItemCount = useCartStore((s) => s.getItemCount)
  const getProfit = useCartStore((s) => s.getProfit)

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('cash')
  const [customerName, setCustomerName] = useState('')

  const subtotal = getTotal()
  const totalProfit = getProfit()
  const itemCount = getItemCount()

  const handleCompleteSale = () => {
    console.log('[POS] Sale completed:', {
      items,
      subtotal,
      profit: totalProfit,
      paymentMethod,
      customerName,
    })
    clearCart()
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border/50">
      {/* Sticky Header */}
      <div className="border-b border-border/30 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Cart</h2>
          {itemCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
              {itemCount}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-accent hover:text-accent/80 font-medium px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Scrollable Cart Items */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center px-4">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Cart is empty</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap a product to add it</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {items.map((item) => {
              const itemProfit = (item.price - item.capitalCost) * item.quantity
              return (
                <div
                  key={item.variantId}
                  className="bg-secondary/30 rounded-xl p-3 border border-border/30 hover:border-border/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1 text-accent/60 hover:text-accent hover:bg-accent/10 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-1 bg-secondary rounded hover:bg-secondary/80 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-1 bg-secondary rounded hover:bg-secondary/80 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                      {showProfit && itemProfit > 0 && (
                        <p className="text-[10px] text-[hsl(var(--success))] font-medium">
                          +₱{itemProfit.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Sticky Footer */}
      {items.length > 0 && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3 shrink-0">
          {/* Customer Name */}
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
          />

          {/* Totals */}
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">₱{subtotal.toLocaleString()}</span>
            </div>
            {showProfit && totalProfit > 0 && (
              <>
                <Separator className="bg-border/30" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit</span>
                  <span className="text-[hsl(var(--success))] font-semibold">
                    ₱{totalProfit.toLocaleString()}
                  </span>
                </div>
              </>
            )}
            <Separator className="bg-border/30" />
            <div className="flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">₱{subtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'cash', label: 'Cash', emoji: '💵' },
              { id: 'gcash', label: 'GCash', emoji: '📱' },
              { id: 'card', label: 'Card', emoji: '💳' },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as 'cash' | 'gcash' | 'card')}
                className={`py-2 px-2 rounded-lg border-2 transition-all text-xs font-semibold flex flex-col items-center gap-0.5 ${
                  paymentMethod === method.id
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border/60 bg-secondary/40 text-foreground hover:border-border/80'
                }`}
              >
                <span className="text-base">{method.emoji}</span>
                {method.label}
              </button>
            ))}
          </div>

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-base touch-target hover:bg-primary/90 active:scale-95 shadow-lg hover:shadow-xl transition-all"
          >
            Complete Sale · ₱{subtotal.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] Replace the entire contents of `app/(dashboard)/pos/page.tsx` with the code below:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Store, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchInput } from '@/components/ui/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProductCard from '@/components/pos/product-card'
import CartSheet from '@/components/pos/cart-sheet'
import VariantSelector from '@/components/pos/variant-selector'
import PosCartSidebar from '@/components/pos/pos-cart-sidebar'
import { usePosProducts } from '@/lib/hooks/usePosProducts'
import type { PosProduct } from '@/lib/hooks/usePosProducts'
import { useBranches } from '@/lib/hooks/useBranches'
import { useCategories } from '@/lib/hooks/useProducts'
import { useCartStore } from '@/lib/hooks/useCart'

export default function POSScreen() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null)
  const [showVariantSelector, setShowVariantSelector] = useState(false)

  // Determine if user is owner (check for cookie-based role)
  // For now, default to true since staff layout is separate
  // In production, this would come from the dashboard layout context
  const [isOwner, setIsOwner] = useState(true)

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useBranches()

  // Set default branch when branches load
  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      const defaultBranch = branches.find((b) => b.is_default) || branches[0]
      setSelectedBranchId(defaultBranch.id)
    }
  }, [branches, selectedBranchId])

  // Fetch products for selected branch
  const { data: products, isLoading: productsLoading } = usePosProducts({
    branchId: selectedBranchId,
    search: searchQuery || undefined,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
  })

  // Fetch categories for filter chips
  const { data: categories } = useCategories()

  // Cart state from Zustand
  const itemCount = useCartStore((s) => s.getItemCount())
  const total = useCartStore((s) => s.getTotal())
  const addItem = useCartStore((s) => s.addItem)

  const handleProductTap = (product: PosProduct) => {
    if (product.variants.length === 1) {
      const variant = product.variants[0]
      if (variant.stock > 0) {
        addItem({
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          price: variant.sellingPrice,
          capitalCost: variant.capitalCost,
        })
      }
    } else {
      setSelectedProduct(product)
      setShowVariantSelector(true)
    }
  }

  // Sticky top content (branch selector + search + categories)
  const stickyContent = (
    <div className="px-4 py-3 space-y-3">
      {/* Title & Branch Selector & Cart Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground whitespace-nowrap">POS</h1>

          {/* Branch Selector */}
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="h-9 text-xs bg-secondary/60 border-border/50 rounded-lg w-auto max-w-[180px]">
              <Store className="w-3.5 h-3.5 mr-1 shrink-0 text-primary" />
              <SelectValue placeholder="Branch..." />
            </SelectTrigger>
            <SelectContent>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                  {branch.is_default && ' ★'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cart Button - Mobile only */}
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-primary text-primary-foreground px-3 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 touch-target md:hidden"
        >
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-in zoom-in duration-200">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search products..."
      />

      {/* Category Chips - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-4 py-2.5 min-h-11 rounded-full text-xs font-semibold whitespace-nowrap transition-all touch-target',
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'bg-secondary/50 text-foreground hover:bg-secondary'
          )}
        >
          All
        </button>
        {categories?.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'px-4 py-2.5 min-h-11 rounded-full text-xs font-semibold whitespace-nowrap transition-all touch-target',
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-secondary/50 text-foreground hover:bg-secondary'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )

  // Loading state
  const isLoading = branchesLoading || productsLoading

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)]">
      {/* Sticky Top */}
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        {stickyContent}
      </div>

      {/* Main Content Area - Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid Panel */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 md:pb-6 pt-4">
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-secondary/40" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-secondary/60 rounded w-3/4" />
                    <div className="h-3 bg-secondary/40 rounded w-1/2" />
                    <div className="h-5 bg-secondary/60 rounded w-1/3" />
                    <div className="h-10 bg-secondary/40 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onTap={() => handleProductTap(product)}
                />
              ))}
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No products found</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'Add products in Inventory to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Cart Sidebar - Desktop only */}
        <div className="hidden md:block w-[380px] shrink-0">
          <PosCartSidebar showProfit={isOwner} />
        </div>
      </div>

      {/* Floating Checkout Button - Mobile only */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-30 md:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="w-full h-16 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl font-bold text-base shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
                {itemCount}
              </span>
            </div>
            <span className="text-lg font-bold">₱{total.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Cart Sheet - Mobile only */}
      {showCart && (
        <CartSheet onClose={() => setShowCart(false)} showProfit={isOwner} />
      )}

      {/* Variant Selector */}
      {showVariantSelector && selectedProduct && (
        <VariantSelector
          product={selectedProduct}
          onClose={() => setShowVariantSelector(false)}
        />
      )}
    </div>
  )
}
```

##### Step 4 Verification Checklist
- [ ] No build errors — dev server is clean
- [ ] Navigate to `/pos` page in the browser
- [ ] **Branch selector** appears in the POS header and shows your branches
- [ ] **Category chips** load real categories from database
- [ ] **Products** load from the database (filtered by selected branch)
- [ ] **Search** filters products by name, brand, or variant SKU
- [ ] **Category filter** filters products by category
- [ ] **Single-variant product**: Tap "Add to Cart" → item added to cart
- [ ] **Multi-variant product**: Tap "Select Variant" → variant selector opens with real variants, prices, and stock
- [ ] **Variant selector**: Disabled variants with 0 stock, quantity stepper respects stock limit
- [ ] **Mobile** (`<768px`): Product grid (2-col), floating checkout button at bottom, cart opens as bottom sheet
- [ ] **Desktop** (`≥768px`): Split view — products on left, cart sidebar on right, no floating button
- [ ] **Empty state**: Shows "No products found" when search returns nothing
- [ ] **Loading state**: Skeleton cards show while data loads
- [ ] **Cart persists** across search/category changes (Zustand state)
- [ ] **Profit display**: Shows in cart for owner (`showProfit={true}`)
- [ ] Switch branches → products/stock update accordingly
- [ ] No console errors

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 5: Update Roadmap & Final Polish

- [ ] Update `docs/product/roadmap.md` at lines 621-664 to mark Day 15 items as complete. Change:

For lines 623-638, update the checkboxes from `[ ]` to `[x]`:
```markdown
1. [x] Create Staff Management & PIN Auth:
   - `app/(dashboard)/staff/page.tsx`
   - List staff members
   - Add/Edit staff modal (Name, Role, Branch, PIN)
   - Store PIN as hashed value (bcrypt/argon2)
2. [x] Create Staff Login API:
   - `app/api/auth/pin/route.ts`
   - Validate 6-digit PIN
   - Return custom JWT with `role: staff`
3. [x] Create POS layout (mobile-first):
   - `app/(dashboard)/pos/page.tsx`
   - Mobile: Full-screen product grid + floating cart button
   - Tablet/Desktop: Split view (products left, cart right)
   - Header: 60px height, cart badge, search icon
   - Floating checkout button: Full-width minus 32px, 64px height, green gradient
2. [x] Create cart state with Zustand:
   - `lib/hooks/useCart.ts`
```

Also update the Zustand interface checkboxes and the shadcn add line around line 661-664:
```markdown
3. [x] Add shadcn/ui components:
   ```bash
   npx shadcn@latest add sheet separator scroll-area
   ```
```

- [ ] Delete unused file `components/pos/checkout-cart.tsx` (it was a prototype duplicate of cart-sheet):

```bash
rm components/pos/checkout-cart.tsx
```

- [ ] Verify the dev server has no errors

##### Step 5 Verification Checklist
- [ ] Roadmap updated with Day 15 items checked off
- [ ] `checkout-cart.tsx` removed (unused prototype)
- [ ] Dev server clean — no build errors
- [ ] Full E2E flow: Login → POS → select branch → search/filter products → add to cart → see totals
- [ ] Responsive: test mobile (375px), tablet (768px), desktop (1280px)
- [ ] No console errors

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
