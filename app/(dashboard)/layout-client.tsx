'use client'

import { useState } from 'react'
import { Header } from '@/components/layouts/Header'
import { Sidebar } from '@/components/layouts/Sidebar'
import { MobileNav } from '@/components/layouts/MobileNav'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingCart,
  Package,
  Building2,
  Users,
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
      label: 'Staff',
      href: '/staff',
      icon: Users,
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
        <main className="flex-1" role="main">{children}</main>
      </div>
      <MobileNav
        userRole={userRole}
        canManageInventory={canManageInventory}
        canViewReports={canViewReports}
      />

      {/* Mobile navigation sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card border-r border-border">
          <div className="flex h-[60px] items-center border-b border-border px-6">
            <SheetTitle className="text-base font-bold">VapeTrack PH</SheetTitle>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]',
                    'hover:bg-secondary hover:text-foreground',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border p-4 bg-card">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {userFullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{userFullName}</span>
                <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
