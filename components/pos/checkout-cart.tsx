'use client'

import { useState } from 'react'
import { X, Minus, Plus, Trash2 } from 'lucide-react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  variant?: string
}

interface CheckoutCartProps {
  items: CartItem[]
  onClose: () => void
  onRemoveItem: (id: number, variant?: string) => void
  onUpdateQuantity: (id: number, variant: string | undefined, quantity: number) => void
  onCompleteSale: () => void
}

export default function CheckoutCart({
  items,
  onClose,
  onRemoveItem,
  onUpdateQuantity,
  onCompleteSale,
}: CheckoutCartProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('cash')
  const [customerName, setCustomerName] = useState('')

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * 0.12)
  const total = subtotal + tax

  const handleCompleteSale = () => {
    console.log('Sale completed:', {
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      customerName,
    })
    onCompleteSale()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Checkout Sheet */}
      <div className="bg-card rounded-t-[20px] border-t border-border/50 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-card border-b border-border/30 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {/* Cart Items */}
          {items.map((item) => (
            <div
              key={`${item.id}-${item.variant}`}
              className="flex gap-3 bg-secondary/30 rounded-xl p-3 border border-border/30 hover:border-border/50 transition-colors"
            >
              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>
                {item.variant && (
                  <p className="text-xs text-muted-foreground">{item.variant}</p>
                )}
                <p className="text-base font-bold text-primary mt-1">₱{item.price.toLocaleString()}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.variant, Math.max(1, item.quantity - 1))}
                  className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors touch-target"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-8 text-center">
                  <p className="font-bold text-sm text-foreground">{item.quantity}</p>
                </div>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                  className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors touch-target"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.id, item.variant)}
                  className="p-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors touch-target ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Footer with Total and Payment */}
        <div className="border-t border-border/50 bg-card px-4 py-4 space-y-3">
          {/* Optional Customer Name */}
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2.5 bg-secondary rounded-lg border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
          />

          {/* Totals */}
          <div className="bg-secondary/40 rounded-xl p-3 border border-border/30 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-border/30 pb-1.5">
              <span className="text-muted-foreground">Tax (12%)</span>
              <span className="text-warning font-medium">₱{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">₱{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: '💵 Cash', icon: '💵' },
                { id: 'gcash', label: '📱 GCash', icon: '📱' },
                { id: 'card', label: '💳 Card', icon: '💳' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as 'cash' | 'gcash' | 'card')}
                  className={`py-2.5 px-2 rounded-xl border-2 transition-all text-xs font-semibold touch-target ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/15 text-primary shadow-md shadow-primary/20'
                      : 'border-border/60 bg-secondary/40 text-foreground hover:border-border/80'
                  }`}
                >
                  <div className="text-lg mb-1">{method.icon}</div>
                  {method.label.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Complete Sale Button - Full Width */}
          <button
            onClick={handleCompleteSale}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-base touch-target hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  )
}
