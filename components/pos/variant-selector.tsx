'use client'

import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'

interface VariantSelectorProps {
  product: any
  onAddToCart: (variant: string, quantity: number) => void
  onClose: () => void
}

const VARIANTS = {
  3: ['Straw', 'Mint', 'Mango'],
  1: ['Black', 'Silver', 'Blue'],
  5: ['Standard', 'Premium', 'Ultra'],
  7: ['Mint', 'Berry', 'Tropical', 'Vanilla'],
}

export default function VariantSelector({ product, onAddToCart, onClose }: VariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [quantity, setQuantity] = useState(1)

  const variants = VARIANTS[product.id as keyof typeof VARIANTS] || ['Standard']

  const handleAddToCart = () => {
    if (selectedVariant) {
      onAddToCart(selectedVariant, quantity)
    }
  }

  const subtotal = product.price * quantity

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
              {product.image}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground leading-tight">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
              <p className="text-base font-bold text-primary mt-1">₱{product.price.toLocaleString()}</p>
            </div>
          </div>

          {/* Variant Selection - Grid with Chips */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Flavor/Type</label>
            <div className="grid grid-cols-3 gap-2">
              {variants.map(variant => (
                <button
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  className={`py-2.5 px-3 rounded-xl border-2 transition-all text-xs font-semibold touch-target ${
                    selectedVariant === variant
                      ? 'border-primary bg-primary/15 text-primary shadow-md shadow-primary/20'
                      : 'border-border/60 bg-secondary/40 text-foreground hover:border-border/80'
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Stepper - Large Touch Targets */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quantity</label>
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
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 bg-secondary/60 hover:bg-secondary rounded-lg transition-colors touch-target"
              >
                <Plus className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Subtotal Preview Box */}
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Subtotal</span>
              <span className="text-xl font-bold text-primary">₱{subtotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Stock: {product.stock} available</p>
          </div>

          {/* Action Buttons - Full Width */}
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
