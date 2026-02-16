'use client'

import { useState } from 'react'
import { Header } from '@/components/layouts/Header'
import { Sidebar } from '@/components/layouts/Sidebar'
import { MobileNav } from '@/components/layouts/MobileNav'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingCart,
  Package,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userFullName: string
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
}

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

export function DashboardLayoutClient({
  children,
  userFullName,
  userRole,
  canManageInventory,
  canViewReports,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, show: true },
    { label: 'POS', href: '/pos', icon: ShoppingCart, show: true },
    {
      label: 'Inventory',
      href: '/inventory',
      icon: Package,
      show: canManageInventory,
    },
    {
      label: 'Branches',
      href: '/branches',
      icon: Building2,
      show: userRole === 'owner',
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      show: canViewReports,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      show: userRole === 'owner',
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <div className="min-h-screen">
      <Sidebar
        userRole={userRole}
        canManageInventory={canManageInventory}
        canViewReports={canViewReports}
      />
      <div className="flex flex-col md:pl-60">
        <Header
          userFullName={userFullName}
          userRole={userRole}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <MobileNav
        userRole={userRole}
        canManageInventory={canManageInventory}
        canViewReports={canViewReports}
      />

      {/* Mobile navigation sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-60">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}