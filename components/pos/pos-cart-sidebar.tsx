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
                                className={`py-2 px-2 rounded-lg border-2 transition-all text-xs font-semibold flex flex-col items-center gap-0.5 ${paymentMethod === method.id
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
