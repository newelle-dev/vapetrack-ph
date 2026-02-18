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
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-sm ${isLowStock
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
          className={`w-full rounded-lg py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 touch-target ${isSoldOut
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
