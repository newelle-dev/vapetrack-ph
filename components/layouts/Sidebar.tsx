'use client'

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

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

interface SidebarProps {
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
}

export function Sidebar({ userRole, canManageInventory, canViewReports }: SidebarProps) {
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
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-30 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-border md:bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-bold">VapeTrack PH</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  )
}