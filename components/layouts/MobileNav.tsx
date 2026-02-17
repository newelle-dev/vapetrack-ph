'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, ShoppingCart, Package, BarChart3, Settings, type LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

interface MobileNavProps {
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
}

export function MobileNav({
  userRole,
  canManageInventory,
  canViewReports,
}: MobileNavProps) {
  const pathname = usePathname()

  // Mobile bottom nav: show only the primary tabs for mobile users
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden"
      aria-label="Mobile navigation"
      role="navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}