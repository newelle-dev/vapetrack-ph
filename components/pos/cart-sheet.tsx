'use client'

import { useState } from 'react'
import { X, Minus, Plus, Trash2 } from 'lucide-react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  variant?: string | null
  cost: number
}

interface CartSheetProps {
  items: CartItem[]
  onClose: () => void
  onUpdateCart: (items: CartItem[]) => void
}

function CartSheet({ items, onClose, onUpdateCart }: CartSheetProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('cash')
  const [customerName, setCustomerName] = useState('')

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * 0.12)
  const total = subtotal + tax

  const totalProfit = items.reduce((sum, item) => sum + (item.price - item.cost) * item.quantity, 0)

  const handleRemoveItem = (id: number, variant: string | null | undefined) => {
    onUpdateCart(items.filter(item => !(item.id === id && item.variant === variant)))
  }

  const handleUpdateQuantity = (id: number, variant: string | null | undefined, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id, variant)
      return
    }
    onUpdateCart(
      items.map(item =>
        item.id === id && item.variant === variant ? { ...item, quantity } : item
      )
    )
  }

  const handleCompleteSale = () => {
    console.log('[v0] Sale completed:', {
      items,
      subtotal,
      tax,
      total,
      profit: totalProfit,
      paymentMethod,
      customerName,
    })
    onUpdateCart([])
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
            <p className="text-xs text-muted-foreground">{items.length} items</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div>
                <p className="text-lg text-muted-foreground font-medium">Cart is empty</p>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const itemProfit = (item.price - item.cost) * item.quantity
              return (
                <div
                  key={`${item.id}-${item.variant}`}
                  className="flex gap-3 bg-secondary/30 rounded-[14px] p-3 border border-border/30 hover:border-border/50 transition-colors"
                >
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1">{item.name}</h3>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">{item.variant}</p>
                    )}
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-base font-bold text-primary">₱{item.price.toLocaleString()}</p>
                      {itemProfit > 0 && (
                        <p className="text-xs text-success font-medium">+₱{itemProfit}</p>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.variant, Math.max(1, item.quantity - 1))}
                      className="p-1.5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors touch-target"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-8 text-center">
                      <p className="font-bold text-sm text-foreground">{item.quantity}</p>
                    </div>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                      className="p-1.5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors touch-target"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id, item.variant)}
                      className="p-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors touch-target ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Sticky Footer */}
        {items.length > 0 && (
          <div className="border-t border-border/50 bg-card px-4 py-3 space-y-3">
            {/* Optional Customer Name */}
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary rounded-[12px] border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
            />

            {/* Totals Card */}
            <div className="bg-linear-to-br from-primary/15 to-primary/5 rounded-[14px] p-3 border border-primary/20 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Tax (12%)</span>
                <span className="text-warning font-medium">₱{tax.toLocaleString()}</span>
              </div>
              {totalProfit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit</span>
                  <span className="text-success font-semibold">₱{totalProfit.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">₱{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Payment</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Cash', emoji: '💵' },
                  { id: 'gcash', label: 'GCash', emoji: '📱' },
                  { id: 'card', label: 'Card', emoji: '💳' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as 'cash' | 'gcash' | 'card')}
                    className={`py-2.5 px-3 rounded-[12px] border-2 transition-all text-xs font-semibold touch-target flex flex-col items-center gap-1 ${
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

            {/* Complete Sale Button - Full Width */}
            <button
              onClick={handleCompleteSale}
              className="w-full bg-primary text-primary-foreground rounded-[12px] py-4 font-bold text-base touch-target hover:bg-primary/90 active:scale-95 shadow-lg hover:shadow-xl transition-all"
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
