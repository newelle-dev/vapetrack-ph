'use client'

import { useState } from 'react'
import { Plus, ShoppingCart, Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ActionFABProps {
    onInventoryClick: () => void
    canManageInventory: boolean
}

export function ActionFAB({ onInventoryClick, canManageInventory }: ActionFABProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleMenu = () => setIsOpen(!isOpen)

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 md:hidden">
            {/* Action Buttons */}
            <div
                className={cn(
                    "flex flex-col items-end gap-3 transition-all duration-300 ease-in-out origin-bottom",
                    isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10 pointer-events-none"
                )}
            >
                {canManageInventory && (
                    <div className="flex items-center gap-3">
                        <span className="rounded-md bg-background/95 px-2 py-1 text-xs font-medium shadow-sm border border-border">
                            Inventory
                        </span>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-12 w-12 rounded-full shadow-lg border border-border"
                            onClick={() => {
                                onInventoryClick()
                                setIsOpen(false)
                            }}
                        >
                            <Package className="h-5 w-5" />
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <span className="rounded-md bg-background/95 px-2 py-1 text-xs font-medium shadow-sm border border-border">
                        New Sale
                    </span>
                    <Link href="/pos" onClick={() => setIsOpen(false)}>
                        <Button
                            size="icon"
                            className="h-12 w-12 rounded-full shadow-lg"
                        >
                            <ShoppingCart className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Toggle Button */}
            <Button
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl transition-transform duration-300",
                    isOpen ? "rotate-0 bg-destructive hover:bg-destructive/90" : "rotate-0"
                )}
                onClick={toggleMenu}
            >
                {isOpen ? (
                    <X className="h-6 w-6 transition-all" />
                ) : (
                    <Plus className="h-6 w-6 transition-all" />
                )}
            </Button>
        </div>
    )
}
