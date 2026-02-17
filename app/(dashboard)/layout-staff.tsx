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
import { usePathname } from 'next/navigation'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isPosPage = pathname === '/pos'

  // Minimal navigation for staff: Dashboard (to see sales) and POS
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Package }, // Reusing Package icon or similar if needed, but docs say "Profile" often
    { label: 'POS', href: '/pos', icon: ShoppingCart },
  ]

  return (
    <div
      className="min-h-screen"
      style={{
        // @ts-ignore - CSS variable
        '--safe-area-bottom': '10rem'
      } as React.CSSProperties}
    >
      <Header
        userFullName={userFullName}
        userRole={userRole}
        onMenuClick={() => setMobileMenuOpen(true)}
        alwaysShowMenu
      />
      <main className="flex-1">
        {children}
      </main>

      {/* Staff Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-60">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground min-h-[44px]"
            >
              <Package className="size-5" />
              My Sales Today
            </Link>
            <Link
              href="/pos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground min-h-[44px]"
            >
              <ShoppingCart className="size-5" />
              Point of Sale
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Quick Actions FAB - Show only on non-POS pages */}
      {/* Quick Actions FAB - Show only on non-POS pages */}
      {!isPosPage && (
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
      )}

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
