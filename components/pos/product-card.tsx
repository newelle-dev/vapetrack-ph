'use client'

import { Plus, AlertCircle } from 'lucide-react'

interface Product {
  id: number
  name: string
  price: number
  cost: number
  image: string
  category: string
  stock: number
  hasVariants: boolean
}

interface ProductCardProps {
  product: Product
  onAddToCart: () => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isLowStock = product.stock <= 5
  const isSoldOut = product.stock === 0
  const profit = Math.round(product.price - product.cost)
  const profitMargin = Math.round((profit / product.price) * 100)

  return (
    <div className="group relative bg-card rounded-[16px] overflow-hidden border border-border/50 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]">
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-secondary/40 flex items-center justify-center text-4xl overflow-hidden border-b border-border/30">
        {product.image}
        
        {/* Stock Badge - Floating Position */}
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-sm ${
          isLowStock && !isSoldOut
            ? 'bg-accent/90 text-accent-foreground'
            : isSoldOut
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/80 text-primary-foreground'
        }`}>
          {isSoldOut ? '⚠ Out' : `${product.stock}x`}
        </div>

        {/* Low Stock Alert Icon */}
        {isLowStock && !isSoldOut && (
          <div className="absolute bottom-3 left-3">
            <AlertCircle className="w-4 h-4 text-accent animate-pulse" />
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
          <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
        </div>

        {/* Price & Profit Display */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex-1">
            <p className="text-lg font-bold text-primary">₱{product.price.toLocaleString()}</p>
            {profit > 0 && (
              <p className="text-xs text-success font-medium">
                Profit: ₱{profit.toLocaleString()} ({profitMargin}%)
              </p>
            )}
          </div>
        </div>

        {/* Add to Cart Button - Touch Optimized */}
        <button
          onClick={onAddToCart}
          disabled={isSoldOut}
          className={`w-full rounded-lg py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 touch-target ${
            isSoldOut
              ? 'bg-muted/40 text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md hover:shadow-lg'
          }`}
        >
          <Plus className="w-5 h-5" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}
