'use client'

import { useState } from 'react'
import { ShoppingCart, Package } from 'lucide-react'
import { Header } from '@/components/layouts/Header'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import Link from 'next/link'

interface StaffLayoutClientProps {
  children: React.ReactNode
  userFullName: string
  userRole: string
  canManageInventory: boolean
}

export function StaffLayoutClient({
  children,
  userFullName,
  userRole,
  canManageInventory,
}: StaffLayoutClientProps) {
  const [inventorySheetOpen, setInventorySheetOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Header
        userFullName={userFullName}
        userRole={userRole}
        onMenuClick={() => {}}
      />
      <main className="flex-1">
        {children}
      </main>

      {/* Quick Actions FAB - Show only on non-POS pages */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {canManageInventory && (
          <Button
            size="lg"
            variant="secondary"
            className="size-14 rounded-full shadow-lg"
            onClick={() => setInventorySheetOpen(true)}
            title="Quick Inventory Lookup"
          >
            <Package className="size-6" />
          </Button>
        )}
        <Link href="/pos">
          <Button
            size="lg"
            className="size-16 rounded-full shadow-xl"
            title="Open POS"
          >
            <ShoppingCart className="size-7" />
          </Button>
        </Link>
      </div>

      {/* Quick Inventory Lookup Sheet */}
      <Sheet open={inventorySheetOpen} onOpenChange={setInventorySheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Quick Inventory Lookup</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Read-only inventory view for staff. Search and check stock levels.
            </p>
            {/* TODO: Implement read-only inventory search component */}
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <Package className="mx-auto size-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Inventory lookup component coming soon
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
