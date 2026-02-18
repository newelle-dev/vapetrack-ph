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
