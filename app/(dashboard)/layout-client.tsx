'use client'

import { useState } from 'react'
import { Header } from '@/components/layouts/Header'
import { Sidebar, SidebarNav } from '@/components/layouts/Sidebar'
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

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userFullName: string
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
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

  return (
    <div
      className="min-h-screen"
      style={{
        // @ts-ignore - CSS variable
        '--safe-area-bottom': '5rem'
      } as React.CSSProperties}
    >
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

          <SidebarNav
            userRole={userRole}
            canManageInventory={canManageInventory}
            canViewReports={canViewReports}
            onLinkClick={() => setMobileMenuOpen(false)}
          />

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
