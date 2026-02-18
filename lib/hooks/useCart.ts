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
