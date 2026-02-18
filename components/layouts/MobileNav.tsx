'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getNavItems } from './menu-config'

interface MobileNavProps {
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
  lowStockCount?: number
}

export function MobileNav({
  userRole,
  canManageInventory,
  canViewReports,
  lowStockCount
}: MobileNavProps) {
  const pathname = usePathname()

  // Mobile bottom nav: show only the primary tabs for mobile users
  const navItems = getNavItems({ userRole, canManageInventory, canViewReports, lowStockCount })
  const visibleItems = navItems.filter((item) => item.show && item.mobile)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-lg md:hidden"
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
                'relative flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-1 px-3 py-2 transition-colors rounded-lg',
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="size-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold border border-background",
                    item.badgeColor === 'warning' ? "bg-yellow-500 text-white" : "bg-primary text-primary-foreground"
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
