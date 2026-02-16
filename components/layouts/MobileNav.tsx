'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, ShoppingCart, Package, BarChart3, type LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

interface MobileNavProps {
  canManageInventory: boolean
  canViewReports: boolean
}

export function MobileNav({ canManageInventory, canViewReports }: MobileNavProps) {
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
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      show: canViewReports,
    },
  ]

  const visibleItems = navItems.filter((item) => item.show).slice(0, 4)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-12 flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}