import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getNavItems } from './menu-config'

interface SidebarProps {
  userRole: string
  canManageInventory: boolean
  canViewReports: boolean
  className?: string
  onLinkClick?: () => void
}

export function Sidebar({ userRole, canManageInventory, canViewReports }: SidebarProps) {
  return (
    <aside
      className="hidden md:fixed md:left-0 md:top-0 md:z-30 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-border md:bg-card"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-[60px] items-center border-b border-border px-6">
        <span className="text-base font-semibold">VapeTrack PH</span>
      </div>
      <SidebarNav
        userRole={userRole}
        canManageInventory={canManageInventory}
        canViewReports={canViewReports}
      />
    </aside>
  )
}

export function SidebarNav({
  userRole,
  canManageInventory,
  canViewReports,
  onLinkClick
}: SidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItems({ userRole, canManageInventory, canViewReports })
  const visibleItems = navItems.filter((item) => item.show)

  return (
    <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
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
  )
}
